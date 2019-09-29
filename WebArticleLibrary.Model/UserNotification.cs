using System;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace WebArticleLibrary.Model
{
	[Table("UserNotification")]
	public class UserNotification
	{
		[DatabaseGenerated(DatabaseGeneratedOption.Identity)]
		[Key]
		public int Id { get; set; }

		[Required]
		[MaxLength(250)]
		public String Text { get; set; }
		
		[Required]
		public DateTime InsertDate { get; set; }

		[Required]
		public int RecipientId { get; set; }

		[Required]
		public int ArticleHistoryId { get; set; }

		public virtual User Recipient { get; set; }

		public virtual ArticleHistory ArticleHistory { get; set; }
	}
}