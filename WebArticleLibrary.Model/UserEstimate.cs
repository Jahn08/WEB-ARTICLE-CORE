using System;
using System.Runtime.Serialization;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WebArticleLibrary.Model
{
	[Table("UserEstimate")]
	[DataContract]
	public class UserEstimate
	{	
		[DatabaseGenerated(DatabaseGeneratedOption.Identity)]
		[Key]
		[DataMember(Name = "id")]
		public int Id { get; set; }

		[DataMember(Name = "authorId")]
		[Required]
		public int AuthorId { get; set; }
		
		[DataMember(Name = "articleId")]
		public int ArticleId { get; set; }
		
		[Required]
		[DataMember(Name = "estimate")]
		public EstimateType Estimate { get; set; }

		[Required]
		[DataMember(Name = "insertDate")]
		public DateTime InsertDate { get; set; }
		
		public User Author { get; set; }

		public Article Article { get; set; }		
	}

	public enum EstimateType {
		NONE,
		POSITIVE,
		NEGATIVE
	}
}
