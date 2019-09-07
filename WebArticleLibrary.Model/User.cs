namespace WebArticleLibrary.Model
{
	using System;
    using System.ComponentModel.DataAnnotations;
	using System.ComponentModel.DataAnnotations.Schema;
	using System.Collections.Generic;

    [Table("User")]
    public partial class User
    {
		public User()
		{
			Articles = new List<Article>();
			AssignedArticles = new List<Article>();
			Amendments = new List<Amendment>();
			ArticleHistory = new List<ArticleHistory>();
			UserComments = new List<UserComment>();
			UserEstimates = new List<UserEstimate>();
			UserComplaints = new List<UserComplaint>();
			AssignedUserComplaints = new List<UserComplaint>();
			UserNotifications = new List<UserNotification>();
		}

		[DatabaseGenerated(DatabaseGeneratedOption.Identity)]
		[Key]
		public int Id { get; set; }

        [Required]
        [StringLength(10)]
        public string Login { get; set; }

        [Required]
        [StringLength(50)]
        public string FirstName { get; set; }

        [Required]
        [StringLength(50)]
        public string LastName { get; set; }

        [StringLength(50)]
        public string PatronymicName { get; set; }

        [Required]
        [StringLength(50)]
        public string Email { get; set; }

        [Required]
        [StringLength(250)]
        public string Hash { get; set; }

		[Required]
		public DateTime InsertDate { get; set; }
		
		public DateTime? ExpirationDate { get; set; }

		public Guid? ConfirmationDate { get; set; }

		public String NewEmail { get; set; }

		public DateTime? NewEmailExpirationDate { get; set; }

		public DateTime? ResetPasswordExpirationDate { get; set; }

		public Byte[] Photo { get; set; }

		[Required]
		public UserStatus Status { get; set; }

		public Boolean ShowPrivateInfo { get; set; }

		[InverseProperty("Author")]
		public ICollection<Article> Articles { get; set; }

		[InverseProperty("AssignedTo")]
		public ICollection<Article> AssignedArticles { get; set; }

		[InverseProperty("Author")]
		public ICollection<Amendment> Amendments { get; set; }

		[InverseProperty("Author")]
		public ICollection<ArticleHistory> ArticleHistory { get; set; }

		[InverseProperty("Author")]
		public ICollection<UserComment> UserComments { get; set; }

		[InverseProperty("Author")]
		public ICollection<UserEstimate> UserEstimates { get; set; }

		[InverseProperty("Author")]
		public ICollection<UserComplaint> UserComplaints { get; set; }
		
		[InverseProperty("AssignedTo")]
		public ICollection<UserComplaint> AssignedUserComplaints { get; set; }

		[InverseProperty("Recipient")]
		public ICollection<UserNotification> UserNotifications { get; set; }
		
		public String DisplayName {
			get {
				return String.Format("{0} {1}{2}", this.FirstName, this.LastName,
					this.PatronymicName == null ? null : " " + this.PatronymicName);
			}
		}
	}

	public enum UserStatus
	{
		USER,
		BANNED,
		ADMINISTRATOR = 5
	}
}
