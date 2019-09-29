using System;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using WebArticleLibrary.Model;
using Microsoft.AspNetCore.Authorization;
using System.Threading.Tasks;

namespace WebArticleLibrary.Security
{
    public class StatusAuthorizationHandler : AuthorizationHandler<StatusRequirement>
	{
        protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, 
            StatusRequirement requirement)
        {
            if (HasProperStatus(requirement))
                context.Succeed(requirement);
            else
                context.Fail();

            return Task.CompletedTask;
        }
		
		private Boolean HasProperStatus(StatusRequirement requirement)
		{
            var principal = Thread.CurrentPrincipal as ClaimsPrincipal;

            if (principal == null || principal.Identity?.IsAuthenticated != true)
                return false;

            var roleClaim = principal.Claims.SingleOrDefault(c => c.Type == ClaimTypes.Role);

            if (roleClaim == null || 
                (requirement.IsAdministrator && 
                    roleClaim.Value != UserStatus.ADMINISTRATOR.ToString()) || 
                roleClaim.Value == UserStatus.BANNED.ToString())
                return false;

			return true;
		}
    }
}
