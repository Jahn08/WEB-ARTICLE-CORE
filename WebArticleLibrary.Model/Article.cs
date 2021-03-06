﻿using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Runtime.Serialization;
using System.Collections.Generic;
using System.Linq;

namespace WebArticleLibrary.Model
{
	[Table("Article")]
	[DataContract]
	public class Article
	{
		public Article()
		{
			Amendments = new List<Amendment>();
			ArticleHistory = new List<ArticleHistory>();
			UserComments = new List<UserComment>();
			UserEstimates = new List<UserEstimate>();
			UserComplaints = new List<UserComplaint>();
		}

		public static String[] GetTagList(String tags) {
			return tags == null ? new String[0]: tags.Split(" ");
		}

		[DatabaseGenerated(DatabaseGeneratedOption.Identity)]
		[Key]
        [DataMember(Name = "id")]
		public int Id { get; set; }

		[DataMember(Name = "authorId")]
		[Required]
		public int AuthorId { get; set; }

        [DataMember(Name = "assignedToId")]
        public int? AssignedToId { get; set; }
	
		[Required]
		[StringLength(200)]
        [DataMember(Name = "name")]
		public String Name { get; set; }
		
		[StringLength(500)]
        [DataMember(Name = "description")]
		public String Description { get; set; }

		[Required]
		[StringLength(50)]
        [DataMember(Name = "tags")]
		public String Tags { get; set; }
		
		[Required]
        [DataMember(Name = "insertDate")]
		public DateTime InsertDate { get; set; }
		
		[Required]        
        [DataMember(Name = "status")]
		public ArticleStatus Status { get; set; }

		[Required]
        [DataMember(Name = "content")]
		public Byte[] Content { get; set; }
		
        [DataMember(Name = "reviewedContent")]
		public Byte[] ReviewedContent { get; set; }

		public virtual User Author { get; set; }

		public virtual User AssignedTo { get; set; }

        [InverseProperty("Article")]
		public virtual ICollection<Amendment> Amendments { get; set; }

        [InverseProperty("Article")]
		public virtual ICollection<ArticleHistory> ArticleHistory { get; set; }

        [InverseProperty("Article")]
		public virtual ICollection<UserComment> UserComments { get; set; }

        [InverseProperty("Article")]
		public virtual ICollection<UserEstimate> UserEstimates { get; set; }

        [InverseProperty("Article")]
		public virtual ICollection<UserComplaint> UserComplaints { get; set; }

		public Int32 GetFinalEstimate()
		{
			return this.UserEstimates.Count(e => e.Estimate == EstimateType.POSITIVE) -
				this.UserEstimates.Count(e => e.Estimate == EstimateType.NEGATIVE);
		}
	}

	public enum ArticleStatus
	{
		DRAFT,
		CREATED,
		ON_REVIEW,
		ON_EDIT,
		APPROVED,
		ON_AMENDING = 8
	}
}
