import { AboutUsCtrl } from './aboutUsCtrl';
import { AppSystem } from '../app/system';
import { FooterCtrl } from './footerCtrl';

const appModule = AppSystem.appModule;

[AboutUsCtrl, FooterCtrl].forEach(ctrl => appModule.controller(ctrl.name, ctrl));
