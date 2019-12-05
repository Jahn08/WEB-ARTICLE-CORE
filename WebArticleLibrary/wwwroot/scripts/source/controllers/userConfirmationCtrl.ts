import { AuthRequest } from "../services/api/authRequest";
import { StateService } from "@uirouter/angularjs";
import { ErrorService } from "../services/errorService";
import { BaseCtrl } from "./baseCtrl";
import { inject } from "../app/inject";
import { AppSystem } from "../app/system";

@inject(ErrorService, AuthRequest, AppSystem.DEPENDENCY_STATE)
class UserConfirmationCtrl extends BaseCtrl {
    constructor (errorSrv: ErrorService, authReq: AuthRequest, $state: StateService) {
        super(errorSrv);

        this.processRequest(authReq.confirm($state.params.id), () => {
            alert('Congratulations! Your account has been confirmed. You can now use it to log in');

            $state.go('app');
        }, data => errorSrv.processError('Unfortunately, your account has not been confirmed', data));
    }
}

export { UserConfirmationCtrl };
