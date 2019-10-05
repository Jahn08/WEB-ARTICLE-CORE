using System;
using System.Collections.Concurrent;
using System.Linq;
using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace WebArticleLibrary.Hubs
{
	public class NotificationHub : Hub
	{
        private static ConcurrentDictionary<String, Int32> connectionIds = 
			new ConcurrentDictionary<String, Int32>();
        
        public static String[] GetConnectionIds(Int32 userId)
        {
            return connectionIds.Where(s => s.Value == userId)
                .Select(s => s.Key).ToArray();
        }

		public void SignUp(Int32 userId)
		{
			connectionIds.TryAdd(this.Context.ConnectionId, userId);
		}

        public override Task OnDisconnectedAsync(Exception exception) 
        {
            Int32 value;
			connectionIds.TryRemove(this.Context.ConnectionId, out value);

			return base.OnDisconnectedAsync(exception);
        }
	}
}
