import { DirectiveFactory } from './directiveFactory';
import { AppSystem } from '../app/system';

const appModule = AppSystem.appModule;

[DirectiveFactory.loading, DirectiveFactory.breadcrumb, DirectiveFactory.clickDisabled,
    DirectiveFactory.limitedVal, DirectiveFactory.pagination, DirectiveFactory.sortBtn]
    .forEach(func => appModule.directive(func.name, func));
