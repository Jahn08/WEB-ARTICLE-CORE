using System;
using System.Linq;
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
	public class AmendmentController: SignallingController
	{
		public AmendmentController(ArticleLibraryContext dbContext,
            IHubContext<NotificationHub> hubContext): base(dbContext, hubContext) 
		{
        }

		[HttpGet]
		public ActionResult GetAmendments(Int32 articleId)
		{
			var article = dbContext.Article.FirstOrDefault(a => a.Id == articleId);

			if (article == null)
				return BadRequest("The requested article does not exist in the data base");

			var curUser = GetUserInfo();

			// If the user has the rights to get amendments
			if (article.AuthorId != curUser.id && article.AssignedToId != curUser.id)
				return BadRequest("The user cannot see requested amendments");

			return Ok(article.Amendments);
		}

		[HttpPost("New")]
		[Authorize(SecurityConfigurator.ADMIN_POLICY_NAME)]
		public ActionResult CreateAmendment(Amendment amendment)
		{
			var articleId = amendment.ArticleId;
			var article = dbContext.Article.FirstOrDefault(a => a.Id == articleId);

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

			dbContext.Amendment.Add(entity);

			dbContext.SaveChanges();

			var history = AddHistory(amendment.ArticleId, curUser.id, "Amendment Created", null, null, null, entity.Id);
			AddHistory(amendment.ArticleId, curUser.id, "Amendment.Content", entity.Content, null, null, entity.Id);

			AddNotification($"An amendment has been added to an article '{article.Name}' by {curUser.name}",
				history, article.AuthorId);

			dbContext.SaveChanges();

			return Ok(entity);
		}

		[HttpPost]
		public ActionResult UpdateAmendment(Amendment[] amendments)
		{
			if (!amendments.Any())
				throw new Exception("The request is empty");

			var articleId = amendments.First().ArticleId;
			var article = dbContext.Article.FirstOrDefault(a => a.Id == articleId);

			if (article == null)
				return BadRequest("The requested article does not exist in the data base");

			var curUser = GetUserInfo();

			// If the user has the rights to get amendments
			if (article.AuthorId != curUser.id && article.AssignedToId != curUser.id)
				return BadRequest("The user cannot deal with these amendments");

			var ids = amendments.Select(am => am.Id).ToArray();
			DateTime now = DateTime.Now;

			ArticleHistory history = null;

			foreach (var entity in dbContext.Amendment.Where(am => ids.Contains(am.Id)))
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

			dbContext.SaveChanges();
			return Ok();
		}

		[HttpDelete]
		[Authorize(SecurityConfigurator.ADMIN_POLICY_NAME)]
        public ActionResult RemoveAmendment([FromQuery]Int32[] ids)
		{
			var amendments = dbContext.Amendment.Where(a => ids.Contains(a.Id));
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

				history = AddHistory(amendment.ArticleId, curUser.id, "Amendment Removed", null, null,
					now, amendment.Id);
				dbContext.Amendment.Remove(amendment);
			}

			if (history != null)
			{
				AddNotification($"Some amendments for an article '{art.Name}' have been removed  by {curUser.name}",
					history, art.AuthorId);
			}

			dbContext.SaveChanges();
			return Ok();
		}
    }
}
