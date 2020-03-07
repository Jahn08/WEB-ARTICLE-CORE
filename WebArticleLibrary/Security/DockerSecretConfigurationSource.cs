using System;
using Microsoft.Extensions.Configuration;

namespace WebArticleLibrary.Security
{
    class DockerSecretConfigurationSource : IConfigurationSource
    {
        private string _secretsPath;

        public DockerSecretConfigurationSource(string secretsPath)
        {
            _secretsPath = secretsPath ?? throw new ArgumentNullException(nameof(secretsPath));
        }

        public IConfigurationProvider Build(IConfigurationBuilder builder)
        {
            return new DockerSecretConfigurationProvider(_secretsPath);
        }
    }
}
