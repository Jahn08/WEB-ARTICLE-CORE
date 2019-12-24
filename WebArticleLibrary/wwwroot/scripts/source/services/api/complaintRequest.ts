import { ApiRequest, IArticleEntity, ISearchQuery, INameSearchResult } from './apiRequest';
import { IPromise } from 'angular';

class ComplaintRequest extends ApiRequest {
    constructor($resource: ng.resource.IResourceService) {
        super($resource, 'Complaint');
    }

    create(complaint: IComplaint): IPromise<IComplaint> {
        return this.saveResource(complaint);
    }

    get(query: IComplaintSearch): IPromise<IComplaintList> {
        return this.getResource(query);
    }

    setStatus(complaintId: number, status: ComplaintStatus, response: string): 
        IPromise<void> {
        return this.saveResource({
            id: complaintId,
            status,
            response
        }, 'Status');
    }

    assign(complaintId: number) {
        return this.setAssignment(complaintId, true);
    }

    private setAssignment(complaintId: number, shouldAssign: boolean): IPromise<void> {
        return this.saveResource({ id: complaintId, assign: shouldAssign }, 'Assignment');
    }

    unassign(complaintId: number) {
        return this.setAssignment(complaintId, false);
    }

    getStatusCaption(status: ComplaintStatus): string {
        switch (status) {
            case ComplaintStatus.CREATED:
                return 'created';
            case ComplaintStatus.APPROVED:
                return 'approved';
            case ComplaintStatus.REFUSED:
                return 'refused';
            default:
                return 'none';
        }
    }

    getEntityTypeCaption(type: ComplaintEntityType): string {
        switch (type) {
            case ComplaintEntityType.ARTICLE:
                return 'article';
            case ComplaintEntityType.COMMENT:
                return 'comment';
            default:
                return 'none';
        }
    }
}

interface IComplaint extends IArticleEntity {
    userCommentId?: number;

    assignedToId?: number;
    
    text: string;

    status?: ComplaintStatus;

    cmntAuthorId?: number;
    
    articleAuthorId?: number;
}

interface IComplaintSearch extends ISearchQuery {
    text?: string;
    
    author?: string;
    
    assignedTo?: string;
    
    dateStart?: Date;
    
    dateEnd?: Date;
    
    entityType?: ComplaintEntityType;
    
    entity?: string;
    
    status?: ComplaintStatus;
}

interface IComplaintList extends INameSearchResult<IComplaint> {
    comments: Record<string, string>;
}

enum ComplaintStatus {
    CREATED = 1,
  
    APPROVED = 4,
        
    REFUSED = 5
}

enum ComplaintEntityType
{
    COMMENT,

    ARTICLE
}
    
export { ComplaintRequest, IComplaint, IComplaintSearch, ComplaintStatus, ComplaintEntityType };
