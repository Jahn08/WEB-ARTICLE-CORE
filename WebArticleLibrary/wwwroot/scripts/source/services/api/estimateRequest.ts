import { ApiRequest, IArticleEntity, ISearchQuery, INameSearchResult } from './apiRequest';
import { IPromise } from 'angular';

class EstimateRequest extends ApiRequest {
    constructor($resource: ng.resource.IResourceService) {
        super($resource, 'Estimate');
    }

    assessArticle(articleId: number, estimate: EstimateType): 
        IPromise<{ finalEstimate: number }> {
        return this.saveResource({ id: articleId, estimate });
    }

    get(query: IEstimateSearch): IPromise<INameSearchResult<IEstimate>> {
        return this.getResource(query);
    }

    getTypeCaption(estimate: EstimateType) {
        switch (estimate) {
            case EstimateType.NEGATIVE:
                return 'negative';
            case EstimateType.POSITIVE:
                return 'positive';
            default:
                return 'none';
        }
    }
}

interface IEstimate extends IArticleEntity {
    estimate: EstimateType;
}

interface IEstimateSearch extends ISearchQuery {
    articleName?: string;

    userId?: number;
    
    dateStart?: Date;
    
    dateEnd?: string;
    
    estimate?: EstimateType;
}

enum EstimateType {
    NONE,

    POSITIVE,

    NEGATIVE
}

export { EstimateRequest, IEstimate, EstimateType, IEstimateSearch };
