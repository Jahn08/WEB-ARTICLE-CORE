import { AppSystem } from "../../app/system";
import { ErrorService } from "../../services/errorService";
import { inject } from "../../app/inject";
import { UserRequest } from "../../services/api/userRequest";
import { BaseCtrl } from "../baseCtrl";
import { StateService } from "@uirouter/core";
import { ui } from "angular";

@inject(ErrorService, UserRequest, 
    AppSystem.DEPENDENCY_STATE, AppSystem.DEPENDENCY_MODAL_INSTANCE)
class PasswordMarkForResetModalCtrl extends BaseCtrl {
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

export { PasswordMarkForResetModalCtrl };
