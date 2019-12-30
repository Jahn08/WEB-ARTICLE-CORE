namespace WebArticleLibrary.Model
{
	using System;
	using Microsoft.EntityFrameworkCore;

	public partial class ArticleLibraryContext : DbContext, IDisposable
	{
		public ArticleLibraryContext(): base()
		{
		}

		public ArticleLibraryContext(DbContextOptions<ArticleLibraryContext> options): base(options)
		{
		}

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
                optionsBuilder.UseSqlServer("Data Source=localhost;Initial Catalog=weblibrary;User ID=sa;Password=Mike-1234;");
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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>()
                .HasMany(a => a.Articles).WithOne(u => u.Author).IsRequired()
                .HasForeignKey(a => a.AuthorId).OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<User>()
                .HasMany(a => a.UserComplaints).WithOne(u => u.Author).IsRequired()
                .HasForeignKey(a => a.AuthorId).OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<UserComment>()
                .HasMany(a => a.UserComplaints).WithOne(u => u.UserComment)
                .HasForeignKey(a => a.UserCommentId).OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<User>()
                .HasMany(a => a.AssignedUserComplaints).WithOne(u => u.AssignedTo)
                .HasForeignKey(a => a.AssignedToId).OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<User>()
                .HasMany(a => a.UserComments).WithOne(u => u.Author).IsRequired()
                .HasForeignKey(a => a.AuthorId).OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<UserComment>()
                .HasMany(a => a.RelatedComments).WithOne(u => u.ResponseTo)
                .HasForeignKey(a => a.ResponseToId).OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<User>()
                .HasMany(a => a.UserEstimates).WithOne(u => u.Author).IsRequired()
                .HasForeignKey(a => a.AuthorId).OnDelete(DeleteBehavior.Restrict);

			modelBuilder.Entity<Article>().HasOne(a => a.AssignedTo).WithMany(u => u.AssignedArticles)
                .HasForeignKey(a => a.AssignedToId).OnDelete(DeleteBehavior.SetNull);
            
            modelBuilder.Entity<User>()
                .HasMany(u => u.Amendments).WithOne(a => a.Author).IsRequired()
                .HasForeignKey(a => a.AuthorId).OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<User>()
                .HasMany(u => u.ArticleHistory).WithOne(a => a.Author).IsRequired()
                .HasForeignKey(a => a.AuthorId).OnDelete(DeleteBehavior.Restrict);
                
            modelBuilder.Entity<User>()
                .HasMany(u => u.UserNotifications).WithOne(a => a.Recipient).IsRequired()
                .HasForeignKey(a => a.RecipientId).OnDelete(DeleteBehavior.Restrict);
        }
	}
}
