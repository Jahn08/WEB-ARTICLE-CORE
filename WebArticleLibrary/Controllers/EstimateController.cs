using System;
using System.Linq;
using WebArticleLibrary.Model;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using WebArticleLibrary.Models;
using Microsoft.AspNetCore.SignalR;
using WebArticleLibrary.Hubs;

namespace WebArticleLibrary.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
	public class EstimateController: SignallingController
	{
        public EstimateController(ArticleLibraryContext dbContext,
            IHubContext<NotificationHub> hubContext): base(dbContext, hubContext)
		{
        }

		[HttpGet]
		public ActionResult GetEstimates(Int32 page = 1, ColumnIndex colIndex = ColumnIndex.DATE,
			Boolean asc = false, Int32? userId = null,
			EstimateType? estimate = null, String article = null,
			DateTime? dateStart = null, DateTime? dateEnd = null)
		{
			var curUser = GetUserInfo();
			IQueryable<UserEstimate> data = dbContext.UserEstimate.Where(c => (userId == null || c.AuthorId == userId))
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
				data = data.Where(c => c.Estimate == estimate);

			if (article != null)
			{
				var filter = article.ToUpper();
				data = data.Where(c => c.Article.Name.ToUpper().Contains(filter));
			}

			Int32 dataCount = data.Count();
			var ests = OrderEstimates(data, colIndex, asc)
				.Skip((page - 1) * PAGE_LENGTH).Take(PAGE_LENGTH).ToArray();

			return Ok(new
			{
				data = ests,
				dataCount = dataCount,
				articleNames = ests.Select(c => c.Article).Distinct().ToDictionary(k => k.Id, v => v.Name),
				userNames = ests.Select(c => c.Author).Distinct().ToDictionary(k => k.Id, v => v.Login),
				pageLength = PAGE_LENGTH
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

		[HttpPost]
		public ActionResult AssessArticle(Int32 id, EstimateType estimate)
		{
			var article = dbContext.Article.FirstOrDefault(a => a.Id == id);

			if (article == null)
				return BadRequest("The requested article does not exist in the data base");

			// If a user can create a comment according to a current status of an article
			if (article.Status != ArticleStatus.APPROVED)
				return BadRequest("The article ought to be approved to have comments");

			var curUser = GetUserInfo();
			var curUserId = curUser.id;

			var entity = dbContext.UserEstimate.FirstOrDefault(e => e.ArticleId == id && e.AuthorId == curUserId);
			DateTime now = DateTime.Now;

			if (entity == null)
			{
                entity = new UserEstimate();
				entity.ArticleId = article.Id;
				entity.AuthorId = curUserId;

                dbContext.UserEstimate.Add(entity);
			}

			var history = AddHistory(id, curUserId, "Estimate.Estimate", estimate.ToString(), entity.Estimate.ToString(),
				now, entity.Id);
			entity.Estimate = estimate;
			entity.InsertDate = DateTime.Now;

			AddNotification($"A user {curUser.name} has assessed an article '{article.Name}'", history, article.AuthorId);

			dbContext.SaveChanges();

			return Ok(new { estimate = article.GetFinalEstimate() });
		}
    }
}
