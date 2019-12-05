import { AboutUsCtrl } from './aboutUsCtrl';
import { AppSystem } from '../app/system';
import { FooterCtrl } from './footerCtrl';
import { HomeCtrl } from './homeCtrl';
import { HeaderCtrl } 
    from './headerCtrl';
import { ArticleSearchCtrl } from './articleSearchCtrl';
import { ArticleHistoryModalCtrl, MarkPasswordForResetModalCtrl, NotificationModalCtrl, RegisterModalCtrl, CommentModalCtrl } from './modals';
import { ArticleInfoCtrl } from './articleInfoCtrl';
import { UserInfoCtrl } from './userInfoCtrl';
import { UserConfirmationCtrl } from './userConfirmationCtrl';
import { EmailConfirmationCtrl } from './emailConfirmationCtrl';
import { ResetPasswordCtrl } from './resetPasswordCtrl';

const appModule = AppSystem.appModule;

[AboutUsCtrl, FooterCtrl, HomeCtrl, HeaderCtrl, MarkPasswordForResetModalCtrl, 
    NotificationModalCtrl, RegisterModalCtrl, ArticleSearchCtrl, ArticleInfoCtrl,
    ArticleHistoryModalCtrl, UserInfoCtrl, CommentModalCtrl, UserConfirmationCtrl,
    EmailConfirmationCtrl, ResetPasswordCtrl].forEach(ctrl => appModule.controller(ctrl.name, ctrl));
