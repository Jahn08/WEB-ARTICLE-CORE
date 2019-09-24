using System;
using Microsoft.AspNet.Identity;
using WebArticleLibrary.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebArticleLibrary.Model;
using WebArticleLibrary.Helpers;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http.Headers;

namespace WebArticleLibrary.Controllers
{
	[ApiController]
    [Route("api/[controller]")]
	public class AuthenticationController: LibraryControllerBase
	{
		private IConfiguration _config;

		public AuthenticationController(ArticleLibraryContext dbContext, IConfiguration config): 
            base(dbContext)
		{
            _config = config;
		}

		[AllowAnonymous]
		[HttpPost("LogIn")]
		public ActionResult LogIn(UserInfo user)
		{
			UserInfo u;
			String cookie;

			using (var userStore = new UserStore(dbContext))
			{
				if (Request.Cookies.TryGetValue(CustomAuthorizationAttribute.AUTH_USER_COOKIE, out cookie))
					return Ok(userStore.GetCurrentUserInfo(User.Identity));

				u = userStore.FindByNameAsync(user.name).Result;
			}

			if (u != null)
			{
				if (u.status == Model.UserStatus.BANNED)
					return BadRequest("Your account was banned");

				var pHasher = new PasswordHasher();

				if (pHasher.VerifyHashedPassword(u.GetHash(), user.password) == PasswordVerificationResult.Success)
				{
					Response.Cookies.Append(CustomAuthorizationAttribute.AUTH_USER_COOKIE, 
						CustomAuthorizationAttribute.EncryptId(u.id));
					
					return Ok(u);
				}
			}
			
			return Unauthorized();
		}

		[AllowAnonymous]
		[HttpGet("LogOut")]
		public ActionResult LogOut()
		{
			String cookie;

			if (Request.Cookies.TryGetValue(CustomAuthorizationAttribute.AUTH_USER_COOKIE, out cookie))
				Response.Cookies.Delete(CustomAuthorizationAttribute.AUTH_USER_COOKIE);

			return Ok();
		}

		[AllowAnonymous]
		[HttpPost("Register")]
		public ActionResult Register(UserInfo user)
		{
			var confirmationId = Guid.NewGuid();

            using (var userStore = new UserStore(dbContext))
            {
                using (var trans = dbContext.Database.BeginTransaction())
                {
                    userStore.CreateAsync(user, confirmationId).Wait();

                    new MailHelper(_config).SendRegistrationConfirmation
                        (new RequestHeaders(Request.Headers).Referer, user, confirmationId);

                    trans.Commit();
                }
            }
            			
			return Ok();
		}

		[AllowAnonymous]
		[HttpGet("Confirm")]
		public ActionResult Confirm(Guid confirmationId)
		{
			using (var userStore = new UserStore(dbContext))
			{ 
				if (!userStore.ConfirmUser(confirmationId))
					return BadRequest("Either this account expired or it does not exist");
			
				return Ok();
			}
		}
	}
}
