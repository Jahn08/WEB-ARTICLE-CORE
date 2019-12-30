using System;
using System.Collections.Generic;
using System.Linq;
using WebArticleLibrary.Models;
using WebArticleLibrary.Model;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using WebArticleLibrary.Security;
using Microsoft.AspNetCore.SignalR;
using WebArticleLibrary.Hubs;

namespace WebArticleLibrary.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
	public class ArticleController: SignallingController
	{
        private readonly String[] defaultCategories;

		public ArticleController(ArticleLibraryContext dbContext,
            IHubContext<NotificationHub> hubContext): base(dbContext, hubContext)
        { 
    		defaultCategories = new[] { "science", "politics", "literature", "travelling", "financies" };
        }

		[HttpGet("Categories")]
		[AllowAnonymous]
		public ActionResult GetDefaultCategories()
		{
			return ArrayResult(defaultCategories);
		}

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
			
				dbContext.Article.Add(curArt);
            }
			else
			{
				curArt = dbContext.Article.FirstOrDefault(a => a.Id == article.Id);

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
							am.Archived = true;

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

			dbContext.SaveChanges();

			if (newArticle && article.Status != ArticleStatus.DRAFT)
			{
				history = AddHistory(curArt.Id, curUserId, "Created", null, null, null);
				curArt.Status = article.Status;

				AddNotification($"{curUser.name} has added a new article '{curArt.Name}'", history, true);
				dbContext.SaveChanges();
			}

			return Ok();
		}

		[HttpPost("Assignment")]
    	[Authorize(SecurityConfigurator.ADMIN_POLICY_NAME)]
       	public ActionResult SetArticleAssignment(AssignmentUpdate model)
		{
           var id = model.EntityId;
			Article curArt = dbContext.Article.FirstOrDefault(a => a.Id == id);

			if (curArt == null)
				return BadRequest("The requested article does not exist in the data base");

			var curUser = GetUserInfo();
			var curUserId = curUser.id;

			const String eventName = "AssignedTo";

			if (model.ShouldAssign)
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

				var history = AddHistory(id, curUserId, eventName, null, 
                    curArt.AssignedTo.Login);
				AddNotification($"{curUser.name} has backed out of reviewing an article '{curArt.Name}'",
					history, true, curArt.AuthorId);

				curArt.AssignedToId = null;
			}

			dbContext.SaveChanges();

			return Ok();
		}

		[HttpDelete]
		public ActionResult RemoveArticle([FromQuery]Int32[] ids)
		{
			var curUser = GetUserInfo();
			var arts = dbContext.Article.Where(a => ids.Contains(a.Id));

			foreach (var curArt in arts)
			{
				if (curArt.AuthorId != curUser.id)
					return BadRequest("Only authors can delete their own articles");

				dbContext.Article.Remove(curArt);
			}

			dbContext.SaveChanges();

			return GetArticles();
		}

		[HttpGet("All")]
		public ActionResult GetArticles(ArticleStatus? status = null,
			String assignedTo = null, String author = null, String tags = null, String text = null,
			DateTime? dateStart = null, DateTime? dateEnd = null, Int32 page = 1,
			ColumnIndex colIndex = ColumnIndex.DATE, Boolean asc = false, Boolean includeComments = false)
		{
			var curUser = GetUserInfo();
			var curUserId = curUser?.id;

			IQueryable<Article> articles = dbContext.Article.AsQueryable();

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

			var tagList = Article.GetTagList(tags);
			if (tagList.Any())
				articles = articles.Where(a => 
					tagList.All(t => a.Tags.IndexOf(t, NO_CASE_COMPARISON) != -1));

			if (!String.IsNullOrEmpty(text))
				articles = articles.Where(a => 
                    (a.Name + a.Description).IndexOf(text, NO_CASE_COMPARISON) != -1);

			if (!String.IsNullOrEmpty(assignedTo))
				articles = articles.Where(a => a.AssignedToId != null &&
					a.AssignedTo.Login.IndexOf(assignedTo, NO_CASE_COMPARISON) != -1);

			if (!String.IsNullOrEmpty(author))
			{
				var ids = dbContext.User.Where(u => u.Login.IndexOf(author, NO_CASE_COMPARISON) != -1)
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
			var skip = (page - 1) * PAGE_LENGTH;
			privateData = privateData.Skip(skip).Take(PAGE_LENGTH).ToArray();

			var users = from u in dbContext.User.Select(iu => new { iu.Id, iu.Login })
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
				publicData = publicData.Skip(skip).Take(PAGE_LENGTH).ToArray();

				users = users.Union(from u in dbContext.User.Select(iu => new { iu.Id, iu.Login })
									join a in publicData.SelectMany(p => new Int32[] { p.assignedToId ?? 0, p.authorId }).Distinct() on u.Id equals a
									select u);
			}

			var unionData = publicData == null ? privateData : privateData.Concat(publicData);
			var estimates = (from Int32 a in unionData.Select(d => d.id)
							 join est in dbContext.UserEstimate
                                    .Select(e => new { e.ArticleId, e.Estimate }) 
                                on a equals est.ArticleId
							 select est).GroupBy(a => a.ArticleId);
			var commentNums = (from Int32 a in unionData.Select(d => d.id)
							   join est in dbContext.UserComment.Select(e => new { e.ArticleId }) on a equals est.ArticleId
							   select est).GroupBy(a => a.ArticleId);

			return Ok(new
			{
				privateData = privateData,
				privateDataCount = privateDataCount,
				publicData = publicData,
				publicDataCount = publicDataCount,
				pageLength = PAGE_LENGTH,
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

			IQueryable<Article> articles = dbContext.Article.Where(a => a.Status == ArticleStatus.APPROVED);

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

			var tagList = Article.GetTagList(tags);
			if (tagList.Any())
				articles = articles.Where(a => 
					tagList.All(t => a.Tags.IndexOf(t, NO_CASE_COMPARISON) != -1));

			if (!String.IsNullOrEmpty(text))
				articles = articles.Where(a => 
                    (a.Name + a.Description).IndexOf(text, NO_CASE_COMPARISON) != -1);

			if (author != null)
			{
				var ids = dbContext.User.Where(u => 
                    u.Login.IndexOf(author, NO_CASE_COMPARISON) != -1).Select(u => u.Id);
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
			var skip = (page - 1) * PAGE_LENGTH;
			data = data.Skip(skip).Take(PAGE_LENGTH).ToArray();

			var users = from u in dbContext.User.Select(iu => new { iu.Id, iu.Login })
						join a in data.Select(p => p.authorId).Distinct() on u.Id equals a
						select u;

			var estimates = (from Int32 a in data.Select(d => d.id)
							 join est in dbContext.UserEstimate.Select(e => new { e.ArticleId, e.Estimate }) on a equals est.ArticleId
							 select est).GroupBy(a => a.ArticleId);

			return Ok(new
			{
				articles = data,
				articleCount = dataCount,
				pageLength = PAGE_LENGTH,
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
					source = asc ? source.OrderBy(s => s.Status.ToString()) : 
                        source.OrderByDescending(s => s.Status.ToString());
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

		[HttpGet("NewVersion")]
		public ActionResult CreateVersion(Int32 id)
		{
			var curArt = dbContext.Article.FirstOrDefault(a => a.Id == id);

			if (curArt == null)
				return BadRequest("The requested article does not exist in the data base");

			var curUserId = GetCurrentUserId();

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

            dbContext.Article.Add(newArt);

			dbContext.SaveChanges();

			AddHistory(curArt.Id, curUserId, "CHILD VERSION", null, null, now, newArt.Id);
			AddHistory(newArt.Id, curUserId, "PARENT VERSION", null, null, now, curArt.Id);

			dbContext.SaveChanges();

			return Ok(new { newVersionId = newArt.Id });
		}

		[HttpGet("Titles")]
		[AllowAnonymous]
		public ActionResult GetArticleTitles()
		{
			var articles = dbContext.Article.Where(art => art.Status == ArticleStatus.APPROVED &&
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
							 join user in dbContext.User.Where(u => u.Status != UserStatus.BANNED)
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
		[HttpGet("{id}")]
		public ActionResult ViewArticle(Int32 id, Int32? userId = null)
		{
			var article = dbContext.Article.FirstOrDefault(a => a.Id == id);
			var comments = userId.HasValue ? dbContext.UserComment.Where(c => c.ArticleId == article.Id)
				.OrderBy(c => c.InsertDate).ToArray() : null;

			Dictionary<Int32, Byte[]> photos = new Dictionary<Int32, Byte[]>();
			Dictionary<Int32, String> names = new Dictionary<Int32, String>();

			if (comments != null)
			{
				var userInfos = (from u in dbContext.User.Select(u => new
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
				var _author = dbContext.User.Where(a => a.Id == article.AuthorId)
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
				updatedDate = dbContext.ArticleHistory.Where(h => h.ArticleId == article.Id)
					.Select(h => h.InsertDate)
					.OrderByDescending(h => h)
					.FirstOrDefault(),
				comments = comments,
				userNames = names,
				userPhotos = photos,
				estimate = article.GetFinalEstimate(),
				curEstimate = dbContext.UserEstimate
                    .Where(e => e.AuthorId == userId && e.ArticleId == id)
					.Select(e => e.Estimate)
					.FirstOrDefault()
			});
		}
	}
}
