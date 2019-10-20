import { ApiRequest } from './apiRequest';
import { IPromise } from 'angular';

class ContactRequest extends ApiRequest {
    constructor($resource: ng.resource.IResourceService) {
        super($resource, 'ContactInfo');
    }

    getBasicInfo(): IPromise<IContactResponse> {
        return this.getResource();
    }

    getAboutUsInfo(): IPromise<{ aboutUs: string }> {
        return this.getResource(undefined, 'AboutUs');
    }
}

interface IContactResponse {
    fax: string;
    
    phone: string;
    
    mail: string;

    youtubeLink: string;
    
    facebookLink: string;
}

export { ContactRequest, IContactResponse };
