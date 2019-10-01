using System;
using System.Linq;
using WebArticleLibrary.Model;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using WebArticleLibrary.Models;
using WebArticleLibrary.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using WebArticleLibrary.Hubs;

namespace WebArticleLibrary.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
	public class ComplaintController: SignallingController
	{
		public ComplaintController(ArticleLibraryContext dbContext,
            IHubContext<NotificationHub> hubContext): base(dbContext, hubContext)
        {
        }

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
				var comment = dbContext.UserComment.FirstOrDefault(a => a.Id == commentId);

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
				var article = dbContext.Article.FirstOrDefault(a => a.Id == articleId);

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

			dbContext.UserComplaint.Add(entity);

			dbContext.SaveChanges();

			var history = AddHistory(articleId, curUserId, "Complaint Created", null, null, null, entity.Id);
			AddHistory(articleId, curUserId, "Complaint.Content", entity.Text, null, null, entity.Id);

			AddNotification(notificationStr, history, true, recipients.ToArray());

			dbContext.SaveChanges();
			return Ok(entity);
		}

		[HttpPost("Status")]
		[Authorize(SecurityConfigurator.ADMIN_POLICY_NAME)]
		public ActionResult SetComplaintStatus(ComplaintStatusUpdate model)
		{
            var id = model.ComplaintId;
			var entity = dbContext.UserComplaint.FirstOrDefault(c => c.Id == id);

			if (entity == null)
				return BadRequest("The requested complaint does not exist in the data base");

			var curUser = GetUserInfo();
			var now = DateTime.Now;

			String notificationStr = null;
			var recipients = new List<Int32>();

			var art = entity.Article;

            var status = model.Status;
            var response = model.Response;

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

					dbContext.SaveChanges();

					AddHistory(entity.ArticleId, curUser.id, "Amendment Created", 
                        null, null, null, amd.Id);
					AddHistory(entity.ArticleId, curUser.id, "Amendment.Content", 
                        amd.Content, null, null, amd.Id);

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
			AddHistory(entity.ArticleId, curUser.id, "Complaint.Response", response,
				null, now, entity.Id);

			AddNotification(notificationStr, history, recipients.ToArray());

			entity.Status = status;

			AddHistory(entity.ArticleId, curUser.id, "Complaint.AssignedTo", null,
				entity.AssignedTo.Login, now, entity.Id);

			entity.AssignedToId = null;
			dbContext.SaveChanges();

			return Ok();
		}

		[HttpPost("Assignment")]
		[Authorize(SecurityConfigurator.ADMIN_POLICY_NAME)]
		public ActionResult SetComplaintAssignment(AssignmentUpdate model)
		{
            var id = model.EntityId;
			var entity = dbContext.UserComplaint.FirstOrDefault(a => a.Id == id);

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

			if (model.ShouldAssign)
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
			dbContext.SaveChanges();

			return Ok();
		}

		[HttpGet]
		[Authorize(SecurityConfigurator.ADMIN_POLICY_NAME)]
		public ActionResult GetComplaints(Int32 page = 1, ColumnIndex colIndex = ColumnIndex.DATE,
			Boolean asc = false, String text = null, ComplaintStatus? status = null,
			String author = null, String assignedTo = null,
			DateTime? dateStart = null, DateTime? dateEnd = null,
			ComplaintEntityType? entityType = null, String entity = null)
		{
			var curUser = GetUserInfo();
			IQueryable<UserComplaint> data = dbContext.UserComplaint
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
				data = data.Where(c => c.Status == status);

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
				.Skip((page - 1) * PAGE_LENGTH)
				.Take(PAGE_LENGTH);

			var users = from u in dbContext.User.Select(iu => new { iu.Id, iu.Login })
						join a in cmplns.SelectMany(p => new Int32[] { p.AssignedToId ?? 0, p.AuthorId }).Distinct() on u.Id equals a
						select u;

			var articles = from a in dbContext.Article.Select(a => new { a.Id, a.Name })
						   join c in cmplns.Select(p => p.ArticleId).Distinct() on a.Id equals c
						   select a;

			var comments = from e in dbContext.UserComment.Select(d => new { d.Id, d.Content })
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
				pageLength = PAGE_LENGTH
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
    }
}
