import { ErrorService } from "../services/errorService";
import { IPromise } from "angular";
import { Constants } from "../app/system";

class BaseCtrl {
    public sending: boolean;

    public isError: boolean;

    public msg: string;

    private static systemErrors = ['backdrop click', 'escape key press'];

    constructor(private errorSrv: ErrorService) {
        this.setState(false);
    }

    private setState(isLoading: boolean) {
        this.isError = false;
        
        if (isLoading === this.sending)
            return;

        if (isLoading) {
            this.sending = true;
            this.msg = "Please, wait...";
        }
        else {
            this.sending = false;
            this.msg = null;
        }
    }

    protected processRequest<T>(sendingPromise: IPromise<T>, successFn?: (response: T) => void,
        processErrorFn?: (data: angular.IHttpResponse<any>, errorSrv: ErrorService) => string) {
        this.setState(true);

        sendingPromise.then(async data => {
            if (successFn)
                await successFn(data);

            this.setState(false);
        }).catch(err => this.onError(err, processErrorFn));
    }

    private onError(error: angular.IHttpResponse<any>|string, 
        processErrorFn: (error: angular.IHttpResponse<any>, errorSrv: ErrorService) => string) {
        const errResp = error as angular.IHttpResponse<any>;

        if (BaseCtrl.systemErrors.includes(error as string) || !errResp) {
            this.setState(false);
            return;
        }

        this.sending = false;
        this.isError = true;

        let msg;

        if (processErrorFn)
            msg = processErrorFn(errResp, this.errorSrv);

        this.msg = msg || this.errorSrv.processError(null, errResp);
    }
}

export { BaseCtrl };
