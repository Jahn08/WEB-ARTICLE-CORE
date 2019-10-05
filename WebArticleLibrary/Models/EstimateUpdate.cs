using System;
using System.Runtime.Serialization;
using WebArticleLibrary.Model;

namespace WebArticleLibrary.Models
{
    [DataContract]
    public class EstimateUpdate 
    {
		[DataMember(Name = "id")]
		public Int32 ArticleId { get; set; }

		[DataMember(Name = "estimate")]
		public EstimateType Estimate { get; set; }
	}
}
