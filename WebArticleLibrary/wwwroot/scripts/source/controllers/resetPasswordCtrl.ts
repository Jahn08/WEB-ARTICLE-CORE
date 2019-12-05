import { UserRequest } from "../services/api/userRequest";
import { BaseCtrl } from "./baseCtrl";
import { ErrorService } from "../services/errorService";
import { StateService } from "@uirouter/angularjs";

class ResetPasswordCtrl extends BaseCtrl {
    newPassword: string;

    constructor(errorSrv: ErrorService, 
        private $state: StateService,  
        private userReq: UserRequest) {
        super(errorSrv);
    }

    reset() {
        this.processRequest(this.userReq.replacePassword(this.newPassword, this.$state.params.id), 
            () => {
                alert('Congratulations! Your old password has been replaced');
                this.$state.go('app');
            }, (data, errorSrv) => errorSrv.processError('Unfortunately, your password has not been replaced', data));
    }
}

export { ResetPasswordCtrl };
