import { ApiRequest, ISearchQuery } from './apiRequest';
import { IComment } from './commentRequest';
import { inject } from '../../inject';
import { ConverterService } from '../converterService';
import { IPromise } from 'angular';
import { EstimateType } from './estimateRequest';

@inject('$resource', '$window', ConverterService)
class ArticleRequest extends ApiRequest {
    constructor($resource: ng.resource.IResourceService, 
        private $window: ng.IWindowService,
        private converter: ConverterService) {
        super($resource, 'Article');
    }

    update(article: IArticle, tempTags: string[]): IPromise<void> {
        if (article.status !== ArticleStatus.ON_EDIT && 
            article.status !== ArticleStatus.ON_REVIEW && 
            article.status !== ArticleStatus.ON_AMENDING)
            article.reviewedContent = null;
        else
            article.reviewedContent = this.converter.strToBytes(article.reviewedContent);
            
        article.content = this.converter.strToBytes(article.content);
        article.tags = tempTags.join(' ');

        return this.saveResource(article);
    }
    
    createVersion(articleId: number): IPromise<{ newVersionId: number }> {
        return this.getResource(articleId, 'NewVersion');
    }

    remove(articleIds: number[]): IPromise<IArticleList> {
        return this.removeResource(articleIds);
    }

    getAllArticles(query: IArticleSearch) {
        return this.searching(query, 'All');
    }

    private searching(query: IArticleSearch, methodName?: string): IPromise<IArticleList> {
        return this.getResource(query, methodName);
    }

    search(query: IArticleSearch) {
        return this.searching(query);
    }
    
    getDefaultCategories(): Promise<string[]> {
        const methodName = 'Categories';
        const tagStr = this.$window.localStorage.getItem(methodName);
        
        return new Promise((resolve, reject) => {
            if (tagStr)
                resolve(JSON.parse(tagStr));
            else
                this.getResource<undefined, string[]>(undefined, methodName).then(data => {
                    this.$window.localStorage.setItem(methodName, JSON.stringify(data));
                    resolve(data);
                }).catch(err => reject(err));
        });        
    }

    getArticleTitles(): IPromise<IArticleTitles> {
        return this.getResource(undefined, 'Titles');
    }

    view(articleId: number, userId?: number): IPromise<IArticleView> {
        return this.getResource(userId, articleId.toString());
    }

    getStatusCaption(status: ArticleStatus): string {
        switch (status) {
            case ArticleStatus.DRAFT:
                return 'draft';
            case ArticleStatus.CREATED:
                return 'created';
            case ArticleStatus.ON_REVIEW:
                return 'on review';
            case ArticleStatus.ON_EDIT:
                return 'on edit';
            case ArticleStatus.APPROVED:
                return 'approved';
            case ArticleStatus.ON_AMENDING:
                return 'on amending';
            default:
                return 'none';
        }
    }

    assign(articleId: number) {
        return this.setArticleAssignment(articleId, true);
    }

    private setArticleAssignment(id: number, shouldAssign: boolean): IPromise<void> {
        return this.saveResource({ id: id, assign: shouldAssign }, 'Assignment');
    }

    unassign(articleId: number) {
        return this.setArticleAssignment(articleId, false);
    }
}

interface IArticle {
    id: number;

    authorId?: number;

    assignedToId?: number;

    name: string;

    description?: string;

    tags: string;
    
    insertDate?: Date;
    
    status: ArticleStatus;

    content?: string;

    reviewedContent?: string;
}

enum ArticleStatus
{
    DRAFT,

    CREATED = 1,

    ON_REVIEW = 2,

    ON_EDIT = 3,

    APPROVED = 4,

    REFUSED = 5,
    
    BLOCKED = 6,

    DELETED = 7,

    ON_AMENDING = 8
}

interface IArticleSearch extends ISearchQuery {
    status?: ArticleStatus;

    assignedTo?: string;
    
    author?: string;

    tags?: string;

    text?: string;

    dateStart?: Date;
    
    dateEnd?: Date;

    includeComments?: boolean;
}

interface IArticleList {
    privateData: IArticle[];

    privateDataCount: number;

    publicData: IArticle[];

    publicDataCount: number;

    pageLength: number;
    
    userNames: Record<number, string>;

    estimates: Record<number, EstimateType>;

    cmntNumber: Record<number, number>;
}

interface IArticleTitles {
    articles: IArticle[];
    
    userNames: Record<number, string>
}

interface IArticleView {
    article: IArticle;

    updatedDate: Date;

    comments: IComment[];

    userNames: Record<number, string>;

    userPhotos: Record<string, string>;

    estimate: number;

    curEstimate: EstimateType;
}

export { ArticleRequest };
