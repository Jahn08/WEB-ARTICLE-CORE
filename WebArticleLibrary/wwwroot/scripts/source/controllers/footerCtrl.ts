import { inject } from "../app/inject";
import { ContactRequest, IContactResponse } from "../services/api/contactRequest";
import { ErrorService } from "../services/errorService";
import { BaseCtrl } from "./baseCtrl";


@inject(ContactRequest, ErrorService)
class FooterCtrl extends BaseCtrl {
    private info: IContactResponse;

    constructor(contactReq: ContactRequest, errorSrv: ErrorService) {
        super(errorSrv);

        this.processRequest(contactReq.getBasicInfo(), data => {
            this.info = data;
        });
    }
}

export { FooterCtrl };
