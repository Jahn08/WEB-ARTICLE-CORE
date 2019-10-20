import { limitToFormat } from './limitToFormat';
import { AppSystem } from '../app/system';

AppSystem.appModule.filter('limitToFormat', limitToFormat);
