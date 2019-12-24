import { PagedQuery } from "../app/pagedQuery";
import { ErrorService } from "../services/errorService";
import { IComplaintSearch, ComplaintRequest, IComplaint, ComplaintStatus, ComplaintEntityType } 
    from "../services/api/complaintRequest";
import { ColumnIndex } from "../services/api/apiRequest";
import { BaseCtrl } from "./baseCtrl";
import { ModalOpener } from "../app/modalOpener";
import { StateService } from "@uirouter/angularjs";
import { ConverterService } from "../services/converterService";
import { ISCEService } from "angular";
import { EnumHelper, AppSystem } from "../app/system";
import { AuthService } from "../services/authService";
import { inject } from "../app/inject";

@inject(ErrorService, AuthService, AppSystem.DEPENDENCY_MODAL_SERVICE, ComplaintRequest,
    ConverterService, AppSystem.DEPENDENCY_ESCAPING_SERVICE, AppSystem.DEPENDENCY_STATE)
class ComplaintInfoCtrl extends BaseCtrl {
    complaints: IComplaint[];

    pages: number[];

    selectedComplaint: IComplaint;

    query: IComplaintSearch;

    readonly goToPage: (pageIndex: number) => void;

    readonly sortComplaints: (col: ColumnIndex) => void;

    readonly statuses: ComplaintStatus[];

    readonly entityTypes: ComplaintEntityType[];

    private modalOpener: ModalOpener;

    private pagedQuery: PagedQuery<IComplaintSearch>;

    private userNames: Record<number, string>;

    private articleNames: Record<number, string>;

    private comments: Record<number, string>;

    constructor(errorSrv: ErrorService,
        authSrv: AuthService,
        $modal: angular.ui.bootstrap.IModalService,
        private complaintReq: ComplaintRequest,
        private converterSrv: ConverterService,
        private $sce: ISCEService,
        private $state: StateService) {
        super(errorSrv);

        this.modalOpener = new ModalOpener($modal);

        this.statuses = EnumHelper.getKeys(ComplaintStatus);
        this.entityTypes = EnumHelper.getKeys(ComplaintEntityType);

        this.query = {
            asc: false,
            page: 1,
            colIndex: ColumnIndex.DATE
        }

        this.pagedQuery = new PagedQuery(this.query, this.filterItems.bind(this));
        this.goToPage = this.pagedQuery.goToPage.bind(this.pagedQuery);
        this.sortComplaints = this.sortItems.bind(this);

        this.setCurrentUser(authSrv, () => {
            if (!this.hasAdminStatus())
                $state.go('app');

            this.filterComplaints();
        }, $state);
    }

    private sortItems(col: ColumnIndex) { this.pagedQuery.sortItems(col, this.pages); }
   
    filterItems(filterQuery: IComplaintSearch) {
        this.processRequest(this.complaintReq.get(filterQuery), complaintInfo => {
            this.complaints = complaintInfo.data;
            this.userNames = complaintInfo.userNames;
            
            this.userNames[this.userInfo.id] = this.userInfo.name;

            this.articleNames = complaintInfo.articleNames;
            this.comments = complaintInfo.comments;

            this.pages = PagedQuery.getPageNumberArray(complaintInfo.dataCount, 
                complaintInfo.pageLength);

            this.selectedComplaint = null;

            Object.assign(this.query, filterQuery);
        });
    }

    filterComplaints() { this.pagedQuery.filterItems(); }
    
    isUserRelatedToIssue(): boolean {
        const userId = this.userInfo.id;
        const cmpl = this.selectedComplaint;
        return cmpl.authorId === userId || cmpl.cmntAuthorId === userId || 
            cmpl.articleAuthorId === userId;
    }

    assignComplaint() { this.setAssignment(this.selectedComplaint, true); }

    private setAssignment(complaint: IComplaint, assign: boolean) {
        this.processRequest(assign ? this.complaintReq.assign(complaint.id): 
            this.complaintReq.unassign(complaint.id), () =>
                complaint.assignedToId = assign ? this.userInfo.id : null
            );
    }

    unassignComplaint() { this.setAssignment(this.selectedComplaint, false); }

    selectComplaint(complaint: IComplaint) {
        this.selectedComplaint = this.selectedComplaint && 
            this.selectedComplaint.id === complaint.id ? null : complaint;
    }

    approveComplaint() { this.setStatus(ComplaintStatus.APPROVED); }

    private setStatus(status: ComplaintStatus) {
        if (!this.selectedComplaint)
            return;
            
            this.processRequest(this.modalOpener.openResponseModal(), async response => {
                if (!response) {
                    alert('The state will not be changed as the comment is empty');
                    return;
                }

                await this.complaintReq.setStatus(this.selectedComplaint.id, status, response);
                      
                // An approved complaint for an article might affect others
                if (!this.selectedComplaint.userCommentId && status === ComplaintStatus.APPROVED) {
                    this.$state.transitionTo(this.$state.current, null, {
                        reload: true, inherit: false, notify: true
                    });
                }

                this.selectedComplaint.status = status;
                this.selectedComplaint.assignedToId = null;
        });
    }

    refuseComplaint() { this.setStatus(ComplaintStatus.REFUSED); }

    isComplaintCreated() {
        return this.selectedComplaint.status === ComplaintStatus.CREATED;
    }

    getUserName(userId: number): string { return this.userNames[userId]; }

    getArticleName(articleId: number): string {
        if (articleId)
            return this.articleNames[articleId];

        const cmpl = this.selectedComplaint;
        return cmpl && cmpl.articleId ? this.articleNames[cmpl.articleId] : null;
    }

    getCommentContent(commentId: number): string {
        const cmpl = this.selectedComplaint;

        if (!cmpl || !cmpl.userCommentId)
            return null;

        return this.converterSrv.convertByteStringToHtml(this.$sce, 
            this.comments[cmpl.userCommentId]);
    }

	getComplaintStatusCaption(status: ComplaintStatus): string {
        return this.complaintReq.getStatusCaption(status)
    }

	getEntityTypeCaption(type: ComplaintEntityType): string {
        return this.complaintReq.getEntityTypeCaption(type)
    }
}

export { ComplaintInfoCtrl };
