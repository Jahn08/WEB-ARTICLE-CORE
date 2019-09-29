using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.SignalR;
using WebArticleLibrary.Model;

namespace WebArticleLibrary.Hubs
{
	public class NotificationSender
	{
        private IHubClients clients;

        public NotificationSender(IHubContext<NotificationHub> hubContext): base()
        {
            clients = hubContext.Clients;
        }

		public void AddNotifications(IEnumerable<UserNotification> entities)
		{
			foreach (var g in entities.GroupBy(e => e.RecipientId))
			{
				var keys = NotificationHub.GetConnectionIds(g.Key);

				if (keys.Any())
				{
					clients.Clients(keys).SendAsync("notify", g.Select(n => new
					{
						id = n.Id,
						date = n.InsertDate,
						recipientID = n.RecipientId,
						text = n.Text,
						historyId = n.ArticleHistoryId,
						articleId = n.ArticleHistory.ArticleId
					}).OrderByDescending(n => n.date)).Wait();
				}
			}			
		}

		public void RemoveNotifications(IEnumerable<UserNotification> entities)
		{
			foreach (var g in entities.GroupBy(e => e.RecipientId))
			{
				var keys = NotificationHub.GetConnectionIds(g.Key);

				if (keys.Any())
				{
					clients.Clients(keys).SendAsync("clear", g.Select(n => new
					{
						id = n.Id
					})).Wait();
				}
			}
		}
	}
}
