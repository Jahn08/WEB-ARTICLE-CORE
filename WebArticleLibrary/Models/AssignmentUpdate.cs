using System;
using System.Runtime.Serialization;

namespace WebArticleLibrary.Models
{
    [DataContract]
    public class AssignmentUpdate
    {
		[DataMember(Name = "id")]
		public Int32 EntityId { get; set; }

		[DataMember(Name = "assign")]
		public Boolean ShouldAssign { get; set; }
	}
}
