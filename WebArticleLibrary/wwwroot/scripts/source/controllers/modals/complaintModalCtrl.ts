import { inject } from "../../app/inject";
import { AppSystem } from "../../app/system";
import { ui } from "angular";

interface IComplaintDialogModel {
    isForComment: boolean;
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

export { IComplaintDialogModel, ComplaintModalCtrl };
