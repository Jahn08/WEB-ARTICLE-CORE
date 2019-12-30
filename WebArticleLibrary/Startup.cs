using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using WebArticleLibrary.Model;
using Microsoft.EntityFrameworkCore;
using WebArticleLibrary.Hubs;
using WebArticleLibrary.Security;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.AspNetCore.Authorization;

namespace WebArticleLibrary
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        public void ConfigureServices(IServiceCollection services)
        {
            services.AddSingleton<IAuthorizationHandler, StatusAuthorizationHandler>();

            services.AddMvc(options => options.Filters.Add(
                new AuthorizeFilter(SecurityConfigurator.BuildUserPolicy()))
            ).SetCompatibilityVersion(CompatibilityVersion.Version_2_2);

            services.AddCookieAuthenticationScheme();

            services.AddAuthorization(options => {
                options.AddAdministratorPolicy();
                options.AddUserPolicy();
            });

            services.AddDbContext<ArticleLibraryContext>(options => 
                options.UseLazyLoadingProxies()
                    .UseSqlServer(Configuration.GetConnectionString("WebArticle")));
        
            services.AddSignalR();
        }

        public void Configure(IApplicationBuilder app, IHostingEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
            }

            using (var serviceScope = app.ApplicationServices.GetService<IServiceScopeFactory>().CreateScope())
            {
                var context = serviceScope.ServiceProvider.GetRequiredService<ArticleLibraryContext>();
                context.Database.Migrate();
            }

            app.UseFileServer();

            app.UseHttpsRedirection();
            
            app.UseAuthentication();
            
            app.UseMvc();

            app.UseSignalR(route => {
                route.MapHub<NotificationHub>("/notificationHub");
            });
        }
    }
}
