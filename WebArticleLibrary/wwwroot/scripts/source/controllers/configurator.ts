import { AboutUsCtrl } from './aboutUsCtrl';
import { AppSystem } from '../app/system';
import { FooterCtrl } from './footerCtrl';
import { HomeCtrl } from './homeCtrl';

const appModule = AppSystem.appModule;

[AboutUsCtrl, FooterCtrl, HomeCtrl].forEach(ctrl => appModule.controller(ctrl.name, ctrl));
