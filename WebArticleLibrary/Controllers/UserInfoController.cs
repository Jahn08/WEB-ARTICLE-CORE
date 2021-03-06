﻿using System;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using WebArticleLibrary.Model;
using WebArticleLibrary.Models;
using WebArticleLibrary.Helpers;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http.Headers;
using WebArticleLibrary.Security;

namespace WebArticleLibrary.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserInfoController : LibraryControllerBase
    {
		private IConfiguration _config;

        public UserInfoController(ArticleLibraryContext dbContext, IConfiguration config):
            base(dbContext)
        {
            _config = config;
        }

		[AllowAnonymous]
		[HttpGet("ResetPassword")]
		public ActionResult ResetPassword(String email)
		{
			Guid confirmationId;
			UserInfo user;

			using (var store = new UserStore(this.dbContext))
				user = store.MarkForResettingPassword(email, out confirmationId);

            new MailHelper(_config)
                .SendPasswordResetConfirmation(GetRefererUri(), user, confirmationId);

			return Ok();
		}

        private Uri GetRefererUri()
        {
            return new RequestHeaders(Request.Headers).Referer;
        }
		
		[AllowAnonymous]
		[HttpPost("ReplacePassword")]
		public ActionResult ReplacePassword(ReplacePasswordForm formData)
		{
			using (var store = new UserStore(this.dbContext))
			{
				if (!store.ResetPassword(formData.newPassword, formData.confirmationId))
					return BadRequest("Either this link expired or the password does not need to be resetted");
			}
						
			return Ok();
		}

		[HttpGet("All")]
		public ActionResult GetUsers(Int32 page = 1, String name = null, String login = null,
			String email = null, UserStatus? Status = null, 
			ColumnIndex colIndex = ColumnIndex.NAME, Boolean asc = true)
		{
			UserInfo user;
			IEnumerable<UserInfo> userData;
			Dictionary<Int32, Int32> cmntNumber = null;
			Dictionary<Int32, Int32> artNumber = null;
			Int32 dataCount = 0;

			using (var db = new Model.ArticleLibraryContext())
			{
				UserStore store = new UserStore(db);
			
				if ((user = GetInfoInternally(store)) == null)
					return Unauthorized();

				var curUserId = user.id;
				var users = store.GetProperUsers().Where(u => u.Id != curUserId);

				if (Status != null)
					users = users.Where(u => u.Status == Status);

				if (login != null)
					users = users.Where(u => u.Login.IndexOf(login, NO_CASE_COMPARISON) != -1);

				if (email != null || name != null)
				{
					users = users.Where(u => u.ShowPrivateInfo);

					if (email != null)
						users = users.Where(u => u.Email.IndexOf(email, NO_CASE_COMPARISON) != -1);

					if (name != null)
						users = users.Where(u => (u.FirstName + u.LastName + u.PatronymicName)
                            .IndexOf(name, NO_CASE_COMPARISON) != -1);
				}

				users = OrderUsers(users, colIndex, asc);
				dataCount = users.Count();
				users = users.Skip((page - 1) * PAGE_LENGTH).Take(PAGE_LENGTH);

				cmntNumber = (from uc in db.UserComment.Where(c => c.Status != CommentStatus.DELETED)
							 join uId in users.Select(us => us.Id) on uc.AuthorId equals uId
								group uc by uc.AuthorId into g
								select g).ToDictionary(k => k.Key, v => v.Count());
				artNumber = (from art in db.Article.Where(a => a.Status != ArticleStatus.DRAFT)
							  join uId in users.Select(us => us.Id) on art.AuthorId equals uId
							  group art by art.AuthorId into g
							  select g).ToDictionary(k => k.Key, v => v.Count());

				userData = users.ToArray().Select(u => new UserInfo(u, true));
			}

			return Ok(new
			{
				data = userData,
				dataCount = dataCount,
				cmntNumber = cmntNumber,
				artNumber = artNumber,
				pageLength = PAGE_LENGTH
			});
		}

		private IQueryable<User> OrderUsers(IQueryable<User> source, ColumnIndex colIndex, Boolean asc)
		{
			switch (colIndex)
			{
				case ColumnIndex.NAME:
					source = asc ? source.OrderBy(s => s.Login) : 
                        source.OrderByDescending(s => s.Login);
					break;
				case ColumnIndex.STATUS:
					source = asc ? source.OrderBy(s => s.Status.ToString()) : 
                        source.OrderByDescending(s => s.Status.ToString());
					break;
			}

			return source;
		}

		[HttpPost("{userId}/Status")]
		[Authorize(SecurityConfigurator.ADMIN_POLICY_NAME)]
		public ActionResult SetUserStatus(UserStatusUpdate model)
		{
			UserInfo userForUpd;

            var userId = model.UserId;
            var status = model.Status;

			using (UserStore store = new UserStore(this.dbContext))
			{
				userForUpd = store.FindByIdAsync(userId).Result;

				if (userForUpd == null)
					return BadRequest("There is no user with id " + userId);

				if (userForUpd.status == status)
					return BadRequest($"The user already has '{status.ToString()}' status");

				userForUpd.status = status;
				store.Update(userForUpd);
			}

			new MailHelper(_config).SendUpdateStatusNotification(
                GetRefererUri(), userForUpd,
				$"your status has been changed to \"{Enum.GetName(typeof(Model.UserStatus), status)}\"");

			return Ok();
		}

		[HttpGet]
		public ActionResult GetInfo(String userId, Boolean getPhoto = false)
		{
			UserInfo user;

			using (var store = new UserStore(this.dbContext))
			{
				if ((user = GetInfoInternally(store, userId)) == null)
					return BadRequest("No user was found");
			}

			if (!getPhoto)
				user.photo = null;

			return Ok(user);
		}

		private UserInfo GetInfoInternally(UserStore store, String userId = null)
		{			
			// The usage of the current user
			if (String.IsNullOrEmpty(userId))
				return store.GetCurrentUserInfo(User.Identity);

			return store.FindByIdAsync(userId).Result;
		}

		[HttpPost]
		public ActionResult SaveInfo(UserInfo userInfo)
		{
			Guid? confirmationId;
			
			using (var store = new UserStore(this.dbContext))
				confirmationId = store.Update(userInfo);

			// Is it a bid to change email address?
			if (confirmationId.HasValue)
                new MailHelper(_config)
                    .SendEmailChangeConfirmation(GetRefererUri(), userInfo, confirmationId.Value);

			return Ok();
		}

		[AllowAnonymous]
		[HttpGet("ConfirmEmail")]
		public ActionResult ConfirmEmail(Guid confirmationId)
		{
			using (var userStore = new UserStore(this.dbContext))
			{ 		
				if (!userStore.ConfirmNewEmail(confirmationId))
					return BadRequest("Either this link expired or the email does not need to be confirmed");
			}

			return Ok();
		}
	}
}
