using System;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;

namespace WebArticleLibrary.Security 
{
    static class SecurityConfigurator
    {
        public const String ADMIN_POLICY_NAME = "AdministratorPolicy";

        public const String USER_POLICY_NAME = "UserPolicy";

        public const String AUTH_COOKIE_SCHEME = "AuthenticationCookieScheme";

        public const String DEFAULT_COOKIE_NAME = "Auth_Id";

        public static void AddAdministratorPolicy(this AuthorizationOptions options)
        {
            options.AddPolicy(ADMIN_POLICY_NAME, 
                policy => policy.Requirements.Add(new StatusRequirement(true)));
        }

        public static void AddUserPolicy(this AuthorizationOptions options)
        {
            options.AddPolicy(USER_POLICY_NAME, 
                policy => policy.Requirements.Add(new StatusRequirement(false)));
        }

        public static void AddCookieAuthenticationScheme(this IServiceCollection services)
        {
            services.AddAuthentication(AUTH_COOKIE_SCHEME)
                .AddScheme<CookieAuthenticationOptions, CookieAuthenticationHandler>(
                    AUTH_COOKIE_SCHEME, AUTH_COOKIE_SCHEME,
                        opt => opt.Cookie.Name = DEFAULT_COOKIE_NAME);
        }

        public static AuthorizationPolicy BuildUserPolicy()
        {
            return new AuthorizationPolicyBuilder()
                .AddRequirements(new StatusRequirement(false))
                .Build();
        }
    }
}
