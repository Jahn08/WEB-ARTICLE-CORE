using Microsoft.Extensions.Configuration;

namespace WebArticleLibrary.Security
{
    static class DockerSwarmSecretsConfigurator
    {
        public static IConfigurationBuilder AddDockerSwarmSecrets(
            this IConfigurationBuilder configurationBuilder, string secretsPath)
        {
            configurationBuilder.Add(new DockerSecretConfigurationSource(secretsPath));
            return configurationBuilder;
        }
    }
}
