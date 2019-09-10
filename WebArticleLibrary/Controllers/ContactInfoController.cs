using System;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Authorization;


namespace WebArticleLibrary.Controllers
{
	[ApiController]
    [AllowAnonymous]
	public class ContactInfoController: ControllerBase
	{
		IConfigurationSection _contactInfoSection;
		public ContactInfoController(IConfiguration config)
		{
            _contactInfoSection = config.GetSection("ContactInfo");
		}

		[HttpGet]
		public ActionResult GetBasicInfo()
		{
			return Ok(new {
				fax = _contactInfoSection.GetValue<String>("Fax"),
				phone = _contactInfoSection.GetValue<String>("Phone"),
				mail = _contactInfoSection.GetValue<String>("Mail"),
				youtubeLink = _contactInfoSection.GetValue<String>("YoutubeLink"),
				facebookLink = _contactInfoSection.GetValue<String>("FacebookLink")
			});
		}

		[HttpGet]
		public ActionResult GetAboutUsInfo()
		{
			return Ok(new {
				aboutUs = _contactInfoSection.GetValue<String>("AboutUs")
			});
		}
	}
}
