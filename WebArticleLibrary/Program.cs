using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using WebArticleLibrary.Security;

namespace WebArticleLibrary
{
    public class Program
    {
        public static void Main(string[] args)
        {
            CreateWebHostBuilder(args).Build().Run();
        }

        public static IWebHostBuilder CreateWebHostBuilder(string[] args) =>
            WebHost.CreateDefaultBuilder(args)
                .ConfigureAppConfiguration(configBuilder => 
                    configBuilder.AddDockerSwarmSecrets("/run/secrets"))
                .UseStartup<Startup>();
    }
}
