import { ApiRequest, IArticleEntity } from './apiRequest';
import { IPromise } from 'angular';

class AmmendmentRequest extends ApiRequest {
    constructor($resource: ng.resource.IResourceService) {
        super($resource, 'Amendment');
    }

    getAmendments(articleId: number): IPromise<IAmendment[]> {
        return this.getArrayResource({ articleId: articleId });
    }

    update(amendments: IAmendment[]): IPromise<void> {
        return this.saveResource(amendments);
    }

    remove(amendmentIds: number[]): IPromise<void> {
        return this.removeResource(amendmentIds);
    }

    create(amendment: IAmendment): IPromise<IAmendment> {
        return this.saveResource(amendment, 'New');
    }
}

interface IAmendment extends IArticleEntity {
    content: string;

    resolved: boolean;

    archived: boolean;
}

export { AmmendmentRequest, IAmendment };
