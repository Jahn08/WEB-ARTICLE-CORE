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

    logIn(name: string, password: string): IPromise<IUserInfo> {
        return this.saveResource({ name, password }, 'LogIn');
    }

    register(userData: IUserInfo): IPromise<void> {
        return this.saveResource(userData, 'Register');
    }

    confirm(confirmationId): IPromise<void> {
        return this.getResource({ confirmationId: confirmationId }, 'Confirm');
    }
}

export { AuthRequest };
