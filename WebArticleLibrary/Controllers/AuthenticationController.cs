using System;
using Microsoft.AspNet.Identity;
using WebArticleLibrary.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebArticleLibrary.Model;
using WebArticleLibrary.Helpers;

namespace WebArticleLibrary.Controllers
{
	[ApiController]
	public class AuthenticationController: ControllerBase
	{
		private ArticleLibraryContext _dbContext;

		public AuthenticationController(ArticleLibraryContext dbContext)
		{
			_dbContext = dbContext;
		}

		[AllowAnonymous]
		[HttpPost]
		public ActionResult LogIn(UserInfo user)
		{
			UserInfo u;
			String cookie;

			using (var userStore = new UserStore(_dbContext))
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
		[HttpGet]
		public ActionResult LogOut()
		{
			String cookie;

			if (Request.Cookies.TryGetValue(CustomAuthorizationAttribute.AUTH_USER_COOKIE, out cookie))
				Response.Cookies.Delete(CustomAuthorizationAttribute.AUTH_USER_COOKIE);

			return Ok();
		}

		[AllowAnonymous]
		[HttpPost]
		public ActionResult Register(UserInfo user)
		{
			var confirmationId = Guid.NewGuid();

            using (var userStore = new UserStore(_dbContext))
            {
                userStore.CreateAsync(user, confirmationId).Wait();

                try
                {
					// TODO: Uncomment after adding the respective email helper
                    // MailHelper.SendConfirmationEmail("Registration", Properties.Resources.Authentication_Register_Message,
                    //     "confirmuser", user, confirmationId);
                }
                catch {
                    userStore.DeleteAsync(user).Wait();
                    throw;
                }
            }
            			
			return Ok();
		}

		[AllowAnonymous]
		[HttpGet]
		public ActionResult Confirm(Guid confirmationId)
		{
			using (var userStore = new UserStore(_dbContext))
			{ 
				if (!userStore.ConfirmUser(confirmationId))
					return BadRequest("Either this account expired or it does not exist");
			
				return Ok();
			}
		}
	}
}
