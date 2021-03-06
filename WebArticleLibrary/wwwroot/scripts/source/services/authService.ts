import { UserRequest, IUserInfo } from './api/userRequest'; 
import { inject } from '../app/inject';
import { AppSystem } from '../app/system';
import { IPromise } from 'angular';
import { StateService } from '@uirouter/angularjs';

@inject(AppSystem.DEPENDENCY_WINDOW, UserRequest, AppSystem.DEPENDENCY_COOKIES, 
    AppSystem.DEPENDENCY_STATE, AppSystem.DEPENDENCY_Q_SERVICE)
class AuthService {
    private static readonly AUTH_USER_ITEM = 'CurrentUser';

    private static readonly AUTH_COOKIE = 'Auth_Id';

    constructor(private $window: ng.IWindowService, 
        private userReq: UserRequest, 
        private $cookies: ng.cookies.ICookiesService, 
        private $state: StateService,
        private $q: angular.IQService) { }

    getCurrentUser(getPhoto: boolean = false): IPromise<Number | IUserInfo> {
        const task = this.$q.defer<Number | IUserInfo>();
        this.getCurrentUserInternally(getPhoto).then(result => task.resolve(result))
            .catch(err => task.reject(err));

        return task.promise;
    }

    private getCurrentUserInternally(getPhoto: boolean): Promise<Number | IUserInfo> {
        return new Promise((resolve, reject) => {
            if (!this.$cookies.get(AuthService.AUTH_COOKIE)) {
                this.logOut();
                resolve(0);
            }
            else {
                const user = this.$window.localStorage.getItem(AuthService.AUTH_USER_ITEM);
    
                if (user)
                    resolve(JSON.parse(user));
                else {
                    this.userReq.getUserInfo(null, getPhoto).then(data => {
                        this.logIn(data);
                        resolve(data);
                    }).catch(reason => {
                        if (reason.status === 401) {
                            this.logOut();
                            resolve(0);
                        }
                        else
                            reject(reason);
                    });
                }
            }
        });
    }

    logOut(): void {
        this.$cookies.remove(AuthService.AUTH_COOKIE, { path: '/'});
        this.$window.localStorage.removeItem(AuthService.AUTH_USER_ITEM);
    }

    logIn(data: IUserInfo, force: boolean = false): void {
        if (!this.$window.localStorage.getItem(AuthService.AUTH_USER_ITEM) || force)
            this.$window.localStorage.setItem(AuthService.AUTH_USER_ITEM, 
                JSON.stringify(data));
    }

    reloadState(): void {
        this.$state.reload();
    }
}

export { AuthService };
