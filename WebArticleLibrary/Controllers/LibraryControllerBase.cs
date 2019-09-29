using WebArticleLibrary.Helpers;
using WebArticleLibrary.Models;
using WebArticleLibrary.Model;
using Microsoft.AspNetCore.Mvc;
using System;

namespace WebArticleLibrary.Controllers
{
	public class LibraryControllerBase: ControllerBase
	{   
		protected const Int32 PAGE_LENGTH = 10;

		protected readonly ArticleLibraryContext dbContext;

        public LibraryControllerBase(ArticleLibraryContext dbContext)
        {
            this.dbContext = dbContext;
        }

        protected UserInfo GetUserInfo()
        {
            return new UserStore(dbContext).GetCurrentUserInfo(User.Identity);
        }

        protected Int32 GetCurrentUserId()
        {
            Int32 id;
            return Int32.TryParse(UserStore.GetCurrentUserId(User.Identity), out id) ? id: 0;
        }
    }
}
