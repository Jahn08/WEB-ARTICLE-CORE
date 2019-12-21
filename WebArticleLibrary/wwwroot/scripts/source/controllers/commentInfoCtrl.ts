import { ErrorService } from "../services/errorService";
import { PagedCtrl } from "./pagedCtrl";
import { IComment, ICommentSearch, CommentRequest, CommentStatus } from "../services/api/commentRequest";
import { ISearchQuery, ColumnIndex } from "../services/api/apiRequest";
import { StateService } from "@uirouter/core";
import { ConverterService } from "../services/converterService";
import { ISCEService } from "angular";
import { ModalOpener } from "./modals";
import { AuthService } from "../services/authService";
import { EnumHelper, AppSystem } from "../app/system";
import { inject } from "../app/inject";

@inject(ErrorService, AuthService, CommentRequest, ConverterService, 
    AppSystem.DEPENDENCY_MODAL_SERVICE, AppSystem.DEPENDENCY_STATE, 
    AppSystem.DEPENDENCY_ESCAPING_SERVICE)
class CommentInfoCtrl extends PagedCtrl {
    query: ICommentSearch;
    
    comments: IComment[];

    pages: number[];

    selectedComment: IComment;

    readonly statuses: CommentStatus[];

    readonly goToPage: (pageIndex: number) => void;

    readonly sortItems: (col: ColumnIndex) => void;

    private articleNames: Record<number, string>;

    private relatedCmntNumber: Record<number, number>;

    private complaintNumber: Record<number, number>;

    constructor(errorSrv: ErrorService,
        authSrv: AuthService, 
        private commentReq: CommentRequest,
        private converterSrv: ConverterService,
        private $modal: angular.ui.bootstrap.IModalService,
        private $state: StateService,
        private $sce: ISCEService) {
        super(errorSrv);

        this.goToPage = this.goToPageInternally.bind(this);
        
        this.sortItems = this.sortItemsInternally.bind(this);

        this.query = {
            asc: false,
            page: 1,
            colIndex: ColumnIndex.DATE
        };

        this.comments = [];

        this.statuses = EnumHelper.getKeys(CommentStatus);

        super.setCurrentUser(authSrv, () => 
            this.getFilteredItems(this.query.page, this.query.colIndex, this.query.asc), this.$state);
    }

    private goToPageInternally(pageIndex: number) {
        if (this.query.page === pageIndex)
            return;

        this.getFilteredItems(pageIndex, null, null);
    }

    getFilteredItems(pageIndex: number, col: ColumnIndex, asc: boolean) {
        const queryOptions: ISearchQuery = { asc: asc, colIndex: col, page: pageIndex };
        const searchFilter: ICommentSearch = this.copySearchQuery(this.query, queryOptions);

        this.processRequest(this.commentReq.get(searchFilter), cmntInfo => {
            this.comments = cmntInfo.data;
            this.articleNames = cmntInfo.articleNames;
            this.complaintNumber = cmntInfo.complaintNumber;
            this.relatedCmntNumber = cmntInfo.relatedCmntNumber;

            this.pages = this.getPageNumberArray(cmntInfo.dataCount, cmntInfo.pageLength);
            Object.assign(this.query, searchFilter);

            this.selectedComment = null;
        });
    }

    private sortItemsInternally(col: ColumnIndex) {
        if (!this.pages.length)
            return;

        const asc = col === this.query.colIndex ? !this.query.asc : true;
        this.getFilteredItems(null, col, asc);
    }

    getArticleName(cmnt: IComment): string {
        return cmnt ? this.articleNames[cmnt.articleId] : null;
    }

    getRelatedCommentCount(): number {
        const cmnt = this.selectedComment;
        return cmnt ? this.relatedCmntNumber[cmnt.id] : null;
    }

    getComplaintCount(): number {
        const cmnt = this.selectedComment;
        return cmnt ? this.complaintNumber[cmnt.id] : null;
    }

    selectComment(comment: IComment) {
        this.selectedComment = this.selectedComment && 
            this.selectedComment.id === comment.id ? null : comment;
    }

    removeComment() {
        if (!confirm('You are going to remove the comment. Continue?'))
            return;

        const cmnt = this.selectedComment;

        this.processRequest(this.commentReq.updateStatus(cmnt.id, CommentStatus.DELETED), 
            () => {
                this.$state.transitionTo(this.$state.current, null, {
                    reload: true, inherit: false, notify: true
                });
            });
    }

    getCommentContent() {
        const cmnt = this.selectedComment;
        return cmnt ? this.converterSrv.convertByteStringToHtml(this.$sce, cmnt.content): null;
    }

    goToCommentList() {
        const cmnt = this.selectedComment;

        this.processRequest(this.commentReq.get({
            asc: false,
            id: cmnt.id,
            page: 1,
            colIndex: ColumnIndex.DATE
        }), async commentData => {
            await new ModalOpener(this.$modal).openCommentModal({
                comments: commentData.data,
                userNames: commentData.userNames,
                parentId: cmnt.id
            });
        });
    }

    getCmntStatusCaption(status: CommentStatus): string {
        return this.commentReq.getStatusCaption(status);
    }
}

export { CommentInfoCtrl };
