import { AboutUsCtrl } from './aboutUsCtrl';
import { AppSystem } from '../app/system';
import { FooterCtrl } from './footerCtrl';
import { HomeCtrl } from './homeCtrl';
import { HeaderCtrl } 
    from './headerCtrl';
import { ArticleSearchCtrl } from './articleSearchCtrl';
import { ArticleInfoCtrl } from './articleInfoCtrl';
import { UserInfoCtrl } from './userInfoCtrl';
import { UserConfirmationCtrl } from './userConfirmationCtrl';
import { EmailConfirmationCtrl } from './emailConfirmationCtrl';
import { ResetPasswordCtrl } from './resetPasswordCtrl';
import { PropertiesCtrl } from './propertiesCtrl';
import { ArticleEditCtrl } from './articleEditCtrl';
import { ArticleViewCtrl } from './articleViewCtrl';
import { CommentInfoCtrl } from './commentInfoCtrl';
import { ArticleHistoryModalCtrl } from './modals/articleHistoryModalCtrl';
import { CommentModalCtrl } from './modals/commentModalCtrl';
import { AmendmentModalCtrl } from './modals/amendmentModalCtrl';
import { ComplaintModalCtrl } from './modals/complaintModalCtrl';
import { NotificationModalCtrl } from './modals/notificationModalCtrl';
import { RegistrationModalCtrl } from './modals/registrationModalCtrl';
import { PasswordMarkForResetModalCtrl } from './modals/passwordMarkForResetModalCtrl';
import { ResponseModalCtrl } from './modals/responseModalCtrl';

const appModule = AppSystem.appModule;

[AboutUsCtrl, FooterCtrl, HomeCtrl, HeaderCtrl, PasswordMarkForResetModalCtrl, 
    NotificationModalCtrl, RegistrationModalCtrl, ArticleSearchCtrl, ArticleInfoCtrl,
    ArticleHistoryModalCtrl, UserInfoCtrl, CommentModalCtrl, UserConfirmationCtrl,
    EmailConfirmationCtrl, ResetPasswordCtrl, PropertiesCtrl, ArticleEditCtrl,
    AmendmentModalCtrl, ComplaintModalCtrl, ResponseModalCtrl, ArticleViewCtrl, 
    CommentInfoCtrl]
    .forEach(ctrl => appModule.controller(ctrl.name, ctrl));
