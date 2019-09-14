using System;
using System.Net.Mail;
using System.Net;
using System.Reflection;
using WebArticleLibrary.Models;
using Microsoft.Extensions.Configuration;
using WebArticleLibrary.Properties;

namespace WebArticleLibrary.Helpers
{
	public class MailHelper
	{
        private String host;

        private Int32 port;

        private String userName;

        private String password;

        public MailHelper(IConfiguration config)
        {
            var smtpConfig = config.GetSection("SMTP");
            
            host = smtpConfig.GetValue<String>("Host");
            port = smtpConfig.GetValue<Int32>("Port");
            userName = smtpConfig.GetValue<String>("UserName");
            password = smtpConfig.GetValue<String>("Password");
        }

        public void SendRegistrationConfirmation(Uri requestUrl, UserInfo userInfo, 
            Guid confirmationId)
        {
            var msgTemplate = Resources.Authentication_Register_Message;

            SendMessage(userInfo.email, "Registration", 
                String.Format(msgTemplate, userInfo.firstName, userInfo.lastName,
				$"{requestUrl.OriginalString}#/confirmuser/{confirmationId.ToString()}",
				FormatNowDate()));
        }

        private String FormatNowDate()
        {
            return DateTime.Now.AddMinutes(UserStore.expirationMinutes).ToString("dd.MM.yyyy HH:mm");
        }

        private void SendMessage(String email, String subject, String body)
		{
			SmtpClient smtp = new SmtpClient(host, port);
			smtp.EnableSsl = true;
			smtp.Credentials = new NetworkCredential(userName, password);

			String productName = ((AssemblyProductAttribute)Assembly.GetExecutingAssembly()
				.GetCustomAttribute(typeof(AssemblyProductAttribute))).Product;

			MailMessage msg = new MailMessage(userName, email, 
                productName + " " + subject, body);
			msg.IsBodyHtml = true;
			smtp.Send(msg);
		}

        public void SendPasswordResetConfirmation(Uri requestUrl, UserInfo userInfo, 
            Guid confirmationId)
        {
            var msgTemplate = Resources.UserInfo_ResetPassword_Message;

            SendMessage(userInfo.email, "Reset Password", 
                String.Format(msgTemplate, userInfo.firstName, userInfo.lastName,
				$"{requestUrl.OriginalString}#/resetpassword/{confirmationId.ToString()}",
				FormatNowDate()));
        }
		
        public void SendEmailChangeConfirmation(Uri requestUrl, UserInfo userInfo, 
            Guid confirmationId)
        {
            var msgTemplate = Resources.UserInfo_NewEmail_Message;

            SendMessage(userInfo.email, "Change Email Address", 
                String.Format(msgTemplate, userInfo.firstName, userInfo.lastName,
				$"{requestUrl.OriginalString}#/confirmemail/{confirmationId.ToString()}",
				FormatNowDate()));
        }

		public void SendUpdateStatusNotification(Uri requestUrl, UserInfo userInfo, String reason)
		{
            var msgTemplate = Resources.UserInfo_AccountChanges_Message;

			SendMessage(userInfo.email, "Status Updated", 
                String.Format(msgTemplate, userInfo.firstName, userInfo.lastName,
				reason, $"{requestUrl.OriginalString}#/aboutus"));
		}
	}
}
