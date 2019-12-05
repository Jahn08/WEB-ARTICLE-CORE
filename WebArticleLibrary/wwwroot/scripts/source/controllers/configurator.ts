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

const appModule = AppSystem.appModule;

[AboutUsCtrl, FooterCtrl, HomeCtrl, HeaderCtrl, MarkPasswordForResetModalCtrl, 
    NotificationModalCtrl, RegisterModalCtrl, ArticleSearchCtrl, ArticleInfoCtrl,
    ArticleHistoryModalCtrl, UserInfoCtrl, CommentModalCtrl]
    .forEach(ctrl => appModule.controller(ctrl.name, ctrl));
