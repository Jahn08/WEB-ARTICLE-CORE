import { ErrorService } from "../services/errorService";
import { IPromise } from "angular";

class BaseCtrl {
    public sending: boolean;

    public isError: boolean;

    public msg: string;

    constructor(private errorSrv: ErrorService) {
        this.setState(true);
    }

    private setState(isLoading: boolean) {
        if (isLoading) {
            this.sending = true;
            this.msg = "Please, wait...";
        }
        else {
            this.sending = false;
            this.msg = null;
        }

        this.isError = false;
    }

    protected processRequest<T>(sendingPromise: IPromise<T>, successFn: (response: T) => void) {
        sendingPromise.then(data => {
            successFn(data);

            this.setState(false);
        }).catch(this.onError);
    }

    private onError(data: angular.IHttpResponse<any>) {
        if (data) {
            this.sending = false;
            this.isError = true;

            this.msg = this.errorSrv.processError(null, data);
        }
    }
}

export { BaseCtrl };
