import { ApiRequest, IArticleEntity } from './apiRequest';
import { IPromise } from 'angular';

class HistoryRequest extends ApiRequest {
    constructor($resource: ng.resource.IResourceService) {
        super($resource, 'History');
    }

    getHistory(articleId: number): IPromise<IHistory[]> {
        return this.getArrayResource({ articleId: articleId });
    }
}

interface IHistory {
    date: Date;
    
    author: string;
    
    history: IHistoryRecord[];
}

interface IHistoryRecord extends IArticleEntity {
    object: string;

    oldValue: string;

    newValue: string;

    objectId?: number;

    objectType: HistoryObjectType;
}

enum HistoryObjectType {
    ARTICLE,

    AMENDMENT,
    
    COMMENT
}

export { HistoryRequest, IHistory, IHistoryRecord, HistoryObjectType };
