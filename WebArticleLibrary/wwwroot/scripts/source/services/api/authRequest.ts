import { ApiRequest } from './apiRequest';
import { IUserInfo } from './userRequest';
import { IPromise } from 'angular';

class AuthRequest extends ApiRequest {
    constructor($resource: ng.resource.IResourceService) {
        super($resource, 'Authentication');
    }

    logOut(): IPromise<void> {
        return this.getResource(undefined, 'LogOut');
    }

    logIn(userData: IUserInfo): IPromise<IUserInfo> {
        return this.saveResource(userData, 'LogIn');
    }

    register(userData: IUserInfo): IPromise<void> {
        return this.saveResource(userData, 'Register');
    }

    confirm(confirmationId): IPromise<void> {
        return this.getResource(confirmationId, 'Confirm');
    }
}

export { AuthRequest };
