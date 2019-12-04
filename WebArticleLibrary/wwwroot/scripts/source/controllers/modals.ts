import { inject } from "../app/inject";
import { AppSystem } from "../app/system";
import { ui } from "angular";
import { IHistory, IHistoryRecord, HistoryObjectType } from "../services/api/historyRequest";
import { StateService } from "@uirouter/angularjs";
import { ErrorService } from "../services/errorService";
import { AuthRequest } from "../services/api/authRequest";
import { BaseCtrl } from "./baseCtrl";
import { IUserInfo, UserRequest } from "../services/api/userRequest";
import { INotification } from "../services/api/notificationRequest";

interface IArticleHistoryDialogModel {
    histories: IHistory[];

    articleName: string;
    
    articleIsApproved: boolean;

    historyId?: number;
}

class HistoryRelationalRecord implements IHistoryRecord {
    object: string;
    oldValue: string;
    newValue: string;
    objectId?: number;
    objectType: HistoryObjectType;
    id: number;
    insertDate: Date;
    articleId: number;
    authorId: number;

    readonly toComment: boolean;

    readonly toArticle: boolean;

    constructor(public readonly record: IHistoryRecord, articleIsApproved: boolean) {
        if (record.object) {
            if (record.object.endsWith('VERSION'))
                this.toArticle = true;
            else if (articleIsApproved && record.object.startsWith('COMMENT'))
                this.toComment = true;
        }
    }
}

@inject(AppSystem.DEPENDENCY_STATE, AppSystem.DEPENDENCY_MODAL_INSTANCE, AppSystem.DEPENDENCY_DIALOG_MODEL)
class ArticleHistoryModalCtrl {
    filteredHistories: IHistory[];

    readonly selectedId: number;

    readonly articleName: string;

    readonly histories: IHistory[];

    private model: IArticleHistoryDialogModel;

    constructor(private $state: StateService,
        private $modalInstance: ui.bootstrap.IModalInstanceService,
        model: IArticleHistoryDialogModel) {
            this.articleName = model.articleName;

            this.filteredHistories = [];

            const articleApproved = this.model.articleIsApproved;
            this.histories = this.model.histories.map(h => {
                h.history = h.history.map(hr => new HistoryRelationalRecord(hr, articleApproved));
                return h;
            });

            if (model.historyId)
                this.selectedId = model.historyId;
        }

    closeModal() { this.$modalInstance.close(); }

    goToObject(obj: string, id: number) {
        const objType = obj.split(/[. ]/g)[0];

        this.filteredHistories = this.model.histories.filter(h => {
            const firstRecord = h.history[0];
            return firstRecord.object.startsWith(objType) && firstRecord.objectId === id;
        });
    }

    leaveObject() {
        this.filteredHistories = [];
    }

    goToArticle(id: number, commentId: number) {
        const url = this.$state.href("app.articleview", { id: id, commentId: commentId });
        window.open(url);
    }

    getValueDescription(objName: string): string {
        return objName.endsWith('VERSION') ? (objName.startsWith('CHILD') ?
            'ANOTHER VERSION WAS CREATED' : 'WAS CREATED AS A NEW VERSION') : '';
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

@inject(AppSystem.DEPENDENCY_STATE, AppSystem.DEPENDENCY_MODAL_INSTANCE, AppSystem.DEPENDENCY_DIALOG_MODEL)
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
    AppSystem.DEPENDENCY_MODAL_INSTANCE, AppSystem.DEPENDENCY_DIALOG_MODEL)
class RegisterModalCtrl extends BaseCtrl {
    public user: IUserInfo;

    constructor(errorSrv: ErrorService,
        private authReq: AuthRequest,
        private $state: StateService,
        private $modalInstance: ui.bootstrap.IModalInstanceService,
        userInfo: IUserInfo) { 
            super(errorSrv);

            this.user = userInfo;
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

export { IArticleHistoryDialogModel, ArticleHistoryModalCtrl, RegisterModalCtrl, NotificationModalCtrl, MarkPasswordForResetModalCtrl };
