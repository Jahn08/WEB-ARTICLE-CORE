import { AboutUsCtrl } from './aboutUsCtrl';
import { AppSystem } from '../app/system';
import { FooterCtrl } from './footerCtrl';
import { HomeCtrl } from './homeCtrl';
import { HeaderCtrl, MarkPasswordForResetModalCtrl, NotificationModalCtrl, RegisterModalCtrl } 
    from './headerCtrl';
import { ArticleSearchCtrl } from './articleSearchCtrl';

const appModule = AppSystem.appModule;

[AboutUsCtrl, FooterCtrl, HomeCtrl, HeaderCtrl, MarkPasswordForResetModalCtrl, 
    NotificationModalCtrl, RegisterModalCtrl, ArticleSearchCtrl]
        .forEach(ctrl => appModule.controller(ctrl.name, ctrl));
