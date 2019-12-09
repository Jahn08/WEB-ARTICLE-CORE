using System;
using System.Runtime.Serialization;
using WebArticleLibrary.Model;
using Microsoft.AspNet.Identity;

namespace WebArticleLibrary.Models
{
	[DataContract]
	public class UserInfo: IUser<String>
	{
		public UserInfo() { }
		
		public UserInfo(User user, Boolean considerPrivateData = false)
		{
			this.id = user.Id;
			this.UserName = user.Login;
			this.status = user.Status;
			this.insertDate = user.InsertDate;
			this.showPrivateInfo = user.ShowPrivateInfo;
			this.photo = user.Photo;

			if (!considerPrivateData || this.showPrivateInfo)
			{
				this.hash = user.Hash;
				this.email = user.Email;
				this.expirationDate = user.ExpirationDate;
				this.newEmailExpirationDate = user.NewEmailExpirationDate;
				this.resetPasswordExpirationDate = user.ResetPasswordExpirationDate;
				this.firstName = user.FirstName;
				this.lastName = user. LastName;
				this.patronymicName = user.PatronymicName;
			}
		}
		
		public static explicit operator User(UserInfo user)
		{
			return new User {
				Id = user.id,
				Login = user.UserName,
				FirstName = user.firstName,
				LastName = user.lastName,
				PatronymicName = user.patronymicName,
				Email = user.email,
				Hash = user.password == null ? null: user.GetHash(),
				Status = user.status,
				InsertDate = user.insertDate,
				ExpirationDate = user.expirationDate,
				NewEmailExpirationDate = user.newEmailExpirationDate,
				ResetPasswordExpirationDate = user.resetPasswordExpirationDate,
				Photo = user.photo
			};
		}
		
		[DataMember]
		public UserStatus status { get; set; }

		[DataMember]
		public Int32 id { get; set; }

		[DataMember]
		public String name { get; set; }

		[DataMember]
		public String password { get; set; }

		[DataMember]
		public String newPassword { get; set; }

		[DataMember]
		public String firstName { get; set; }

		[DataMember]
		public String lastName { get; set; }

		[DataMember]
		public String patronymicName { get; set; }

		[DataMember]
		public String email { get; set; }

		[DataMember]
		public Byte[] photo { get; set; }

		[DataMember]
		public Boolean showPrivateInfo { get; set; }

		[DataMember]
		public DateTime insertDate { get; set; }

		[DataMember]
		public DateTime? expirationDate { get; set; }

		[DataMember]
		public DateTime? newEmailExpirationDate { get; set; }

		[DataMember]
		public DateTime? resetPasswordExpirationDate { get; set; }

		private String hash;
		
		public String GetHash() {
			if (!String.IsNullOrEmpty(this.hash))
				return this.hash;

			return this.hash = GetHash(this.password);
		}

		public static String GetHash(String val)
		{
			if (String.IsNullOrEmpty(val))
				throw new NullReferenceException("There is no field to be hashed");

			var pHasher = new PasswordHasher();
			return pHasher.HashPassword(val);
		}

		public String Id
		{
			get
			{
				return id.ToString();
			}
		}

		public string UserName
		{
			get
			{
				return name;
			}

			set
			{
				name = value;
			}
		}
	}
}
