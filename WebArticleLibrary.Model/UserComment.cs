using System;
using System.Collections.Generic;
using System.Runtime.Serialization;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WebArticleLibrary.Model
{
	[Table("UserComment")]
	[DataContract]
	public class UserComment
	{
		public UserComment()
		{
			RelatedComments = new List<UserComment>();
			UserComplaints = new List<UserComplaint>();
		}

		[DatabaseGenerated(DatabaseGeneratedOption.Identity)]
		[Key]
		[DataMember(Name = "id")]
		public int Id { get; set; }

        [DataMember(Name = "authorId")]
		[Required]
		public int AuthorId { get; set; }

        [DataMember(Name = "responseToId")]
		public int? ResponseToId { get; set; }

        [DataMember(Name = "articleId")]
		public int ArticleId { get; set; }

		[Required]
        [DataMember(Name = "content")]
		public Byte[] Content { get; set; }
		
		[Required]
        [DataMember(Name = "insertDate")]
		public DateTime InsertDate { get; set; }
		
        [DataMember(Name = "status")]
		public CommentStatus Status { get; set; }

		public User Author { get; set; }

		public UserComment ResponseTo { get; set; }

		public Article Article { get; set; }	
		
        [InverseProperty("ResponseTo")]
		public ICollection<UserComment> RelatedComments { get; set; }

        [InverseProperty("UserComment")]
		public ICollection<UserComplaint> UserComplaints { get; set; }
	}

	public enum CommentStatus {
		CREATED = 1,
		BLOCKED = 6,
		DELETED
	}
}
