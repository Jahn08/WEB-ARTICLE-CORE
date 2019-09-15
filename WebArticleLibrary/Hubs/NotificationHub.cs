using System;
using System.Collections.Concurrent;
using System.Linq;
using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;
using WebArticleLibrary.Model;

namespace WebArticleLibrary.Hubs
{
	public class NotificationHub : Hub
	{
		static ConcurrentDictionary<String, Int32> storage = 
			new ConcurrentDictionary<String, Int32>();

		public void AddNotifications(UserNotification[] entities)
		{
			foreach (var g in entities.GroupBy(e => e.RecipientId))
			{
				var keys = storage.Where(s => s.Value == g.Key)
					.Select(s => s.Key).ToArray();

				if (keys.Any())
				{
					this.Clients.Clients(keys).SendAsync("notify", g.Select(n => new
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

		public void RemoveNotifications(UserNotification[] entities)
		{
			foreach (var g in entities.GroupBy(e => e.RecipientId))
			{
				var keys = storage.Where(s => s.Value == g.Key)
					.Select(s => s.Key).ToArray();

				if (keys.Any())
				{
					this.Clients.Clients(keys).SendAsync("clear", g.Select(n => new
					{
						id = n.Id
					})).Wait();
				}
			}
		}

        public override Task OnDisconnectedAsync(Exception exception) 
        {
            Int32 value;
			storage.TryRemove(this.Context.ConnectionId, out value);

			return base.OnDisconnectedAsync(exception);
        }

		/// <summary>
		/// Removing all existing connections for the user when logging out
		/// </summary>
		/// <param name="userId"></param>
		public void SignOut(Int32 userId)
		{
			var keys = storage.Where(s => s.Value == userId)
				.Select(s => s.Key).ToArray();

			if (keys.Any())
				Clients.Clients(keys).SendAsync("close").Wait();
		}

		public void SignUp(Int32 userId)
		{
			storage.TryAdd(this.Context.ConnectionId, userId);
		}
	}
}
