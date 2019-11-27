import { inject } from "../app/inject";
import { ErrorService } from "../services/errorService";
import { BaseCtrl } from "./baseCtrl";
import { ui } from "angular";
import { StateService } from "@uirouter/angularjs";
import { AuthRequest } from "../services/api/authRequest";
import { ArticleRequest } from "../services/api/articleRequest";
import { NotificationRequest, INotification } from "../services/api/notificationRequest";
import { AppSystem } from "../app/system";
import { AuthService } from "../services/authService";
import { IUserInfo, UserRequest } from "../services/api/userRequest";
import * as signalR from '@microsoft/signalr';
import { ModalCtrl } from "./modals";

@inject(ArticleRequest, ErrorService, AppSystem.DEPENDENCY_MODAL_SERVICE, AppSystem.DEPENDENCY_STATE,
    AuthRequest, AuthService, NotificationRequest, AppSystem.DEPENDENCY_ROOT_SCOPE_SERVICE)
class HeaderCtrl extends BaseCtrl {
    public section: string;

    public categories: string[];

    public userName: string;

    public userPassword: string;

    private userId: number;

    private notifications: INotification[];

    private hubServer: signalR.HubConnection;

    constructor(articleReq: ArticleRequest, errorSrv: ErrorService,
        private $modal: ui.bootstrap.IModalService,
        private $state: StateService,
        private authReq: AuthRequest, 
        private authSrv: AuthService,
        private notificationReq: NotificationRequest,
        private $rootScope: angular.IRootScopeService) {
        super(errorSrv);

        this.section = $state.$current.resolve['section']();

        this.processRequest(authSrv.getCurrentUser(), async outcome => {
            this.categories = await articleReq.getDefaultCategories();

            await this.setUserInfo(outcome as IUserInfo);
        });
    }

    private async setUserInfo(ui: IUserInfo) {
        if (!ui)
            return;

        this.userName = ui.name;
        this.userId = ui.id;

        this.notifications = await this.notificationReq.get(ui.id);

        const connection = new signalR.HubConnectionBuilder()
            .withUrl("/notificationHub")
            .configureLogging(signalR.LogLevel.Information)
            .build();

        connection.on('notify', newEvents => {
            if (this.notifications)
            {
                this.notifications = this.notifications.concat(newEvents);

                this.notifications.sort((a, b) => {
                    if (a.date === b.date)
                        return 0;
                    return a.date > b.date ? 1: -1;
                });
            }
            else
                this.notifications = newEvents;
        });

        connection.on('clear', removedEvents => {
            const active = this.notifications.filter(val =>
                !removedEvents.find(v => v.id == val.id));
            
            this.$rootScope.$apply(() => this.notifications = active);
        });

        connection.start().then(() => this.hubServer.invoke('SignUp', this.userId));

        this.hubServer = connection;
    }

    public GetNotificationNumber(): number {
        return this.notifications == null ? null: this.notifications.length;
    }

    public openNotificationModal() {
        if (!this.notifications)
            return;

        this.processRequest(this.$modal.open(ModalCtrl.setUp({
            templateUrl: "views/modalDialogs/NotificationModal.html",
            controller: NotificationModalCtrl,
            resolve: {
                notifications: this.notifications
            }
        })).result, async shouldClear => {
            if (shouldClear) {
                const ids = this.notifications.map(val => val.id);

                await this.notificationReq.clear(ids);

                this.notifications = null;
            }
        });
    }
            
    shouldShowUser(): boolean {
        return this.userId != null;
    }

    private reloadPage() {
        this.$state.transitionTo(this.$state.current, null, {
            reload: true, inherit: false, notify: true
        });
    }

    logOut() {
        this.processRequest(this.authReq.logOut(), () => {
            this.authSrv.logOut();
            this.userId = null;

            if (this.hubServer && this.userId)
                this.hubServer.stop().then(() => this.hubServer = null);
                
            this.reloadPage();
        });
    }

    logIn() {
        if (!this.userName || !this.userPassword) {
            this.msg = 'A login or password is not provided';
            return;
        }

        this.processRequest(this.authReq.logIn(this.userName, this.userPassword), userData => {
            this.authSrv.logIn(userData);

            this.reloadPage();           
        }, err => {
            this.authSrv.logOut();
            this.userId = null;

            return err.status === 401 ? 'The usage of a wrong user name or password': null;
        });
    }

    tryLogIn(event) {
        if (event && event.keyCode === 13)
            this.logIn();
    }

	openRegistrationModal() {
        this.processRequest(this.$modal.open(ModalCtrl.setUp({
            templateUrl: "views/modalDialogs/RegisterModal.html",
            controller: "RegisterModalCtrl",
            resolve: {
                userData: {
                    name: this.userName,
                    password: this.userPassword
                }
            }
        })).result);
    }
			
    resetPasswordModal() {
        this.processRequest(this.$modal.open(ModalCtrl.setUp({
            templateUrl: "views/modalDialogs/MarkPasswordForResetModal.html",
            controller: MarkPasswordForResetModalCtrl
        })).result);
    }
}

@inject(ErrorService, UserRequest, 
    AppSystem.DEPENDENCY_STATE, AppSystem.DEPENDENCY_MODAL_INSTANCE)
class MarkPasswordForResetModalCtrl extends BaseCtrl {
    public email: string;

    constructor(errorSrv: ErrorService,
        private userReq: UserRequest,
        private $state: StateService,
        private $modalInstance: ui.bootstrap.IModalInstanceService) {
        super(errorSrv);
    }

    resetPassword() {
        this.processRequest(this.userReq.resetPassword(this.email), () => {
            this.closeModal();
            this.$state.go('app.aftermarkingpasswordforresetting');
        });
    }

    closeModal() {
        this.$modalInstance.close();
    }
}

@inject(AppSystem.DEPENDENCY_STATE, AppSystem.DEPENDENCY_MODAL_INSTANCE, 'notifications')
class NotificationModalCtrl {
    constructor(private $state: StateService,
        private $modalInstance: ui.bootstrap.IModalInstanceService,
        public notifications: INotification[]) { }

    toHistory(articleId: number, historyId: number) {
        const url = this.$state.href("app.articleview", { historyId: historyId, id: articleId });
        window.open(url);
    }

    closeModal(shouldClear: boolean) {
        this.$modalInstance.close(shouldClear);
    }
}

@inject(ErrorService, AuthRequest, AppSystem.DEPENDENCY_STATE, 
    AppSystem.DEPENDENCY_MODAL_INSTANCE, 'userData')
class RegisterModalCtrl extends BaseCtrl {
    public user: IUserInfo;

    constructor(errorSrv: ErrorService,
        private authReq: AuthRequest,
        private $state: StateService,
        private $modalInstance: ui.bootstrap.IModalInstanceService,
        userData: IUserInfo) { 
            super(errorSrv);

            this.user = userData;
        }

	register() {
        this.processRequest(this.authReq.register(this.user), 
        () => {
            this.closeModal();
            this.$state.go('app.afterregistration');
        });
    }

    closeModal() {
        this.$modalInstance.close();
    }
}

export { HeaderCtrl, MarkPasswordForResetModalCtrl, NotificationModalCtrl, RegisterModalCtrl };
