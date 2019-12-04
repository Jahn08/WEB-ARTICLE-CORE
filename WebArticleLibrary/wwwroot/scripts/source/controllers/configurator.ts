import { AboutUsCtrl } from './aboutUsCtrl';
import { AppSystem } from '../app/system';
import { FooterCtrl } from './footerCtrl';
import { HomeCtrl } from './homeCtrl';
import { HeaderCtrl, MarkPasswordForResetModalCtrl, NotificationModalCtrl, RegisterModalCtrl } 
    from './headerCtrl';
import { ArticleSearchCtrl } from './articleSearchCtrl';
import { ArticleHistoryModalCtrl } from './modals';
import { ArticleInfoCtrl } from './articleInfoCtrl';

const appModule = AppSystem.appModule;

[AboutUsCtrl, FooterCtrl, HomeCtrl, HeaderCtrl, MarkPasswordForResetModalCtrl, 
    NotificationModalCtrl, RegisterModalCtrl, ArticleSearchCtrl, ArticleInfoCtrl,
    ArticleHistoryModalCtrl].forEach(ctrl => appModule.controller(ctrl.name, ctrl));
