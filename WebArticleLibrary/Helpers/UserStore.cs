using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using System.IO;
using Microsoft.AspNet.Identity;
using WebArticleLibrary.Models;
using WebArticleLibrary.Model;
using System.Drawing;
using System.Security.Principal;

namespace WebArticleLibrary.Helpers
{
	public class UserStore : IUserStore<UserInfo>, IUserClaimStore<UserInfo>
	{
		private readonly ArticleLibraryContext db;
		public const Int32 expirationMinutes = 30;
		
		public UserStore(ArticleLibraryContext dbContext)
		{
			db = dbContext;
		}

		public UserInfo GetCurrentUserInfo(IIdentity identity)
		{
            var userId = GetCurrentUserId(identity);
            return userId == 0 ? null: this.FindByIdAsync(userId).Result;
		}

        public static Int32 GetCurrentUserId(IIdentity identity)
        {
			ClaimsIdentity claimsIdentity;
			Claim claim = null;

            if ((claimsIdentity = identity as ClaimsIdentity) == null ||
				(claim = claimsIdentity.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Sid)) == null)
				return 0;

			Int32 userId;
            return Int32.TryParse(claim.Value, out userId) ? userId: 0;
        }

		public Task AddClaimAsync(UserInfo user, Claim claim)
		{
			throw new NotImplementedException();
		}

		public Task CreateAsync(UserInfo user)
		{
			return Task.Run(() => InsertUser((User)user));
		}

		public Task CreateAsync(UserInfo user, Guid confirmationId)
		{
			if (this.FindByNameAsync(user.name).Result != null)
				throw new Exception("There is already a user with the same name \"" + user.name + "\"");

			if (this.FindByEmailAsync(user.email).Result != null)
				throw new Exception("There is already a user with the same email");

			var u = (User)user;
			u.ConfirmationId = confirmationId;
			u.ExpirationDate = DateTime.Now.AddMinutes(expirationMinutes);

			return Task.Run(() => InsertUser(u));
		}

		private void InsertUser(User user)
		{
			user.InsertDate = DateTime.Now;
			
			// The first registered user is always an administrator
			if (!db.User.Any())
				user.Status = UserStatus.ADMINISTRATOR;

			db.User.Add(user);
			db.SaveChanges();
		}

		public Task DeleteAsync(UserInfo user)
		{
			return Task.Run(() => {
                var _user = db.User.FirstOrDefault(u => u.Email == user.email);

                if (_user != null)
                {
                    db.User.Remove(_user);
                    db.SaveChanges();
                }
            });
		}

		public void Dispose()
		{
			db.Dispose();
		}

		public Boolean ConfirmUser(Guid confirmationId)
		{
			var now = DateTime.Now;
			var user = db.User.FirstOrDefault(u => u.ConfirmationId == confirmationId);

			if (user == null)
				return false;

			if (user.ExpirationDate < now)
			{
				db.User.Remove(user);
				db.SaveChanges();
				return false;
			}

			user.ExpirationDate = null;
			user.ConfirmationId = null;
			db.SaveChanges();

			return true;
		}

		public Task<UserInfo> FindByIdAsync(String userId)
		{
			Int32 _userId;
			return Int32.TryParse(userId, out _userId) ? FindByIdAsync(_userId): null;
		}

		public Task<UserInfo> FindByIdAsync(Int32 userId)
		{
			return Task<UserInfo>.Run(() => {
				var res = FindUser(userId);
				return res == null ? null : new UserInfo(res);
			});
		}

		private User FindUser(Int32 userId)
		{
			return db.User.FirstOrDefault(u => u.Id == userId && u.ExpirationDate == null);
		}

		public UserInfo MarkForResettingPassword(String email, out Guid confirmationId)
		{
			var user = db.User.FirstOrDefault(u => u.Email == email && u.ExpirationDate == null);

			if (user == null)
				throw new Exception("There is no user with such an email address");

			user.ResetPasswordExpirationDate = DateTime.Now.AddMinutes(expirationMinutes);

			confirmationId = Guid.NewGuid();
			user.ConfirmationId = confirmationId;
			db.SaveChanges();

			return new UserInfo(user);
		}

		public Boolean ResetPassword(String newPassword, Guid confirmationId)
		{
			var now = DateTime.Now;
			var user = db.User.FirstOrDefault(u => u.ConfirmationId == confirmationId);

			if (user == null)
				return false;

			var confirmed = user.ResetPasswordExpirationDate > DateTime.Now;

			if (confirmed)
				user.Hash = UserInfo.GetHash(newPassword);

			user.ResetPasswordExpirationDate = null;
			user.ConfirmationId = null;
			db.SaveChanges();

			return confirmed;
		}

		public IQueryable<User> GetProperUsers()
		{
			var now = DateTime.Now;
			return db.User.Where(u => u.ExpirationDate == null || u.ExpirationDate < now);
		}

		public Task<UserInfo> FindByNameAsync(string userName)
		{
			// During every login try it will remove all expired entries
			RemoveExpired();

			return Task<UserInfo>.Run(() => {
				var res = db.User.FirstOrDefault(u => u.Login == userName && u.ExpirationDate == null);
				return res == null ? null : new UserInfo(res);
			});
		}

		public Task<UserInfo> FindByEmailAsync(String email)
		{
			var now = DateTime.Now;

			// An email might be in the process of confirmation
			return Task<UserInfo>.Run(() => {
				var res = db.User.FirstOrDefault(u => u.Email == email && (
					u.ExpirationDate == null || now < u.ExpirationDate
				));
				return res == null ? null : new UserInfo(res);
			});
		}
		
		public Boolean ConfirmNewEmail(Guid confirmationId)
		{
			var now = DateTime.Now;
			var user = db.User.FirstOrDefault(u => u.ConfirmationId == confirmationId);

			var confirmed = user.NewEmail != null && user.NewEmailExpirationDate > DateTime.Now;

			if (confirmed)
				user.Email = user.NewEmail;

			user.NewEmail = null;
			user.NewEmailExpirationDate = null;
			user.ConfirmationId = null;
			db.SaveChanges();

			return confirmed;
		}

		public Task<IList<Claim>> GetClaimsAsync(UserInfo user)
		{
			return Task.Run(() =>
			{
				List<Claim> claims = new List<Claim>();
				claims.Add(new Claim(ClaimTypes.NameIdentifier, user.UserName));
				claims.Add(new Claim(ClaimTypes.Sid, user.id.ToString()));
				claims.Add(new Claim(ClaimTypes.Role, user.status.ToString()));

				return (IList<Claim>)claims;
			});
		}

		private void RemoveExpired()
		{
			var now = DateTime.Now;
			Boolean needSaving = false;
			var expired = db.User.Where(u => u.ExpirationDate < now);

			if (expired.Any())
			{
				db.User.RemoveRange(expired);
				needSaving = true;
			}

			expired = db.User.Where(u => u.NewEmailExpirationDate < now);

			if (expired.Any())
			{
				db.User.RemoveRange(expired);
				needSaving = true;
			}

			expired = db.User.Where(u => u.ResetPasswordExpirationDate < now);

			if (expired.Any())
			{
				db.User.RemoveRange(expired);
				needSaving = true;
			}

			if (needSaving)
				db.SaveChanges();
		}

		public Guid? Update(UserInfo user)
		{
			var u = FindUser(user.id);

			if (u == null)
				throw new Exception("No user was found");

			UserInfo _u;

			if ((_u = this.FindByNameAsync(user.name).Result) != null && _u.id != user.id)
				throw new Exception("There is already a user with the same name \"" + user.name + "\"");

			// Is it a try to change password?
			if (user.newPassword != null)
			{
				var pHasher = new PasswordHasher();
				
				if (pHasher.VerifyHashedPassword(u.Hash, user.password) != PasswordVerificationResult.Success)
					throw new Exception("The old password is incorrect");
				else
					u.Hash = UserInfo.GetHash(user.newPassword);
			}

			// Is it a try to change email address?
			if (user.email != u.Email)
			{
				if (this.FindByEmailAsync(user.email).Result != null)
					throw new Exception("There is already a user with the same email");

				u.NewEmail = user.email;
				u.NewEmailExpirationDate = DateTime.Now.AddMinutes(expirationMinutes);
				u.ConfirmationId = Guid.NewGuid();
			}

			u.FirstName = user.firstName;
			u.LastName = user.lastName;
			u.PatronymicName = user.patronymicName;
			u.Login = user.name;
			u.ShowPrivateInfo = user.showPrivateInfo;
			u.Status = user.status;

			if (user.photo != null)
			{
				if (user.photo.Length == 0)
					u.Photo = null;
				else
				{
					var ms = new MemoryStream(user.photo);

					using (Image image = new Bitmap(ms))
					{
						Image.GetThumbnailImageAbort callback = new Image.GetThumbnailImageAbort(() => true);

						using (var photo = image.GetThumbnailImage(100, 100, callback, new IntPtr()))
						{
							var msPhoto = new MemoryStream();
							photo.Save(msPhoto, System.Drawing.Imaging.ImageFormat.Jpeg);
							msPhoto.Position = 0;

							Byte[] contents = new Byte[msPhoto.Length];
							msPhoto.Read(contents, 0, contents.Length);

							u.Photo = contents;
						}
					}
				}
			}

			db.SaveChanges();

			return u.ConfirmationId;
		}

		public Task RemoveClaimAsync(UserInfo user, Claim claim)
		{
			throw new NotImplementedException();
		}

		public Task UpdateAsync(UserInfo user)
		{
			throw new NotImplementedException();
		}
	}
}