import { IPromise } from "angular";

abstract class ApiRequest {
    constructor(protected $resource: ng.resource.IResourceService, 
        private controllerName: string) {
    }

    protected get baseUrl() {
        return this.combinePaths('api', this.controllerName);
    }

    private combinePaths(pathA: string, pathB: string) {
        return pathA + (pathB ? '/' + pathB: '');
    }

    protected getResource<IN, OUT>(params?: IN, path: string = ''): IPromise<OUT> {
        return this.$resource(this.getCombinedPath(path)).get(params).$promise;
    }

    private getCombinedPath(path) {
        return this.combinePaths(this.baseUrl, path);
    }

    protected saveResource<IN, OUT>(params: IN, path: string = ''): IPromise<OUT> {
        return this.$resource(this.getCombinedPath(path)).save(params).$promise;
    }

    protected removeResource<IN, OUT>(params: IN, path: string = ''): IPromise<OUT> {
        return this.$resource(this.getCombinedPath(path)).remove(params).$promise;
    }
}

interface ISearchQuery {
    page: string;
    
    colIndex: ColumnIndex;
    
    asc: boolean;
}

interface ISearchResult<T> {
    data: T[];
    
    pageLength: number;

    dataCount: number;
}

interface INameSearchResult<T> extends ISearchResult<T> {
    articleNames: Record<number, string>;
    
    userNames: Record<number, string>;
}

enum ColumnIndex {
    NAME,

    AUTHOR,

    TAGS,

    ASSIGNED_TO,

    STATUS,

    TEXT,

    ID,

    DATE,

    ARTICLE
}

interface IArticleEntity {
    id: number;

    insertDate: Date;
    
    articleId: number;

    authorId: number;
}

export { ApiRequest, ISearchQuery, ISearchResult, INameSearchResult, ColumnIndex, IArticleEntity };
