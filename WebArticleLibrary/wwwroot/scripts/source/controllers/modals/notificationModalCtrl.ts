import { inject } from "../../app/inject";
import { StateService } from "@uirouter/core";
import { INotification } from "../../services/api/notificationRequest";
import { ui } from "angular";
import { AppSystem } from "../../app/system";

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

export { NotificationModalCtrl };
