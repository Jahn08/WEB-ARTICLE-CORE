using System;
using System.Collections.Generic;
using System.Linq;
using WebArticleLibrary.Helpers;
using WebArticleLibrary.Models;
using WebArticleLibrary.Model;
using WebArticleLibrary.Hubs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;

namespace WebArticleLibrary.Controllers
{
    [ApiController]
	public class ArticleController: ControllerBase, IDisposable
	{
		private ArticleLibraryContext _dbContext;

        private NotificationHub notificationHub;

		public ArticleController(ArticleLibraryContext dbContext, 
            IHubContext<NotificationHub> hub)
		{
            _dbContext = dbContext;

			_dbContext.OnNotificationAddedEvent += OnNotificationAddedEvent;

            notificationHub = new NotificationHub();
		}

		private void OnNotificationAddedEvent(UserNotification[] etities)
		{
			notificationHub.AddNotifications(etities);
		}

		public void Dispose()
		{
			if (_dbContext != null)
				_dbContext.OnNotificationAddedEvent -= OnNotificationAddedEvent;
		
            notificationHub?.Dispose();
        }

		const Int32 pageLength = 10;
		String[] defaultCategories = { "science", "politics", "literature", "travelling", "financies" };

		[HttpGet]
		[AllowAnonymous]
		public ActionResult GetDefaultCategories()
		{
			return Ok(defaultCategories);
		}

		#region Article

		[HttpPost]
		public ActionResult UpdateArticle(Article article)
		{
			Article curArt;
			var curUser = GetUserInfo();
			Int32 curUserId = curUser.id;

			DateTime now = DateTime.Now;
			Boolean newArticle = article.Id == 0;

			if (newArticle)
			{				
				// Creating a new article with a current user as its author
                curArt = new Article();
				curArt.AuthorId = curUserId;
				curArt.InsertDate = now;
			
				_dbContext.Article.Add(curArt);
            }
			else
			{
				curArt = _dbContext.Article.FirstOrDefault(a => a.Id == article.Id);

				if (curArt == null)
					return BadRequest("The requested article does not exist in the data base");
			}

			ArticleHistory history = null;

			if (!newArticle && curArt.Name != article.Name)
				history = AddHistory(curArt.Id, curUserId, "Name", article.Name, curArt.Name, now);

			curArt.Name = article.Name;

			if (!newArticle && curArt.Tags != article.Tags)
				history = AddHistory(curArt.Id, curUserId, "Tags", article.Tags, curArt.Tags, now);

			curArt.Tags = article.Tags;

			if (curArt.Status != ArticleStatus.ON_REVIEW && curArt.Status != ArticleStatus.ON_AMENDING)
			{
				if (!newArticle && !Enumerable.SequenceEqual(article.Content, curArt.Content))
					history = AddHistory(curArt.Id, curUserId, "Content", null, null, now);

				curArt.Content = article.Content;
			}

			if (article.ReviewedContent != null)
				curArt.ReviewedContent = article.ReviewedContent;

			if (!newArticle && curArt.Description != article.Description)
				history = AddHistory(curArt.Id, curUserId, "Description", article.Description, curArt.Description, now);

			curArt.Description = article.Description;

			Int32? assignedToId = null;

			if (!newArticle && curArt.Status != article.Status)
			{
				history = AddHistory(curArt.Id, curUserId, "Status", article.Status.ToString(),
						curArt.Status.ToString(), now);
				curArt.Status = article.Status;

				if (article.Status == ArticleStatus.APPROVED || article.Status == ArticleStatus.DRAFT)
				{
					if (curArt.Amendments.Any())
					{
						foreach (var am in curArt.Amendments)
						{
							am.Archived = true;
						}

						AddHistory(curArt.Id, curUserId, "Amendment.Archived", null, null, now);
					}

					curArt.ReviewedContent = null;

					if (curArt.AssignedToId.HasValue)
					{
						AddHistory(curArt.Id, curUserId, "AssignedTo", null,
							curArt.AssignedTo.Login, now);

						assignedToId = curArt.AssignedToId;
						curArt.AssignedToId = null;
					}

					if (article.Status == ArticleStatus.APPROVED)
					{
						AddNotification($"An article '{curArt.Name}' has been approved by {curUser.name} and published",
							history, true, curArt.AuthorId);
					}
					else
					{
						var recipients = new List<Int32>();
						recipients.Add(curArt.AuthorId);

						if (assignedToId.HasValue)
							recipients.Add(assignedToId.Value);

						AddNotification($"All ammendments related to an article '{curArt.Name}' have been archived as it has been returned to the draft state",
							history, recipients.ToArray());
					}
				}
				else if (article.Status == ArticleStatus.ON_EDIT && curArt.AssignedToId == curUserId)
					AddNotification($"An article '{curArt.Name}' has been sent on edit by {curUser.name}", history, curArt.AuthorId);
				else if (article.Status == ArticleStatus.ON_REVIEW && curArt.AuthorId == curUserId)
				{
					var text = $"An article '{curArt.Name}' has been sent on review by its author {curUser.name}";

					if (curArt.AssignedToId.HasValue)
						AddNotification(text, history, curArt.AssignedToId.Value);
					else
						AddNotification(text, history, true);
				}
				// It's considered to be a new article if it has just been sent - needs a notification
				else if (article.Status == ArticleStatus.CREATED)
					AddNotification($"{curUser.name} has added a new article '{curArt.Name}'", history, true);
			}

			if (history != null && curArt.AssignedToId != null)
			{
				AddNotification($"An article '{curArt.Name}' has been changed by its author {curUser.name}",
					history, curArt.AssignedToId.Value);
			}

			_dbContext.SaveChanges();

			if (newArticle && article.Status != ArticleStatus.DRAFT)
			{
				history = AddHistory(curArt.Id, curUserId, "CREATED", null, null, null);
				curArt.Status = article.Status;

				AddNotification($"{curUser.name} has added a new article '{curArt.Name}'", history, true);
				_dbContext.SaveChanges();
			}

			return Ok();
		}

        private UserInfo GetUserInfo()
        {
            return new UserStore(_dbContext).GetCurrentUserInfo(User.Identity);
        }

		[HttpGet]
		[CustomAuthorization(CustomAuthorizationAttribute.ADMIN_ROLE)]
		public ActionResult SetArticleAssignment(Int32 id, Boolean assign)
		{
			Article curArt = _dbContext.Article.FirstOrDefault(a => a.Id == id);

			if (curArt == null)
				return BadRequest("The requested article does not exist in the data base");

			var curUser = GetUserInfo();
			var curUserId = curUser.id;

			const String eventName = "AssignedTo";

			if (assign)
			{
				curArt.AssignedToId = curUserId;
				curArt.Status = ArticleStatus.ON_REVIEW;

				var history = AddHistory(id, curUserId, eventName, curUser.name, null);
				AddNotification($"{curUser.name} has signed up for reviewing an article '{curArt.Name}'",
					history, true, curArt.AuthorId);
			}
			else
			{
				curArt.Status = ArticleStatus.CREATED;

				foreach (var am in curArt.Amendments
                    .Where(a => a.AuthorId == curArt.AssignedToId && !a.Resolved).ToArray())
					curArt.Amendments.Remove(am);

				var history = AddHistory(id, curUserId, eventName, null, curArt.AssignedTo.Login);
				AddNotification($"{curUser.name} has backed out of reviewing an article '{curArt.Name}'",
					history, true, curArt.AuthorId);

				curArt.AssignedToId = null;
			}

			_dbContext.SaveChanges();

			return Ok();
		}

		[HttpDelete]
		public ActionResult RemoveArticle([ModelBinder]Int32[] ids)
		{
			var curUser = GetUserInfo();
			var arts = _dbContext.Article.Where(a => ids.Contains(a.Id));

			foreach (var curArt in arts)
			{
				if (curArt.AuthorId != curUser.id)
					return BadRequest("Only authors can delete their own articles");

				_dbContext.Article.Remove(curArt);
			}

			_dbContext.SaveChanges();

			return GetArticles();
		}


		[HttpGet]
		public ActionResult GetArticles(ArticleStatus? status = null,
			String assignedTo = null, String author = null, String tags = null, String text = null,
			DateTime? dateStart = null, DateTime? dateEnd = null, Int32 page = 1,
			ColumnIndex colIndex = ColumnIndex.DATE, Boolean asc = false, Boolean includeComments = false)
		{
			var curUser = GetUserInfo();
			var curUserId = curUser?.id;

			IQueryable<Article> articles = _dbContext.Article.AsQueryable();

			if (dateStart != null)
			{
				var date = dateStart.Value;
				articles = articles.Where(a => a.InsertDate >= date);
			}

			if (dateEnd != null)
			{
				var date = dateEnd.Value.Date.AddDays(1);
				articles = articles.Where(a => a.InsertDate < date);
			}

			if (status != null)
				articles = articles.Where(a => a.Status == status);

			if (!String.IsNullOrEmpty(tags))
			{
				tags = tags.ToUpper();
				articles = articles.Where(a => a.Tags.ToUpper().Contains(tags));
			}

			if (!String.IsNullOrEmpty(text))
			{
				text = text.ToUpper();
				articles = articles.Where(a => (a.Name + a.Description).ToUpper().Contains(text));
			}

			if (assignedTo != null)
			{
				assignedTo = assignedTo.ToUpper();
				articles = articles.Where(a => a.AssignedToId != null &&
					(a.AssignedTo.FirstName + a.AssignedTo.LastName + a.AssignedTo.PatronymicName)
						.ToUpper().Contains(assignedTo));
			}

			if (author != null)
			{
				author = author.ToUpper();
				var ids = _dbContext.User.Where(u => u.Login.ToUpper().Contains(author))
                    .Select(u => u.Id);
				articles = articles.Where(a => ids.Contains(a.AuthorId));
			}

			var privateArticles = articles.Where(a => a.AuthorId == curUserId);
			var privateData = OrderArticles(privateArticles, colIndex, asc).Select(a => new
			{
				id = a.Id,
				name = a.Name,
				tags = a.Tags,
				insertDate = a.InsertDate,
				assignedToId = a.AssignedToId,
				status = a.Status,
				description = a.Description
			}).ToArray();
			var privateDataCount = privateData.Count();
			var skip = (page - 1) * pageLength;
			privateData = privateData.Skip(skip).Take(pageLength).ToArray();

			var users = from u in _dbContext.User.Select(iu => new { iu.Id, iu.Login })
						join a in privateData.Select(p => p.assignedToId).Distinct() on u.Id equals a
						select u;

			IEnumerable<dynamic> publicData = null;
			Int32 publicDataCount = 0;

			if (curUser.status == UserStatus.ADMINISTRATOR)
			{
				var publicArticles = articles.Where(a => a.AuthorId != curUserId &&
					a.Status != ArticleStatus.DRAFT &&
					a.Status != ArticleStatus.ON_EDIT);
				publicData = OrderArticles(publicArticles, colIndex, asc).Select(a => new
				{
					id = a.Id,
					name = a.Name,
					tags = a.Tags,
					insertDate = a.InsertDate,
					assignedToId = a.AssignedToId,
					authorId = a.AuthorId,
					status = a.Status,
					description = a.Description
				});
				publicDataCount = publicData.Count();
				publicData = publicData.Skip(skip).Take(pageLength).ToArray();

				users = users.Union(from u in _dbContext.User.Select(iu => new { iu.Id, iu.Login })
									join a in publicData.SelectMany(p => new Int32[] { p.assignedToId ?? 0, p.authorId }).Distinct() on u.Id equals a
									select u);
			}

			var unionData = publicData == null ? privateData : privateData.Concat(publicData);
			var estimates = (from Int32 a in unionData.Select(d => d.id)
							 join est in _dbContext.UserEstimate
                                    .Select(e => new { e.ArticleId, e.Estimate }) 
                                on a equals est.ArticleId
							 select est).GroupBy(a => a.ArticleId);
			var commentNums = (from Int32 a in unionData.Select(d => d.id)
							   join est in _dbContext.UserComment.Select(e => new { e.ArticleId }) on a equals est.ArticleId
							   select est).GroupBy(a => a.ArticleId);

			return Ok(new
			{
				privateData = privateData,
				privateDataCount = privateDataCount,
				publicData = publicData,
				publicDataCount = publicDataCount,
				pageLength = pageLength,
				userNames = users.ToDictionary(k => k.Id, v => v.Login),
				estimates = estimates.ToDictionary(k => k.Key,
					v => v.Count(iv => iv.Estimate == EstimateType.POSITIVE) - 
                        v.Count(iv => iv.Estimate == EstimateType.NEGATIVE)),
				cmntNumber = commentNums.ToDictionary(k => k.Key, v => v.Count())
			});
		}

		[AllowAnonymous]
		[HttpGet]
		public ActionResult SearchArticles(String author = null, String tags = null, String text = null,
			DateTime? dateStart = null, DateTime? dateEnd = null,
			Int32 page = 1, ColumnIndex colIndex = ColumnIndex.DATE, Boolean asc = false)
		{
			var curUser = GetUserInfo();
			var curUserId = curUser?.id;

			IQueryable<Article> articles = _dbContext.Article.Where(a => a.Status == ArticleStatus.APPROVED);

			if (dateStart != null)
			{
				var date = dateStart.Value;
				articles = articles.Where(a => a.InsertDate >= date);
			}

			if (dateEnd != null)
			{
				var date = dateEnd.Value.AddDays(1);
				articles = articles.Where(a => a.InsertDate < date);
			}

			if (!String.IsNullOrEmpty(tags))
			{
				tags = tags.ToUpper();
				articles = articles.Where(a => a.Tags.ToUpper().Contains(tags));
			}

			if (!String.IsNullOrEmpty(text))
			{
				text = text.ToUpper();
				articles = articles.Where(a => (a.Name + a.Description).ToUpper().Contains(text));
			}

			if (author != null)
			{
				author = author.ToUpper();
				var ids = _dbContext.User.Where(u => u.Login.ToUpper().Contains(author)).Select(u => u.Id);
				articles = articles.Where(a => ids.Contains(a.AuthorId));
			}

			var data = OrderArticles(articles, colIndex, asc).Select(a => new
			{
				id = a.Id,
				name = a.Name,
				tags = a.Tags,
				insertDate = a.InsertDate,
				status = a.Status,
				description = a.Description,
				authorId = a.AuthorId
			}).ToArray();
			var dataCount = data.Count();
			var skip = (page - 1) * pageLength;
			data = data.Skip(skip).Take(pageLength).ToArray();

			var users = from u in _dbContext.User.Select(iu => new { iu.Id, iu.Login })
						join a in data.Select(p => p.authorId).Distinct() on u.Id equals a
						select u;

			var estimates = (from Int32 a in data.Select(d => d.id)
							 join est in _dbContext.UserEstimate.Select(e => new { e.ArticleId, e.Estimate }) on a equals est.ArticleId
							 select est).GroupBy(a => a.ArticleId);

			return Ok(new
			{
				articles = data,
				articleCount = dataCount,
				pageLength = pageLength,
				userNames = users.ToDictionary(k => k.Id, v => v.Login),
				estimates = estimates.ToDictionary(k => k.Key,
					v => v.Count(iv => iv.Estimate == EstimateType.POSITIVE) - v.Count(iv => iv.Estimate == EstimateType.NEGATIVE))
			});
		}

		private IQueryable<Article> OrderArticles(IQueryable<Article> source, ColumnIndex colIndex, Boolean asc)
		{
			switch (colIndex)
			{
				case ColumnIndex.NAME:
					source = asc ? source.OrderBy(s => s.Name) : source.OrderByDescending(s => s.Name);
					break;
				case ColumnIndex.DATE:
					source = asc ? source.OrderBy(s => s.InsertDate) : source.OrderByDescending(s => s.InsertDate);
					break;
				case ColumnIndex.TAGS:
					source = asc ? source.OrderBy(s => s.Tags) : source.OrderByDescending(s => s.Tags);
					break;
				case ColumnIndex.AUTHOR:
					source = asc ? source.OrderBy(s => s.Author.Login) : source.OrderByDescending(s => s.Author.Login);
					break;
				case ColumnIndex.STATUS:
					source = asc ? source.OrderBy(s => s.Status) : source.OrderByDescending(s => s.Status);
					break;
				case ColumnIndex.ASSIGNED_TO:
					source = asc ? source.OrderBy(s => s.AssignedTo == null ? null : s.AssignedTo.Login) :
						source.OrderByDescending(s => s.AssignedTo == null ? null : s.AssignedTo.Login);
					break;
				case ColumnIndex.ID:
					source = asc ? source.OrderBy(s => s.Id) : source.OrderByDescending(s => s.Id);
					break;
				case ColumnIndex.TEXT:
					source = asc ? source.OrderBy(s => s.Description) : source.OrderByDescending(s => s.Description);
					break;
			}

			return source;
		}

		[HttpGet]
		public ActionResult CreateArticleVersion(Int32 id)
		{
			var curArt = _dbContext.Article.FirstOrDefault(a => a.Id == id);

			if (curArt == null)
				return BadRequest("The requested article does not exist in the data base");

			Int32 curUserId = GetUserInfo().id;

			if (curArt.AuthorId != curUserId)
				return BadRequest("Only authors can create new versions of their articles");


			var newArt = new Article();

			DateTime now = DateTime.Now;
			newArt.InsertDate = now;

			var name = curArt.Name.Length > 150 ? curArt.Name.Substring(0, 150) : curArt.Name;
			newArt.Name = name + "_" + Guid.NewGuid().ToString();
			newArt.Content = curArt.Content;
			newArt.AuthorId = curArt.AuthorId;
			newArt.Tags = curArt.Tags;
			newArt.Description = curArt.Description;

            _dbContext.Article.Add(newArt);

			_dbContext.SaveChanges();

			AddHistory(curArt.Id, curUserId, "CHILD VERSION", null, null, now, newArt.Id);
			AddHistory(newArt.Id, curUserId, "PARENT VERSION", null, null, now, curArt.Id);

			_dbContext.SaveChanges();

			return Ok(new { id = newArt.Id });
		}

		[HttpGet]
		[AllowAnonymous]
		public ActionResult GetArticleTitles()
		{
			var articles = _dbContext.Article.Where(art => art.Status == ArticleStatus.APPROVED &&
					defaultCategories.Any(c => art.Tags.Contains(c)))
				.Select(art => new
				{
					id = art.Id,
					authorId = art.AuthorId,
					name = art.Name,
					tags = art.Tags,
					insertDate = art.InsertDate,
					estimate = art.UserEstimates.Count(e => e.Estimate == EstimateType.POSITIVE) -
						art.UserEstimates.Count(e => e.Estimate == EstimateType.NEGATIVE)
				})
				.OrderByDescending(a => a.estimate)
				.ThenByDescending(a => a.insertDate)
				.Take(15).ToArray();

			var userNames = (from a in articles
							 join user in _dbContext.User.Where(u => u.Status != UserStatus.BANNED)
								 .Select(u => new { id = u.Id, login = u.Login })
							 on a.authorId equals user.id
							 select user).Distinct().ToDictionary(k => k.id, v => v.login);

			return Ok(new
			{
				articles = articles,
				userNames = userNames
			});
		}

		[AllowAnonymous]
		[HttpGet]
		public ActionResult ViewArticle(Int32 id, Int32? userId = null)
		{
			var article = _dbContext.Article.FirstOrDefault(a => a.Id == id);
			var comments = userId.HasValue ? _dbContext.UserComment.Where(c => c.ArticleId == article.Id)
				.OrderBy(c => c.InsertDate).ToArray() : null;

			Dictionary<Int32, Byte[]> photos = new Dictionary<Int32, Byte[]>();
			Dictionary<Int32, String> names = new Dictionary<Int32, String>();

			if (comments != null)
			{
				var userInfos = (from u in _dbContext.User.Select(u => new
				{
					id = u.Id,
					photo = u.Photo,
					login = u.Login
				})
					join c in comments.Select(ct => ct.AuthorId).Union(new[] { article.AuthorId })
						on u.id equals c
					select u).ToDictionary(k => k.id, v => new { photo = v.photo, login = v.login });

				foreach (var c in userInfos)
				{
					photos.Add(c.Key, c.Value.photo);
					names.Add(c.Key, c.Value.login);
				}
			}
			else
			{
				var _author = _dbContext.User.Where(a => a.Id == article.AuthorId)
					.Select(u => new
					{
						id = u.Id,
						photo = u.Photo,
						login = u.Login
					}).FirstOrDefault();
				photos.Add(_author.id, _author.photo);
				names.Add(_author.id, _author.login);
			}

			return Ok(new
			{
				article = article,
				updatedDate = _dbContext.ArticleHistory.Where(h => h.ArticleId == article.Id)
					.Select(h => h.InsertDate)
					.OrderByDescending(h => h)
					.FirstOrDefault(),
				comments = comments,
				userNames = names,
				userPhotos = photos,
				estimate = article.GetFinalEstimate(),
				curEstimate = _dbContext.UserEstimate
                    .Where(e => e.AuthorId == userId && e.ArticleId == id)
					.Select(e => e.Estimate)
					.FirstOrDefault()
			});
		}

		#endregion

		#region COMMENT

		[HttpPost]
		public ActionResult CreateComment(UserComment comment)
		{
			var articleId = comment.ArticleId;
			var article = _dbContext.Article.FirstOrDefault(a => a.Id == articleId);

			if (article == null)
				return BadRequest("The requested article does not exist in the data base");

			// If a user can create a comment according to a current status of an article
			if (article.Status != ArticleStatus.APPROVED)
				return BadRequest("The article ought to be approved to have comments");

			var curUser = GetUserInfo();
			var curUserId = curUser.id;

            var entity = new UserComment();
			entity.InsertDate = DateTime.Now;
			entity.ArticleId = article.Id;
			entity.AuthorId = curUserId;
			entity.Content = comment.Content;
			entity.Status = CommentStatus.CREATED;
			entity.ResponseToId = comment.ResponseToId;

			_dbContext.UserComment.Add(entity);

			_dbContext.SaveChanges();

			var history = AddHistory(articleId, curUserId, "COMMENT CREATED", null, null, null, entity.Id);

			if (curUserId != article.AuthorId)
				AddNotification($"{curUser.name} has added a comment #{entity.Id.ToString()} for an article '{article.Name}'",
					history, article.AuthorId);

			_dbContext.SaveChanges();
			return Ok(entity);
		}

		[HttpGet]
		public ActionResult UpdateCommentStatus(Int32 id, CommentStatus status)
		{
			var entity = _dbContext.UserComment.FirstOrDefault(c => c.Id == id);

			if (entity == null)
				return BadRequest("The requested comment does not exist in the data base");

			var curUser = GetUserInfo();

			var now = DateTime.Now;
			var history = AddHistory(entity.ArticleId, curUser.id, "COMMENT.Status", status.ToString(),
				entity.Status.ToString(), now, entity.Id);

			if (status == CommentStatus.DELETED)
			{
				if (entity.AuthorId != curUser.id)
					return BadRequest("A comment can only be removed by its author");

				var artName = entity.Article.Name;
				List<Int32> participants = new List<Int32>();

				foreach (var cmpln in entity.UserComplaints)
				{
					participants.Add(cmpln.AuthorId);

					if (cmpln.AssignedToId.HasValue)
						participants.Add(cmpln.AssignedToId.Value);
				}

				AddNotification($"A comment #{entity.Id.ToString()} for an article '{artName}' was removed by his author",
					history, true, participants.ToArray());

				// Doesn't have a cascade removal
				_dbContext.UserComplaint.RemoveRange(entity.UserComplaints);

				if (entity.RelatedComments.Any())
					entity.Status = CommentStatus.DELETED;
				else
					RemoveComment(entity, now);
			}
			else
			{
				if (curUser.status != UserStatus.ADMINISTRATOR)
					return BadRequest("You does not have rights to change statuses of comments");

				var art = entity.Article;

				var participants = new List<Int32>();
				participants.Add(entity.AuthorId);

				if (entity.AuthorId != art.AuthorId)
					participants.Add(art.AuthorId);

				AddNotification($"The administrator {curUser.name} has blocked a comment #{entity.Id.ToString()} for an article '{art.Name}'",
					history, true, participants.ToArray());

				entity.Status = status;
			}

			_dbContext.SaveChanges();

			return Ok();
		}

		[HttpGet]
		public ActionResult GetComments(Int32 page = 1, ColumnIndex colIndex = ColumnIndex.DATE,
			Boolean asc = false, String id = null, String articleName = null,
			DateTime? dateStart = null, DateTime? dateEnd = null, CommentStatus? status = null,
			Int32? userId = null, Int32? parentId = null, Boolean all = false)
		{
			IQueryable<UserComment> cmnts = _dbContext.UserComment
				.Where(c => c.Article.Status == ArticleStatus.APPROVED);

			if (userId != null)
			{
				cmnts = cmnts.Where(c => c.AuthorId == userId);
			}

			if (parentId != null)
			{
				cmnts = cmnts.Where(c => c.ResponseToId == parentId);
			}

			if (dateStart != null)
			{
				cmnts = cmnts.Where(c => c.InsertDate >= dateStart);
			}

			if (dateEnd != null)
			{
				var filterDate = dateEnd.Value.Date.AddDays(1);
				cmnts = cmnts.Where(c => c.InsertDate < filterDate);
			}

			if (status != null)
			{
				cmnts = cmnts.Where(c => c.Status == status);
			}

			if (id != null)
			{
				cmnts = cmnts.Where(c => c.Id.ToString().Contains(id));
			}

			if (articleName != null)
			{
				var filterVal = articleName.ToUpper();
				cmnts = cmnts.Where(c => c.Article.Name.ToUpper().Contains(filterVal));
			}

			Int32 dataCount = cmnts.Count();

			cmnts = OrderComments(cmnts, colIndex, asc);
			UserComment[] cmntData = (all ? cmnts : cmnts.Skip((page - 1) * pageLength).Take(pageLength)).ToArray();

			return Ok(new
			{
				data = cmntData,
				dataCount = dataCount,
				articleNames = cmntData.Select(c => new
				{
					artId = c.Article.Id,
					artName = c.Article.Name
				}).Distinct().ToDictionary(k => k.artId, v => v.artName),
				userNames = cmntData.Select(c => new
				{
					authorId = c.AuthorId,
					authorLogin = c.Author.Login,
				}).Distinct().ToDictionary(k => k.authorId, v => v.authorLogin),
				complaintNumber = cmntData
					.Where(c => c.UserComplaints.Any()).ToDictionary(k => k.Id, v => v.UserComplaints.Count),
				relatedCmntNumber = cmntData
					.Where(c => c.RelatedComments.Any()).ToDictionary(k => k.Id, v => v.RelatedComments.Count),
				pageLength = pageLength
			});
		}

		private IQueryable<UserComment> OrderComments(IQueryable<UserComment> source, ColumnIndex colIndex, Boolean asc)
		{
			switch (colIndex)
			{
				case ColumnIndex.DATE:
					source = asc ? source.OrderBy(s => s.InsertDate) : source.OrderByDescending(s => s.InsertDate);
					break;
				case ColumnIndex.STATUS:
					source = asc ? source.OrderBy(s => s.Status) : source.OrderByDescending(s => s.Status);
					break;
				case ColumnIndex.ID:
					source = asc ? source.OrderBy(s => s.Id) : source.OrderByDescending(s => s.Id);
					break;
				case ColumnIndex.ARTICLE:
					source = asc ? source.OrderBy(s => s.Article.Name) : source.OrderByDescending(s => s.Article.Name);
					break;
			}

			return source;
		}

		private void RemoveComment(UserComment cmnt, DateTime now)
		{
			var parentId = cmnt.ResponseToId;

			AddHistory(cmnt.ArticleId, cmnt.AuthorId, "COMMENT REMOVED", null, null,
				now, cmnt.Id);
			_dbContext.UserComment.Remove(cmnt);
				
			if (parentId != null)
			{
				// There might be other parental comments waited to be deleted
				UserComment parentalEntity = _dbContext.UserComment.FirstOrDefault(c => c.Id == parentId);

				if (parentalEntity != null && parentalEntity.Status == CommentStatus.DELETED &&
					!parentalEntity.RelatedComments.Any())
					RemoveComment(parentalEntity, now);
			}
		}

		#endregion

		#region Complaint

		[HttpPost]
		public ActionResult CreateComplaint(UserComplaint complaint)
		{
			var curUser = GetUserInfo();
			var curUserId = curUser.id;

            var entity = new UserComplaint();

			Int32 articleId;
			String notificationStr = null;

			var recipients = new List<Int32>();

			if (complaint.UserCommentId.HasValue)
			{
				var commentId = complaint.UserCommentId;
				var comment = _dbContext.UserComment.FirstOrDefault(a => a.Id == commentId);

				if (comment == null)
					return BadRequest("The requested comment does not exist in the data base");

				var article = comment.Article;

				// If a user can create a comment according to a current status of an article
				if (article.Status != ArticleStatus.APPROVED)
					return BadRequest("The article ought to be approved to have complaints");

				entity.UserCommentId = commentId;
				entity.ArticleId = articleId = article.Id;

				recipients.Add(article.AuthorId);

				if (comment.AuthorId != article.AuthorId)
					recipients.Add(comment.AuthorId);

				notificationStr = $"{curUser.name} has complained about a comment #{commentId} for an article '{article.Name}'";
			}
			else
			{
				articleId = complaint.ArticleId;
				var article = _dbContext.Article.FirstOrDefault(a => a.Id == articleId);

				if (article == null)
					return BadRequest("The requested article does not exist in the data base");

				// If a user can create a comment according to a current status of an article
				if (article.Status != ArticleStatus.APPROVED)
					return BadRequest("The article ought to be approved to have complaints");

				entity.ArticleId = articleId;

				recipients.Add(article.AuthorId);
				notificationStr = $"{curUser.name} has complained about an article '{article.Name}'";
			}

			entity.InsertDate = DateTime.Now;
			entity.AuthorId = curUserId;
			entity.Text = complaint.Text;
			entity.Status = ComplaintStatus.CREATED;

			_dbContext.UserComplaint.Add(entity);

			_dbContext.SaveChanges();

			var history = AddHistory(articleId, curUserId, "Complaint CREATED", null, null, null, entity.Id);
			AddHistory(articleId, curUserId, "Complaint.Content", entity.Text, null, null, entity.Id);

			AddNotification(notificationStr, history, true, recipients.ToArray());

			_dbContext.SaveChanges();
			return Ok(entity);
		}

		[HttpGet]
		[CustomAuthorization(CustomAuthorizationAttribute.ADMIN_ROLE)]
		public ActionResult SetComplaintStatus(Int32 id, ComplaintStatus status, String response)
		{
			var entity = _dbContext.UserComplaint.FirstOrDefault(c => c.Id == id);

			if (entity == null)
				return BadRequest("The requested complaint does not exist in the data base");

			var curUser = GetUserInfo();
			var now = DateTime.Now;

			String notificationStr = null;
			var recipients = new List<Int32>();

			var art = entity.Article;

			if (status == ComplaintStatus.APPROVED)
			{
				if (entity.UserCommentId.HasValue)
				{
					var cmnt = entity.UserComment;
					cmnt.Status = CommentStatus.BLOCKED;

					notificationStr = $"A complaint about a comment #{entity.UserCommentId.Value.ToString()}" +
						$" for an article '{art.Name}' has been approved by {curUser.name} and the comment has been blocked" +
						$" with a response: '{response}'";

					recipients.Add(cmnt.AuthorId);
					recipients.Add(entity.AuthorId);

					if (entity.AuthorId != art.AuthorId && cmnt.AuthorId != art.AuthorId)
						recipients.Add(art.AuthorId);
				}
				else
				{
					art.Status = ArticleStatus.ON_EDIT;

					Amendment amd = new Amendment();
					art.AssignedToId = curUser.id;

					amd.AuthorId = curUser.id;
					amd.Content = response;
					amd.InsertDate = now;

					art.Amendments.Add(amd);

					_dbContext.SaveChanges();

					AddHistory(entity.ArticleId, curUser.id, "Amendment CREATED", null, null, null, amd.Id);
					AddHistory(entity.ArticleId, curUser.id, "Amendment.Content", amd.Content, null, null, amd.Id);

					notificationStr = $"A complaint about an article '{art.Name}' has been approved" +
						$" by {curUser.name} and the article has been sent to be edited";

					recipients.Add(entity.AuthorId);
					recipients.Add(art.AuthorId);
				}
			}
			else
			{
				if (entity.UserCommentId.HasValue)
				{
					var cmnt = entity.UserComment;

					recipients.Add(cmnt.AuthorId);
					recipients.Add(entity.AuthorId);

					if (entity.AuthorId != art.AuthorId && cmnt.AuthorId != art.AuthorId)
						recipients.Add(art.AuthorId);

					notificationStr = $"A complaint about a comment #{entity.UserCommentId.Value.ToString()}" +
						$" for an article '{art.Name}' has been declined by {curUser.name} with a response: '{response}'";
				}
				else
				{
					recipients.Add(entity.AuthorId);
					recipients.Add(art.AuthorId);

					notificationStr = $"A complaint about an article '{art.Name}' has been declined" +
						$" by {curUser.name} with a response: '{response}'";
				}
			}

			var history = AddHistory(entity.ArticleId, curUser.id,
				"Complaint.Status", status.ToString(), entity.Status.ToString(), now, entity.Id);
			AddHistory(entity.ArticleId, curUser.id, "Complaint.RESPONSE", response,
				null, now, entity.Id);

			AddNotification(notificationStr, history, recipients.ToArray());

			entity.Status = status;

			AddHistory(entity.ArticleId, curUser.id, "Complaint.AssignedTo", null,
				entity.AssignedTo.Login, now, entity.Id);

			entity.AssignedToId = null;
			_dbContext.SaveChanges();

			return Ok();
		}

		[HttpGet]
		[CustomAuthorization(CustomAuthorizationAttribute.ADMIN_ROLE)]
		public ActionResult SetComplaintAssignment(Int32 id, Boolean assign)
		{
			var entity = _dbContext.UserComplaint.FirstOrDefault(a => a.Id == id);

			if (entity == null)
				return BadRequest("The requested complaint does not exist in the data base");

			var curUser = GetUserInfo();
			var curUserId = curUser.id;

			const String eventName = "Complaint.AssignedTo";
			var now = DateTime.Now;

			ArticleHistory history;
			List<Int32> recipients = new List<Int32>();

			String notificationStr = "A complaint about ";

			var art = entity.Article;

			if (entity.UserCommentId.HasValue)
				notificationStr += $"a comment #{entity.UserCommentId.Value.ToString()} for ";

			notificationStr += $"an article '{art.Name}' ";

			if (assign)
			{
				entity.AssignedToId = curUserId;
				history = AddHistory(entity.ArticleId, curUserId, eventName, curUser.name, null,
					now, entity.Id);
				notificationStr += $"has been assigned to {curUser.name}";
			}
			else
			{
				history = AddHistory(entity.ArticleId, curUserId, eventName, null, entity.AssignedTo.Login,
					now, entity.Id);
				entity.AssignedToId = null;
				notificationStr += $"has been removed from the {curUser.name}'s assignments";
			}

			recipients.Add(entity.AuthorId);

			if (entity.UserCommentId.HasValue)
			{
				Int32 cmntAuthorId = entity.UserComment.AuthorId;
				recipients.Add(cmntAuthorId);

				Int32 artAuthorId = art.AuthorId;
				if (entity.AuthorId != artAuthorId && cmntAuthorId != artAuthorId)
					recipients.Add(artAuthorId);
			}
			else
			{
				recipients.Add(entity.Article.AuthorId);
			}

			AddNotification(notificationStr, history, true, recipients.ToArray());
			_dbContext.SaveChanges();

			return Ok();
		}

		[HttpGet]
		[CustomAuthorization(CustomAuthorizationAttribute.ADMIN_ROLE)]
		public ActionResult GetComplaints(Int32 page = 1, ColumnIndex colIndex = ColumnIndex.DATE,
			Boolean asc = false, String text = null, ComplaintStatus? status = null,
			String author = null, String assignedTo = null,
			DateTime? dateStart = null, DateTime? dateEnd = null,
			ComplaintEntityType? entityType = null, String entity = null)
		{
			var curUser = GetUserInfo();
			IQueryable<UserComplaint> data = _dbContext.UserComplaint
				.Where(c => c.Article.Status == ArticleStatus.APPROVED);

			if (dateStart != null)
			{
				var filter = dateStart.Value.Date;
				data = data.Where(c => c.InsertDate > filter);
			}

			if (dateEnd != null)
			{
				var filter = dateEnd.Value.Date.AddDays(1);
				data = data.Where(c => c.InsertDate < filter);
			}

			if (status != null)
			{
				data = data.Where(c => c.Status == status);
			}

			if (entityType != null)
			{
				if (entityType == ComplaintEntityType.ARTICLE)
					data = data.Where(c => c.UserCommentId == null);
				else
					data = data.Where(c => c.UserCommentId != null);
			}

			if (entity != null)
			{
				var filter = entity.ToUpper();
				data = data.Where(c => (c.UserCommentId == null ? c.Article.Name.ToUpper() :
					c.UserCommentId.ToString()).Contains(filter));
			}

			if (assignedTo != null)
			{
				var filter = assignedTo.ToUpper();
				data = data.Where(c => c.AssignedToId != null && c.AssignedTo.Login.ToUpper().Contains(filter));
			}

			if (author != null)
			{
				var filter = author.ToUpper();
				data = data.Where(c => c.Author.Login.ToUpper().Contains(filter));
			}

			if (text != null)
			{
				var filter = text.ToUpper();
				data = data.Where(c => c.Text.ToUpper().Contains(filter));
			}

			Int32 dataCount = data.Count();
			var cmplns = OrderComplaints(data, colIndex, asc)
				.Skip((page - 1) * pageLength)
				.Take(pageLength);

			var users = from u in _dbContext.User.Select(iu => new { iu.Id, iu.Login })
						join a in cmplns.SelectMany(p => new Int32[] { p.AssignedToId ?? 0, p.AuthorId }).Distinct() on u.Id equals a
						select u;

			var articles = from a in _dbContext.Article.Select(a => new { a.Id, a.Name })
						   join c in cmplns.Select(p => p.ArticleId).Distinct() on a.Id equals c
						   select a;

			var comments = from e in _dbContext.UserComment.Select(d => new { d.Id, d.Content })
						   join c in cmplns.Where(p => p.UserCommentId != null)
								.Select(p => p.UserCommentId).Distinct() on e.Id equals c
						   select e;

			return Ok(new
			{
				data = cmplns.Select(c => new
				{
					authorId = c.AuthorId,
					assignedToId = c.AssignedToId,
					articleId = c.ArticleId,
					insertDate = c.InsertDate,
					id = c.Id,
					status = c.Status,
					text = c.Text,
					userCommentId = c.UserCommentId,
					cmntAuthorId = c.UserComment == null ? null : (Int32?)c.UserComment.AuthorId,
					articleAuthorId = c.Article.AuthorId
				}).ToArray(),
				dataCount = dataCount,
				userNames = users.ToDictionary(k => k.Id, v => v.Login),
				articleNames = articles.ToDictionary(k => k.Id, v => v.Name),
				comments = comments.ToDictionary(k => k.Id, v => v.Content),
				pageLength = pageLength
			});
		}

		private IQueryable<UserComplaint> OrderComplaints(IQueryable<UserComplaint> source, ColumnIndex colIndex, Boolean asc)
		{
			switch (colIndex)
			{
				case ColumnIndex.TEXT:
					source = asc ? source.OrderBy(s => s.Text) : source.OrderByDescending(s => s.Text);
					break;
				case ColumnIndex.DATE:
					source = asc ? source.OrderBy(s => s.InsertDate) : source.OrderByDescending(s => s.InsertDate);
					break;
				case ColumnIndex.AUTHOR:
					source = asc ? source.OrderBy(s => s.Author.Login) : source.OrderByDescending(s => s.Author.Login);
					break;
				case ColumnIndex.STATUS:
					source = asc ? source.OrderBy(s => s.Status) : source.OrderByDescending(s => s.Status);
					break;
				case ColumnIndex.ASSIGNED_TO:
					source = asc ? source.OrderBy(s => s.AssignedTo == null ? null : s.AssignedTo.Login) :
						source.OrderByDescending(s => s.AssignedTo == null ? null : s.AssignedTo.Login);
					break;
				case ColumnIndex.ID:
					source = asc ? source.OrderBy(s => s.UserCommentId == null ? s.UserCommentId : s.ArticleId) :
						source.OrderByDescending(s => s.UserCommentId == null ? s.UserCommentId : s.ArticleId);
					break;
			}

			return source;
		}

		#endregion

		#region Estimate

		[HttpGet]
		public ActionResult GetEstimates(Int32 page = 1, ColumnIndex colIndex = ColumnIndex.DATE,
			Boolean asc = false, Int32? userId = null,
			EstimateType? estimate = null, String article = null,
			DateTime? dateStart = null, DateTime? dateEnd = null)
		{
			var curUser = GetUserInfo();
			IQueryable<UserEstimate> data = _dbContext.UserEstimate.Where(c => (userId == null || c.AuthorId == userId))
				.Where(e => e.Article.Status == ArticleStatus.APPROVED);

			if (dateStart != null)
			{
				var filter = dateStart.Value.Date;
				data = data.Where(c => c.InsertDate > filter);
			}

			if (dateEnd != null)
			{
				var filter = dateEnd.Value.Date.AddDays(1);
				data = data.Where(c => c.InsertDate < filter);
			}

			if (estimate != null)
			{
				data = data.Where(c => c.Estimate == estimate);
			}

			if (article != null)
			{
				var filter = article.ToUpper();
				data = data.Where(c => c.Article.Name.ToUpper().Contains(filter));
			}

			Int32 dataCount = data.Count();
			var ests = OrderEstimates(data, colIndex, asc)
				.Skip((page - 1) * pageLength).Take(pageLength).ToArray();

			return Ok(new
			{
				data = ests,
				dataCount = dataCount,
				articleNames = ests.Select(c => c.Article).Distinct().ToDictionary(k => k.Id, v => v.Name),
				userNames = ests.Select(c => c.Author).Distinct().ToDictionary(k => k.Id, v => v.Login),
				pageLength = pageLength
			});
		}
		
		private IQueryable<UserEstimate> OrderEstimates(IQueryable<UserEstimate> source, ColumnIndex colIndex, Boolean asc)
		{
			switch (colIndex)
			{
				case ColumnIndex.DATE:
					source = asc ? source.OrderBy(s => s.InsertDate) : source.OrderByDescending(s => s.InsertDate);
					break;
				case ColumnIndex.STATUS:
					source = asc ? source.OrderByDescending(s => s.Estimate) : source.OrderBy(s => s.Estimate);
					break;
				case ColumnIndex.ID:
					source = asc ? source.OrderBy(s => s.Id) : source.OrderByDescending(s => s.Id);
					break;
				case ColumnIndex.ARTICLE:
					source = asc ? source.OrderBy(s => s.Article.Name) : source.OrderByDescending(s => s.Article.Name);
					break;
			}

			return source;
		}

		[HttpGet]
		public ActionResult AssessArticle(Int32 id, EstimateType estimate)
		{
			var article = _dbContext.Article.FirstOrDefault(a => a.Id == id);

			if (article == null)
				return BadRequest("The requested article does not exist in the data base");

			// If a user can create a comment according to a current status of an article
			if (article.Status != ArticleStatus.APPROVED)
				return BadRequest("The article ought to be approved to have comments");

			var curUser = GetUserInfo();
			var curUserId = curUser.id;

			var entity = _dbContext.UserEstimate.FirstOrDefault(e => e.ArticleId == id && e.AuthorId == curUserId);
			DateTime now = DateTime.Now;

			if (entity == null)
			{
                entity = new UserEstimate();
				entity.ArticleId = article.Id;
				entity.AuthorId = curUserId;

                _dbContext.UserEstimate.Add(entity);
			}

			var history = AddHistory(id, curUserId, "Estimate.Estimate", estimate.ToString(), entity.Estimate.ToString(),
				now, entity.Id);
			entity.Estimate = estimate;
			entity.InsertDate = DateTime.Now;

			AddNotification($"A user {curUser.name} has assessed an article '{article.Name}'", history, article.AuthorId);

			_dbContext.SaveChanges();

			return Ok(new { estimate = article.GetFinalEstimate() });
		}

		#endregion

		#region Amendment

		[HttpGet]
		public ActionResult GetAmendments(Int32 articleId)
		{
			var article = _dbContext.Article.FirstOrDefault(a => a.Id == articleId);

			if (article == null)
				return BadRequest("The requested article does not exist in the data base");

			var curUser = GetUserInfo();

			// If the user has the rights to get amendments
			if (article.AuthorId != curUser.id && article.AssignedToId != curUser.id)
				return BadRequest("The user cannot see requested amendments");

			return Ok(article.Amendments);
		}

		[HttpPost]
		[CustomAuthorization(CustomAuthorizationAttribute.ADMIN_ROLE)]
		public ActionResult CreateAmendment(Amendment amendment)
		{
			var articleId = amendment.ArticleId;
			var article = _dbContext.Article.FirstOrDefault(a => a.Id == articleId);

			if (article == null)
				return BadRequest("The requested article does not exist in the data base");

			var curUser = GetUserInfo();

			// If the user has the rights to create amendments
			if (article.AuthorId != curUser.id && article.AssignedToId != curUser.id)
				return BadRequest("The user cannot create amendments");

            var entity = new Amendment();
			entity.InsertDate = DateTime.Now;
			entity.ArticleId = article.Id;
			entity.AuthorId = curUser.id;
			entity.Content = amendment.Content;
			entity.Resolved = amendment.Resolved;

			_dbContext.Amendment.Add(entity);

			_dbContext.SaveChanges();

			var history = AddHistory(amendment.ArticleId, curUser.id, "Amendment CREATED", null, null, null, entity.Id);
			AddHistory(amendment.ArticleId, curUser.id, "Amendment.Content", entity.Content, null, null, entity.Id);

			AddNotification($"An amendment has been added to an article '{article.Name}' by {curUser.name}",
				history, article.AuthorId);

			_dbContext.SaveChanges();

			return Ok(entity);
		}

		[HttpPost]
		public ActionResult UpdateAmendment(Amendment[] amendments)
		{
			if (!amendments.Any())
				throw new Exception("The request is empty");

			var articleId = amendments.First().ArticleId;
			var article = _dbContext.Article.FirstOrDefault(a => a.Id == articleId);

			if (article == null)
				return BadRequest("The requested article does not exist in the data base");

			var curUser = GetUserInfo();

			// If the user has the rights to get amendments
			if (article.AuthorId != curUser.id && article.AssignedToId != curUser.id)
				return BadRequest("The user cannot deal with these amendments");

			var ids = amendments.Select(am => am.Id).ToArray();
			DateTime now = DateTime.Now;

			ArticleHistory history = null;

			foreach (var entity in _dbContext.Amendment.Where(am => ids.Contains(am.Id)))
			{
				var amendment = amendments.First(am => am.Id == entity.Id);

				if (entity.Content != amendment.Content)
					history = AddHistory(amendment.ArticleId, curUser.id, "Amendment.Content",
						amendment.Content, entity.Content, now, amendment.Id);

				entity.Content = amendment.Content;

				if (entity.Resolved != amendment.Resolved)
					history = AddHistory(amendment.ArticleId, curUser.id, "Amendment.Resolved",
						null, null, now, amendment.Id);

				entity.Resolved = amendment.Resolved;
			}

			if (history != null)
			{
				var recipient = curUser.id == article.AuthorId ?
					(article.AssignedToId.HasValue ? article.AssignedToId : null) : article.AuthorId;

				if (recipient.HasValue)
					AddNotification($"There have been changes to the amendments of an article '{article.Name}' by {curUser.name}",
						history, recipient.Value);
			}

			_dbContext.SaveChanges();
			return Ok();
		}

		[HttpDelete]
		[CustomAuthorization(CustomAuthorizationAttribute.ADMIN_ROLE)]
        public ActionResult RemoveAmendment([ModelBinder]Int32[] ids)
		{
			var amendments = _dbContext.Amendment.Where(a => ids.Contains(a.Id));
			DateTime now = DateTime.Now;

			ArticleHistory history = null;
			Article art = null;

			var curUser = GetUserInfo();

			foreach (var amendment in amendments)
			{
				if (art == null)
					art = amendment.Article;

				if (curUser.status == UserStatus.ADMINISTRATOR && amendment.AuthorId != curUser.id)
					return BadRequest("Only authors can delete their own amendments");

				history = AddHistory(amendment.ArticleId, curUser.id, "Amendment REMOVED", null, null,
					now, amendment.Id);
				_dbContext.Amendment.Remove(amendment);
			}

			if (history != null)
			{
				AddNotification($"Some amendments for an article '{art.Name}' have been removed  by {curUser.name}",
					history, art.AuthorId);
			}

			_dbContext.SaveChanges();
			return Ok();
		}

		#endregion

		#region HISTORY

		private void AddNotification(String text, ArticleHistory history, 
			Boolean includeAdmins, params Int32[] recipientIds)
		{
			if (includeAdmins)
			{
				recipientIds = _dbContext.User.Where(u => u.Status == UserStatus.ADMINISTRATOR)
					.Select(u => u.Id).Union(recipientIds).ToArray();
			}

			var curUserId = GetUserInfo().id;
			List<UserNotification> notifications = new List<UserNotification>();

			foreach (var recipientId in recipientIds.Distinct())
			{
				if (recipientId != curUserId)
				{
					var notification = new UserNotification();

					notification.Text = text;
					notification.RecipientId = recipientId;
					notification.InsertDate = DateTime.Now;
					notification.ArticleHistory = history;

					notifications.Add(notification);
				}
			}

			_dbContext.UserNotification.AddRange(notifications);
		}

		private void AddNotification(String text, ArticleHistory history, 
			params Int32[] recipientIds)
		{
			if (recipientIds.Any())
				AddNotification(text, history, false, recipientIds);
		}

		[HttpGet]
		public ActionResult GetNotifications(Int32 userId)
		{
			var data = _dbContext.UserNotification.Where(a => a.RecipientId == userId);

			return Ok(data.OrderByDescending(h => h.InsertDate).Select(n => new
			{
				id = n.Id,
				date = n.InsertDate,
				recipientID = n.RecipientId,
				text = n.Text,
				historyId = n.ArticleHistoryId,
				articleId = n.ArticleHistory.ArticleId
			}).ToArray());
		}

		[HttpDelete]
		public ActionResult ClearNotifications([ModelBinder]Int32[] ids)
		{
			var removedData = _dbContext.UserNotification.Where(a => ids.Contains(a.Id))
                .ToArray();
			_dbContext.UserNotification.RemoveRange(removedData);

			_dbContext.SaveChanges();

			notificationHub.RemoveNotifications(removedData);
			return Ok();
		}

		[HttpGet]
		public ActionResult GetArticleHistory(Int32 id)
		{
			var curArt = _dbContext.Article.FirstOrDefault(a => a.Id == id);

			if (curArt == null)
				return BadRequest("The requested article does not exist in the data base");

			return Ok(curArt.ArticleHistory
				.GroupBy(h => h.InsertDate).OrderByDescending(h => h.Key)
				.Select(g => new
				{
					date = g.Key,
					author = g.First().Author.Login,
					history = g
				}).ToArray());
		}
		
		private ArticleHistory AddHistory(Int32 artId, Int32 authorId, String obj, 
			String newVal, String oldVal, DateTime? insDate = null, Int32? objId = null)
		{
			var history = new ArticleHistory();

			history.ArticleId = artId;
			history.AuthorId = authorId;
			history.Object = obj;
			history.NewValue = newVal;
			history.OldValue = oldVal;
			history.ObjectId = objId;

			var date = (insDate ?? DateTime.Now);
			history.InsertDate = new DateTime(date.Year, date.Month, date.Day, 
				date.Hour, date.Minute, date.Second);

            _dbContext.ArticleHistory.Add(history);
			return history;
		}

		#endregion
	}
}
