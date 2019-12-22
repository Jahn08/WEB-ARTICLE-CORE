import { IUserInfo } from "../../services/api/userRequest";
import { BaseCtrl } from "../baseCtrl";
import { inject } from "../../app/inject";
import { ErrorService } from "../../services/errorService";
import { AuthRequest } from "../../services/api/authRequest";
import { AppSystem } from "../../app/system";
import { StateService } from "@uirouter/core";
import { ui } from "angular";

@inject(ErrorService, AuthRequest, AppSystem.DEPENDENCY_STATE, 
    AppSystem.DEPENDENCY_MODAL_INSTANCE, AppSystem.DEPENDENCY_DIALOG_MODEL)
class RegistrationModalCtrl extends BaseCtrl {
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

export { RegistrationModalCtrl };
