using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Runtime.Serialization;

namespace WebArticleLibrary.Model
{
	[Table("Amendment")]
	[DataContract]
	public class Amendment
	{
		[DatabaseGenerated(DatabaseGeneratedOption.Identity)]
		[Key]
        [DataMember(Name="id")]
		public Int32 Id { get; set; }

        [DataMember(Name="authorId")]
		[Required]
		public Int32 AuthorId { get; set; }

        [DataMember(Name="articleId")]
		[Required]
		public Int32 ArticleId { get; set; }

		[Required]
        [DataMember(Name="content")]
		public String Content { get; set; }
		
        [DataMember(Name="resolved")]
		public Boolean Resolved { get; set; }
		
        [DataMember(Name="archived")]
		public Boolean Archived { get; set; }

		[Required]
        [DataMember(Name="insertDate")]
		public DateTime InsertDate { get; set; }

		public virtual Article Article { get; set; }

		public virtual User Author { get; set; }
	}
}
