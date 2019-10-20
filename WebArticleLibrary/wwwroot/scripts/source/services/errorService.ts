import { IHttpResponse } from "angular";
import { AuthService } from "./authService";
import { inject } from "../app/inject";

@inject(AuthService)
class ErrorService {
    constructor(private authService: AuthService) { }

    formatError(msg: string, data: string): string { 
        return this.formatMessage(msg) + data;
    }

    private formatMessage(msg: string): string {
        return msg ? msg + ': ' : '';
    }

    processError(msg: string, data: IHttpResponse<any>): string {
        if (data.status === 401) {
            this.authService.logOut();
            this.authService.reloadState();

            return;
        }

        const outcome = this.formatMessage(msg);

        let status = `status: '${data.statusText ? data.statusText: data.status}'`;
        
        if (data.status !== 500)
            status += `, reason: '${data.data ? data.data : data}'`;

        return outcome + status;
    }
}

export { ErrorService };
