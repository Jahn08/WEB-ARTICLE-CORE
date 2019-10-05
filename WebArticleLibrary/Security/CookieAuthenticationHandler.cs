using System;
using System.Linq;
using System.Security.Cryptography;
using System.IO;
using System.Security.Claims;
using System.Threading;
using WebArticleLibrary.Helpers;
using WebArticleLibrary.Model;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication.Cookies;

namespace WebArticleLibrary.Security
{
    public class CookieAuthenticationHandler : AuthenticationHandler<CookieAuthenticationOptions>
	{
        private static Byte[] _key;

		private static Byte[] _IV;

		static CookieAuthenticationHandler()
		{
			using (var c = new RC2CryptoServiceProvider())
			{
				_key = c.Key;
				_IV = c.IV;
			}
		}

        public CookieAuthenticationHandler(IOptionsMonitor<CookieAuthenticationOptions> options, 
            ILoggerFactory logger, UrlEncoder encoder, ISystemClock clock) 
            : base(options, logger, encoder, clock)
        {
        }

        protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            ClaimsPrincipal principal;

            if ((principal = SetPrincipal()) != null) 
            {
                var ticket = new AuthenticationTicket(principal, this.Scheme.Name);
                return Task.FromResult(AuthenticateResult.Success(ticket));
            }

            return Task.FromResult(
                AuthenticateResult.Fail("Authentication token is required"));
        }
		
		private ClaimsPrincipal SetPrincipal()
		{
			String cookie;

            var requiredCookie = this.Options.Cookie.Name;

			if (requiredCookie != null && 
                Request.Cookies.TryGetValue(requiredCookie, out cookie))
			{
                var httpContext = Request.HttpContext;

				var dbContext = httpContext.RequestServices.GetService<ArticleLibraryContext>();
				UserStore us = new UserStore(dbContext);

				Int32 id;

				try
				{
					id = DecryptId(cookie);
				}
				catch (CryptographicException)
				{
					Response.Cookies.Delete(requiredCookie);
					return null;
				}

				if (id == -1)
					return null;

				var user = us.FindByIdAsync(id.ToString()).Result;

				if (user == null)
                    return null;

                var identity = new ClaimsIdentity(us.GetClaimsAsync(user).Result, "Custom");
                var principal = new ClaimsPrincipal(identity);
                Thread.CurrentPrincipal = principal;

                return principal;
			}

			return null;
		}

        public static void AppendAuthenticationCookie(IResponseCookies cookies, 
            Int32 id, String cookieName)
        {
            cookies.Append(cookieName, CookieAuthenticationHandler.EncryptId(id));
        }

		private static String EncryptId(Int32 id)
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
