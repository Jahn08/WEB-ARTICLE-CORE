using System;
using System.Linq;
using WebArticleLibrary.Model;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using WebArticleLibrary.Hubs;

namespace WebArticleLibrary.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
	public class NotificationController: SignallingController
	{
        public NotificationController(ArticleLibraryContext dbContext,
            IHubContext<NotificationHub> hubContext): base(dbContext, hubContext)
		{
		}

		[HttpGet]
		public ActionResult GetNotifications(Int32 userId)
		{
			var data = dbContext.UserNotification.Where(a => a.RecipientId == userId);

			return ArrayResult(data.OrderByDescending(h => h.InsertDate).Select(n => new
			{
				id = n.Id,
				date = n.InsertDate,
				recipientID = n.RecipientId,
				text = n.Text,
				historyId = n.ArticleHistoryId,
				articleId = n.ArticleHistory.ArticleId
			}));
		}

		[HttpDelete]
		public ActionResult ClearNotifications([FromQuery]Int32[] ids)
		{
			var removedData = dbContext.UserNotification.Where(a => ids.Contains(a.Id))
                .ToArray();
			dbContext.UserNotification.RemoveRange(removedData);

			dbContext.SaveChanges();

            RemoveNotifications(removedData);

			return Ok();
		}
	}
}
