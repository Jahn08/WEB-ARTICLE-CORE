using System;
using System.Runtime.Serialization;
using WebArticleLibrary.Model;

namespace WebArticleLibrary.Models
{
    [DataContract]
    public class UserStatusUpdate 
    {
		[DataMember(Name = "userId")]
		public String UserId { get; set; }

		[DataMember(Name = "status")]
		public UserStatus Status { get; set; }
	}
}
