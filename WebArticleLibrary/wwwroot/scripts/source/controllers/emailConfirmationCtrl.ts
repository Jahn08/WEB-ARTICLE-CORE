import { StateService } from "@uirouter/angularjs";
import { ErrorService } from "../services/errorService";
import { BaseCtrl } from "./baseCtrl";
import { inject } from "../app/inject";
import { AppSystem } from "../app/system";
import { UserRequest } from "../services/api/userRequest";

@inject(ErrorService, UserRequest, AppSystem.DEPENDENCY_STATE)
class EmailConfirmationCtrl extends BaseCtrl {
    constructor (errorSrv: ErrorService, userReq: UserRequest, $state: StateService) {
        super(errorSrv);

        this.processRequest(userReq.confirmEmail($state.params.id), () => {
            alert('Congratulations! Your email address has been confirmed');

            $state.go('app');
        }, data => errorSrv.processError('Unfortunately, your email address was not confirmed', data));
    }
}

export { EmailConfirmationCtrl };
