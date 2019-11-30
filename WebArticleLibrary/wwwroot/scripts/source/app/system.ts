import * as angular from 'angular';

class AppSystem {
    static readonly APP_MODULE_NAME: string = 'ArticleLibraryApp';

    static readonly DEPENDENCY_WINDOW: string = '$window';

    static readonly DEPENDENCY_RESOURCE: string = '$resource';

    static readonly DEPENDENCY_STATE: string = '$state';

    static readonly DEPENDENCY_COOKIES: string = '$cookies';
    
    static readonly DEPENDENCY_TIMEOUT: string = '$timeout';

    static readonly DEPENDENCY_Q_SERVICE: string = '$q';

    static readonly DEPENDENCY_MODAL_SERVICE: string = '$uibModal';

    static readonly DEPENDENCY_MODAL_INSTANCE: string = '$uibModalInstance';

    static readonly DEPENDENCY_ROOT_SCOPE_SERVICE: string = '$rootScope';

    static readonly DEPENDENCY_SECTION_PARAM: string = 'section';

    static get appModule(): angular.IModule {
        return angular.module(this.APP_MODULE_NAME);
    }
}

class Constants {
    static readonly NO_PHOTO_FILE_URL: string = 'images/noPhoto.png';

    static readonly CONTROLLER_PSEUDONIM: string = 'ctrl';
}

export { AppSystem, Constants };
