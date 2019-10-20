import { ApiRequest, IArticleEntity, ISearchQuery, INameSearchResult } from './apiRequest';
import { ConverterService } from '../converterService';
import { inject } from '../../app/inject';
import { IPromise } from 'angular';

@inject('$resource', ConverterService)
class CommentRequest extends ApiRequest {
    constructor($resource: ng.resource.IResourceService, 
        private converter: ConverterService) {
        super($resource, 'Comment');
    }

    create(comment: IComment): IPromise<IComment> {
        comment.content = this.converter.strToBytes(comment.content);
        return this.saveResource(comment);
    }

    getComments(query: ICommentSearch): IPromise<ICommentList> {
        return this.getResource(query);
    }

    updateStatus(commentId: number, status: CommentStatus): IPromise<void> {
        return this.saveResource({ id: commentId, status }, 'Status');
    }

    getStatusCaption(status: CommentStatus): string {
        switch (status) {
            case CommentStatus.CREATED:
                return 'created';
            case CommentStatus.BLOCKED:
                return 'blocked';
            case CommentStatus.DELETED:
                return 'deleted';
            default:
                return 'none';
        }
    }
}

interface IComment extends IArticleEntity {
    responseToId?: number;

    content: string;

    status: CommentStatus;
}

enum CommentStatus {
    CREATED = 1,

    BLOCKED = 6,

    DELETED = 7
}

interface ICommentSearch extends ISearchQuery {
    userId?: number;
    
    all?: boolean;

    parentId?: number;

    id?: number;
    
    articleName?: string;
    
    dateStart?: Date;
    
    dateEnd: string;
    
    status?: CommentStatus;
}

interface ICommentList extends INameSearchResult<IComment> {
    complaintNumber: Record<number, number>;

    relatedCmntNumber: Record<number, number>;
}

export { CommentRequest, IComment };
