namespace WebArticleLibrary.Model
{
	using System;
	using Microsoft.EntityFrameworkCore;

	public partial class ArticleLibraryContext : DbContext, IDisposable
	{
		public ArticleLibraryContext(): base()
		{
			//TODO: Dealing with migrations after turning them on later:
            //Database.SetInitializer(
            //new MigrateDatabaseToLatestVersion<ArticleLibraryContext, Configuration>());
		}

		public ArticleLibraryContext(DbContextOptions<ArticleLibraryContext> options): base(options)
		{
		}

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
                optionsBuilder.UseNpgsql("User ID=postgres;Password=postgres;Host=localhost;Port=5432;Database=weblibrary;");
        }

		public void Close()
		{
			this.Dispose();
		}

		public virtual DbSet<User> User { get; set; }
		
        public virtual DbSet<Article> Article { get; set; }
		
        public virtual DbSet<Amendment> Amendment { get; set; }
		
        public virtual DbSet<ArticleHistory> ArticleHistory { get; set; }
		
        public virtual DbSet<UserComment> UserComment { get; set; }
		
        public virtual DbSet<UserEstimate> UserEstimate { get; set; }
		
        public virtual DbSet<UserComplaint> UserComplaint { get; set; }
		
        public virtual DbSet<UserNotification> UserNotification { get; set; }
	}
}
