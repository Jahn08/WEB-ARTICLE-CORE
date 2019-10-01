using System;
using System.Runtime.Serialization;
using WebArticleLibrary.Model;

namespace WebArticleLibrary.Models
{
    [DataContract]
    public class ComplaintStatusUpdate 
    {
		[DataMember(Name = "id")]
		public Int32 ComplaintId { get; set; }

		[DataMember(Name = "status")]
		public ComplaintStatus Status { get; set; }

		[DataMember(Name = "response")]
		public String Response { get; set; }
	}
}
