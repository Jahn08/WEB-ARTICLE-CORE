import { inject } from "../app/inject";
import { AppSystem, Constants } from "../app/system";
import { ui, IPromise } from "angular";
import { IHistory, IHistoryRecord, HistoryObjectType } from "../services/api/historyRequest";
import { StateService } from "@uirouter/angularjs";
import { ErrorService } from "../services/errorService";
import { AuthRequest } from "../services/api/authRequest";
import { BaseCtrl } from "./baseCtrl";
import { IUserInfo, UserRequest } from "../services/api/userRequest";
import { INotification } from "../services/api/notificationRequest";
import { IComment, CommentStatus } from "../services/api/commentRequest";
import { ConverterService } from "../services/converterService";
import { IAmendment } from "../services/api/amendmentRequest";

interface IArticleHistoryDialogModel {
    histories: IHistory[];

    articleName: string;
    
    isArticleApproved: boolean;

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

    constructor(record: IHistoryRecord, articleIsApproved: boolean) {
        Object.assign(this, record);

        if (this.object) {
            if (this.object.endsWith('VERSION'))
                this.toArticle = true;
            else if (articleIsApproved && this.object.startsWith('COMMENT'))
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

    constructor(private $state: StateService,
        private $modalInstance: ui.bootstrap.IModalInstanceService,
        private model: IArticleHistoryDialogModel) {
            this.articleName = this.model.articleName;

            this.filteredHistories = [];

            const articleApproved = this.model.isArticleApproved;
            this.histories = this.model.histories.map(h => {
                h.history = h.history.map(hr => new HistoryRelationalRecord(hr, articleApproved));
                return h;
            });

            if (this.model.historyId)
                this.selectedId = this.model.historyId;
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

interface ICommentDialogModel {
    parentId?: number;

    comments: IComment[];

    userNames: Record<number, string>;
}

@inject(AppSystem.DEPENDENCY_DIALOG_MODEL, ConverterService, AppSystem.DEPENDENCY_MODAL_INSTANCE, 
    AppSystem.DEPENDENCY_ESCAPING_SERVICE)
class CommentModalCtrl {
    parentId: number;
    
    comments: IComment[];

    private userNames: Record<number, string>;

    constructor(commentData: ICommentDialogModel,
        private converterSrv: ConverterService,
        private $modalInstance: ui.bootstrap.IModalInstanceService,
        private $sce: angular.ISCEService) { 
            this.parentId = commentData.parentId;
            this.comments = this.parentId ? commentData.comments: commentData.comments.filter(c => c.status != CommentStatus.DELETED);

            this.userNames = commentData.userNames;
        }

        isBlocked(status: CommentStatus): boolean { return status === CommentStatus.BLOCKED; }

        getUserName(authorId: number): string {
            return authorId && this.userNames ? this.userNames[authorId] : null;
        }

        getCommentContent(content: string): string {
            return content ? this.$sce.trustAsHtml(this.converterSrv.bytesToStr(content)) : null;
        }

        closeModal() { this.$modalInstance.close(); }
}


@inject(AppSystem.DEPENDENCY_MODAL_INSTANCE)
class ResponseModalCtrl {
    content: string;

    constructor(private $modalInstance: ui.bootstrap.IModalInstanceService) { }

    closeModal() {
        if (confirm('Without a comment you cannot change the state. Continue?'))
            this.$modalInstance.close();
    }

    save() { this.$modalInstance.close(this.content); }
}

interface IComplaintDialogModel {
    isForComment: boolean;
}

class ModalOpener {
    constructor(private $modal: ui.bootstrap.IModalService) { }

    openComplaintModal(model: IComplaintDialogModel): IPromise<string> {
        return this.open(model, ComplaintModalCtrl, 'Complaint');
    }

    private open<In, Out>(model: In, controller: Function, templateName: string): IPromise<Out> {
        return this.$modal.open({
            templateUrl: `views/modalDialogs/${templateName}Modal.html`,
            controller: controller,
            controllerAs: Constants.CONTROLLER_PSEUDONIM,
            resolve: { [AppSystem.DEPENDENCY_DIALOG_MODEL]: model }
        }).result;
    }

    openAmendmentModal(model: IAmendmentDialogModel): IPromise<string> {
        return this.open(model, AmendmentModalCtrl, 'Amendment');
    }

    openArticleHistoryModal(model: IArticleHistoryDialogModel): IPromise<void> {
        return this.open(model, ArticleHistoryModalCtrl, 'ArticleHistory');
    }
}

@inject(AppSystem.DEPENDENCY_DIALOG_MODEL, AppSystem.DEPENDENCY_MODAL_INSTANCE)
class ComplaintModalCtrl  {
    content: string;

    readonly typeAddition: string;

    constructor(model: IComplaintDialogModel,
        private $modalInstance: ui.bootstrap.IModalInstanceService) {
            this.typeAddition = model.isForComment ? "a comment": "an article";
        }

    closeModal() { this.$modalInstance.close(); }
    
    save() { this.$modalInstance.close(this.content); }
}

interface IAmendmentDialogModel {
    selectionText?: string;

    isGlobal?: boolean;
    
    isReadonly?: boolean;

    amendment?: IAmendment;
}

@inject(AppSystem.DEPENDENCY_DIALOG_MODEL, AppSystem.DEPENDENCY_MODAL_INSTANCE)
class AmendmentModalCtrl {
    content: string;

    readonly selectionText: string;

    readonly cutSelectionText: string;

    readonly typeAddition: string;

    readonly isGlobal: boolean;

    readonly isReadonly: boolean;

    constructor(model: IAmendmentDialogModel,
        private $modalInstance: ui.bootstrap.IModalInstanceService) {
            if (model.amendment) {
                const strs = model.amendment.content.split(' - ');
                this.content = strs.length > 1 ? strs[1] : model.amendment.content;

                if (!model.selectionText)
                    model.selectionText = strs[0].replace(/\"/g, '');
            }

            const selection = model.selectionText || '';
            this.isGlobal = !selection.length ? true : model.isGlobal;
            
            this.selectionText = selection;
            this.cutSelectionText = selection.length > 100 ? selection.substr(0, 100) + "..." : selection;
            
            this.isReadonly = model.isReadonly;
        }

        closeModal() { this.$modalInstance.close(); }
        
        save() {
            this.content = `"${this.selectionText}" - ${this.content}`;
            this.$modalInstance.close(this.content);
        }
}

export { ArticleHistoryModalCtrl, RegisterModalCtrl, 
    NotificationModalCtrl, MarkPasswordForResetModalCtrl, ICommentDialogModel, CommentModalCtrl, 
    ResponseModalCtrl, ComplaintModalCtrl, AmendmentModalCtrl, ModalOpener };
