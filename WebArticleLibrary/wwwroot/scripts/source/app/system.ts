import * as angular from 'angular';

class AppSystem {
    static readonly APP_MODULE_NAME: string = 'ArticleLibraryApp';

    static readonly DEPENDENCY_WINDOW: string = '$window';

    static readonly DEPENDENCY_RESOURCE: string = '$resource';

    static readonly DEPENDENCY_STATE: string = '$state';

    static readonly DEPENDENCY_COOKIES: string = '$cookies';

    static get appModule(): angular.IModule {
        return angular.module(this.APP_MODULE_NAME);
    }
}

class Constants {
    static readonly NO_PHOTO_FILE_URL: string = 'images/noPhoto.png';

    static readonly MODAL_CLICK_MSG: string = 'backdrop';
}

export { AppSystem, Constants };
