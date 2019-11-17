import { ContactRequest } from "../services/api/contactRequest";
import { ErrorService } from "../services/errorService";
import { inject } from "../app/inject";
import { BaseCtrl } from "./baseCtrl";

@inject(ContactRequest, ErrorService)
class AboutUsCtrl extends BaseCtrl {
    public info: string;

    constructor(contactReq: ContactRequest, errorSrv: ErrorService) { 
        super(errorSrv);

        this.processRequest(contactReq.getAboutUsInfo(), data => {
            this.info = data.aboutUs;
        });
    }
}

export { AboutUsCtrl };
