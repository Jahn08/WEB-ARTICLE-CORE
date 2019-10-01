using System;
using System.Runtime.Serialization;
using WebArticleLibrary.Model;

namespace WebArticleLibrary.Models
{
    [DataContract]
    public class CommentStatusUpdate 
    {
		[DataMember(Name = "id")]
		public Int32 CommentId { get; set; }

		[DataMember(Name = "status")]
		public CommentStatus Status { get; set; }
	}
}
