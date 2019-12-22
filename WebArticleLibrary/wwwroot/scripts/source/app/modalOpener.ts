import { AppSystem, Constants } from "./system";
import { ui, IPromise } from "angular";
import { IUserInfo } from "../services/api/userRequest";
import { INotification } from "../services/api/notificationRequest";
import { CommentModalCtrl, ICommentDialogModel } from "../controllers/modals/commentModalCtrl";
import { IArticleHistoryDialogModel, ArticleHistoryModalCtrl } from "../controllers/modals/articleHistoryModalCtrl";
import { IAmendmentDialogModel, AmendmentModalCtrl } from "../controllers/modals/amendmentModalCtrl";
import { ComplaintModalCtrl, IComplaintDialogModel } from "../controllers/modals/complaintModalCtrl";
import { NotificationModalCtrl } from "../controllers/modals/notificationModalCtrl";
import { RegistrationModalCtrl } from "../controllers/modals/registrationModalCtrl";
import { ResponseModalCtrl } from "../controllers/modals/responseModalCtrl";

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

    openCommentModal(model: ICommentDialogModel): IPromise<void> {
        return this.open(model, CommentModalCtrl, 'Comment');
    }

    openNotificationModal(model: INotification[]): IPromise<boolean> {
        return this.open(model, NotificationModalCtrl, 'Notification');
    }

    openRegistrationModal(model: IUserInfo): IPromise<void> {
        return this.open(model, RegistrationModalCtrl, 'Registration');
    }

    openPasswordMarkForResetModal(): IPromise<void> {
        return this.open(undefined, RegistrationModalCtrl, 'PasswordMarkForReset');
    }

    openResponseModal(): IPromise<string> {
        return this.open(undefined, ResponseModalCtrl, 'Response');
    }
}

export { ModalOpener };
