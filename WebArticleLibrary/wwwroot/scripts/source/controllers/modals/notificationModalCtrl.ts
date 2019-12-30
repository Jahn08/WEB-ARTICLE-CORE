import { inject } from "../../app/inject";
import { StateService } from "@uirouter/core";
import { INotification } from "../../services/api/notificationRequest";
import { ui } from "angular";
import { AppSystem } from "../../app/system";

interface INotificationDialogModel {
    notifications: INotification[];
}

@inject(AppSystem.DEPENDENCY_DIALOG_MODEL, AppSystem.DEPENDENCY_STATE, 
    AppSystem.DEPENDENCY_MODAL_INSTANCE)
class NotificationModalCtrl {
    notifications: INotification[];

    constructor(model: INotificationDialogModel,
        private $state: StateService,
        private $modalInstance: ui.bootstrap.IModalInstanceService) {
            this.notifications = model.notifications;
        }

    toHistory(articleId: number, historyId: number) {
        const url = this.$state.href("app.articleview", { historyId: historyId, id: articleId });
        window.open(url);
    }

    closeModal(shouldClear: boolean) {
        this.$modalInstance.close(shouldClear);
    }
}

export { NotificationModalCtrl, INotificationDialogModel };
