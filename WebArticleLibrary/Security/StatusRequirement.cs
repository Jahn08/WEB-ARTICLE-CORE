using System;
using Microsoft.AspNetCore.Authorization;

namespace WebArticleLibrary.Security
{
    public class StatusRequirement : IAuthorizationRequirement
	{
        public Boolean IsAdministrator { get; }

        public StatusRequirement(Boolean isAdmin)
        {
            IsAdministrator = isAdmin;
        }
    }
}
