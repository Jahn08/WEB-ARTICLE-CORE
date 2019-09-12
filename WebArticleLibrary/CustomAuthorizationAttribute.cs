using System;
using System.Linq;
using System.Security.Cryptography;
using System.IO;
using System.Security.Claims;
using System.Threading;
using WebArticleLibrary.Helpers;
using WebArticleLibrary.Model;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;

namespace WebArticleLibrary
{
    public class CustomAuthorizationAttribute : Attribute, IAuthorizationFilter
	{
		public String Roles { get; private set; }

		public const String AUTH_USER_COOKIE = "Auth_Id";
	
		public const String ADMIN_ROLE = "ADMINISTRATOR";

		private static Byte[] _key;

		private static Byte[] _IV;

		static CustomAuthorizationAttribute()
		{
			using (var c = new RC2CryptoServiceProvider())
			{
				_key = c.Key;
				_IV = c.IV;
			}
		}

		public CustomAuthorizationAttribute(String roles)
		{
			Roles = roles;
		}

        public void OnAuthorization(AuthorizationFilterContext context)
        {

			if (!IsAuthorized(context.HttpContext))
				context.Result = new ForbidResult();
        }
		
		private Boolean IsAuthorized(HttpContext httpContext)
		{
			String cookie;

			if (httpContext.Request.Cookies.TryGetValue(AUTH_USER_COOKIE, out cookie))
			{
				var dbContext = httpContext.RequestServices.GetService<ArticleLibraryContext>();
				UserStore us = new UserStore(dbContext);

				Int32 id;

				try
				{
					id = DecryptId(cookie);
				}
				catch (CryptographicException)
				{
					httpContext.Response.Cookies.Delete(AUTH_USER_COOKIE);
					return false;
				}

				if (id == -1)
					return false;

				var user = us.FindByIdAsync(id.ToString()).Result;

				if (user != null)
				{
					UserStatus requirement;

					if (user.status == UserStatus.BANNED)
						return false;
					else if (!String.IsNullOrEmpty(Roles) && (!Enum.TryParse<UserStatus>(Roles, out requirement) ||
						user.status != requirement))
						return false;

					var identity = new ClaimsIdentity(us.GetClaimsAsync(user).Result);
					var principal = new ClaimsPrincipal(identity);

					Thread.CurrentPrincipal = principal;

					if (httpContext != null)
						httpContext.User = principal;

					return true;
				}
			}

			return false;
		}

		public static String EncryptId(Int32 id)
		{
			String value;
			String info = String.Format("{0}_{1}", Guid.NewGuid().ToString(), id.ToString());

			using (var c = new RC2CryptoServiceProvider())
			{
				var encr = c.CreateEncryptor(_key, _IV);

				using (MemoryStream mem = new MemoryStream())
				{
					CryptoStream crStream = new CryptoStream(mem, encr, CryptoStreamMode.Write);

					var bytes = System.Text.Encoding.UTF8.GetBytes(info);
					crStream.Write(bytes, 0, bytes.Length);
					crStream.FlushFinalBlock();

					value = Convert.ToBase64String(mem.ToArray());
				}
			}
			
			return value;
		}

		private static Int32 DecryptId(String info)
		{
			String value = null;
			Int32 id = -1;
			var bytes = Convert.FromBase64String(info);

			using (var c = new RC2CryptoServiceProvider())
			{
				var decr = c.CreateDecryptor(_key, _IV);

				using (MemoryStream mem = new MemoryStream(bytes))
				{
					CryptoStream crStream = new CryptoStream(mem, decr, CryptoStreamMode.Read);

					var outcome = new Byte[bytes.Length];
					crStream.Read(outcome, 0, outcome.Length);

					value = System.Text.Encoding.UTF8.GetString(outcome);
				}
			}

			if (!String.IsNullOrEmpty(value))
			{
				var number = value.Split('_').Last();
				Int32.TryParse(number, out id);
			}

			return id;
		}
    }
}
