using System;
using System.Linq;
using WebArticleLibrary.Model;
using WebArticleLibrary.Hubs;
using Microsoft.AspNetCore.Mvc;

namespace WebArticleLibrary.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
	public class HistoryController: LibraryControllerBase
	{
		public HistoryController(ArticleLibraryContext dbContext): base(dbContext) 
		{
        }

        [HttpGet]
		public ActionResult GetArticleHistory(Int32 articleId)
		{
			var curArt = dbContext.Article.FirstOrDefault(a => a.Id == articleId);

			if (curArt == null)
				return BadRequest("The requested article does not exist in the data base");

			return ArrayResult(curArt.ArticleHistory
				.GroupBy(h => h.InsertDate).OrderByDescending(h => h.Key)
				.Select(g => new
				{
					date = g.Key,
					author = g.First().Author.Login,
					history = g
				}));
		}
	}
}
