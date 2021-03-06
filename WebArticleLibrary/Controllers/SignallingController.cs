using WebArticleLibrary.Model;
using System;
using WebArticleLibrary.Hubs;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.SignalR;

namespace WebArticleLibrary.Controllers
{
	public class SignallingController: LibraryControllerBase
	{   
        private NotificationSender senderHub;

        public SignallingController(ArticleLibraryContext dbContext, 
            IHubContext<NotificationHub> hubContext): base(dbContext)
        {
            senderHub = new NotificationSender(hubContext);
        }

        protected void AddNotification(String text, ArticleHistory history, 
			params Int32[] recipientIds)
		{
			if (recipientIds.Any())
				AddNotification(text, history, false, recipientIds);
		}

		protected void AddNotification(String text, ArticleHistory history, 
			Boolean includeAdmins, params Int32[] recipientIds)
		{
			if (includeAdmins)
			{
				recipientIds = dbContext.User.Where(u => u.Status == UserStatus.ADMINISTRATOR)
					.Select(u => u.Id).Union(recipientIds).ToArray();
			}

			var curUserId = GetCurrentUserId();
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

			dbContext.UserNotification.AddRange(notifications);
            
			senderHub.AddNotifications(notifications);
		}

        protected void RemoveNotifications(IEnumerable<UserNotification> notifications)
        {
			senderHub.RemoveNotifications(notifications);
        }

		protected ArticleHistory AddHistory(Int32 artId, Int32 authorId, String obj, 
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

            dbContext.ArticleHistory.Add(history);
			return history;
		}
    }
}
