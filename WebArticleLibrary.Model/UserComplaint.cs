using System;
using System.Runtime.Serialization;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WebArticleLibrary.Model
{
	[Table("UserComplaint")]
	[DataContract]
	public class UserComplaint
	{
		[DatabaseGenerated(DatabaseGeneratedOption.Identity)]
		[Key]
		[DataMember(Name = "id")]
		public int Id { get; set; }

		[DataMember(Name = "authorId")]
		[Required]
		public int AuthorId { get; set; }

		[DataMember(Name = "assignedToId")]
		public int? AssignedToId { get; set; }

		[DataMember(Name = "userCommentId")]
		public int? UserCommentId { get; set; }

		[DataMember(Name = "articleId")]
		public int ArticleId { get; set; }

		[Required]
		[DataMember(Name = "text")]
		public String Text { get; set; }
		
		[Required]
		[DataMember(Name = "insertDate")]
		public DateTime InsertDate { get; set; }
		
		[DataMember(Name = "status")]
		public virtual ComplaintStatus Status { get; set; }

		public virtual User Author { get; set; }

		public virtual UserComment UserComment { get; set; }

		public virtual Article Article { get; set; }

		public virtual User AssignedTo { get; set; }
	}

	public enum ComplaintStatus {
		CREATED= 1,
		APPROVED = 4,
		REFUSED = 5
	}
}
