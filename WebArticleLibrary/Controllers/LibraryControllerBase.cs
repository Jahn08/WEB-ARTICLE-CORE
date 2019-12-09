using WebArticleLibrary.Helpers;
using WebArticleLibrary.Models;
using WebArticleLibrary.Model;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;
using System.Collections.Generic;

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
            return UserStore.GetCurrentUserId(User.Identity);
        }

        public OkObjectResult ArrayResult<T>(IEnumerable<T> items)
        {
            return Ok(new { items = items.ToArray() });
        }
    }
}
