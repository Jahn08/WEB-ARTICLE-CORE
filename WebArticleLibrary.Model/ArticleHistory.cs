using System;
using System.Collections.Generic;
using System.Runtime.Serialization;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WebArticleLibrary.Model
{
	[Table("ArticleHistory")]
	[DataContract]
	public class ArticleHistory
	{
		public ArticleHistory()
		{
			UserNotifications = new List<UserNotification>();
		}

		[Key]
		[DatabaseGenerated(DatabaseGeneratedOption.Identity)]
		[DataMember(Name = "id")]
		public Int32 ID { get; set; }
		
		[Required]
		[DataMember(Name = "articleId")]
		public Int32 ArticleId { get; set; }

		[Required]
		[DataMember(Name = "authorId")]
		public Int32 AuthorId { get; set; }

		[Required]
		[DataMember(Name = "object")]
		public String Object { get; set; }

		[Required]
		[DataMember(Name = "insertDate")]
		public DateTime InsertDate { get; set; }
		
		[DataMember(Name = "oldValue")]
		public String OldValue { get; set; }

		[DataMember(Name = "newValue")]
		public String NewValue { get; set; }

		[DataMember(Name = "objectId")]
		public Int32? ObjectId { get; set; }
		
		[DataMember(Name = "objectType")]
		public HistoryObjectType ObjectType { get; set; }

		public User Author { get; set; }

		public Article Article { get; set; }

        [InverseProperty("ArticleHistory")]
		public ICollection<UserNotification> UserNotifications { get; set; }
	}

	public enum HistoryObjectType
	{
		ARTICLE,
		AMENDMENT,
		COMMENT
	}
}
