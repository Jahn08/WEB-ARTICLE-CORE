using System;
using System.IO;
using Microsoft.Extensions.Configuration;

namespace WebArticleLibrary.Security
{
    class DockerSecretConfigurationProvider : ConfigurationProvider
    {
        private readonly string secretsPath;
        
        public DockerSecretConfigurationProvider(string secretsPath)
        {
            this.secretsPath = secretsPath ?? throw new ArgumentNullException(nameof(secretsPath));
        }

        public override void Load()
        {
            if (Directory.Exists(this.secretsPath))
            {
                foreach (var file in Directory.EnumerateFiles(this.secretsPath))
                {
                    ProcessFile(file);
                }
            }
        }

        private void ProcessFile(string filePath)
        {
            var fileName = Path.GetFileName(filePath);

            if (!string.IsNullOrWhiteSpace(fileName))
            {
                var key = fileName.Replace("__", ":");
                var value = File.ReadAllText(filePath);

                Data[key] = value?.TrimEnd('\n');
            }
        }
    }
}
