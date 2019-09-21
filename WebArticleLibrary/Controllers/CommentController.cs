using System;
using System.Linq;
using WebArticleLibrary.Model;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using WebArticleLibrary.Models;

namespace WebArticleLibrary.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
	public class CommentController: SignallingController
	{
		public CommentController(ArticleLibraryContext dbContext): base(dbContext) 
		{
        }

		[HttpPost]
		public ActionResult CreateComment(UserComment comment)
		{
			var articleId = comment.ArticleId;
			var article = dbContext.Article.FirstOrDefault(a => a.Id == articleId);

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

			dbContext.UserComment.Add(entity);

			dbContext.SaveChanges();

			var history = AddHistory(articleId, curUserId, "Comment Created", 
                null, null, null, entity.Id);

			if (curUserId != article.AuthorId)
				AddNotification($"{curUser.name} has added a comment #{entity.Id.ToString()} for an article '{article.Name}'",
					history, article.AuthorId);

			dbContext.SaveChanges();
            
			return Ok(entity);
		}

		[HttpPost("Status")]
		public ActionResult UpdateCommentStatus(Int32 id, CommentStatus status)
		{
			var entity = dbContext.UserComment.FirstOrDefault(c => c.Id == id);

			if (entity == null)
				return BadRequest("The requested comment does not exist in the data base");

			var curUser = GetUserInfo();

			var now = DateTime.Now;
			var history = AddHistory(entity.ArticleId, curUser.id, "Comment.Status", status.ToString(),
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
				dbContext.UserComplaint.RemoveRange(entity.UserComplaints);

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

			dbContext.SaveChanges();

			return Ok();
		}

		[HttpGet]
		public ActionResult GetComments(Int32 page = 1, ColumnIndex colIndex = ColumnIndex.DATE,
			Boolean asc = false, String id = null, String articleName = null,
			DateTime? dateStart = null, DateTime? dateEnd = null, CommentStatus? status = null,
			Int32? userId = null, Int32? parentId = null, Boolean all = false)
		{
			IQueryable<UserComment> cmnts = dbContext.UserComment
				.Where(c => c.Article.Status == ArticleStatus.APPROVED);

			if (userId != null)
				cmnts = cmnts.Where(c => c.AuthorId == userId);

			if (parentId != null)
				cmnts = cmnts.Where(c => c.ResponseToId == parentId);

			if (dateStart != null)
				cmnts = cmnts.Where(c => c.InsertDate >= dateStart);

			if (dateEnd != null)
			{
				var filterDate = dateEnd.Value.Date.AddDays(1);
				cmnts = cmnts.Where(c => c.InsertDate < filterDate);
			}

			if (status != null)
				cmnts = cmnts.Where(c => c.Status == status);

			if (id != null)
				cmnts = cmnts.Where(c => c.Id.ToString().Contains(id));

			if (articleName != null)
			{
				var filterVal = articleName.ToUpper();
				cmnts = cmnts.Where(c => c.Article.Name.ToUpper().Contains(filterVal));
			}

			Int32 dataCount = cmnts.Count();

			cmnts = OrderComments(cmnts, colIndex, asc);
			UserComment[] cmntData = (all ? cmnts : cmnts.Skip((page - 1) * PAGE_LENGTH).Take(PAGE_LENGTH)).ToArray();

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
				pageLength = PAGE_LENGTH
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

			AddHistory(cmnt.ArticleId, cmnt.AuthorId, "Comment Removed", null, null,
				now, cmnt.Id);
			dbContext.UserComment.Remove(cmnt);
				
			if (parentId != null)
			{
				// There might be other parental comments waited to be deleted
				UserComment parentalEntity = dbContext.UserComment.FirstOrDefault(c => c.Id == parentId);

				if (parentalEntity != null && parentalEntity.Status == CommentStatus.DELETED &&
					!parentalEntity.RelatedComments.Any())
					RemoveComment(parentalEntity, now);
			}
		}
	}
}
