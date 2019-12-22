import { ErrorService } from "../services/errorService";
import { PagedQuery } from "../app/pagedQuery";
import { IComment, ICommentSearch, CommentRequest, CommentStatus } from "../services/api/commentRequest";
import { ISearchQuery, ColumnIndex } from "../services/api/apiRequest";
import { StateService } from "@uirouter/core";
import { ConverterService } from "../services/converterService";
import { ISCEService } from "angular";
import { ModalOpener } from "./modals";
import { AuthService } from "../services/authService";
import { EnumHelper, AppSystem } from "../app/system";
import { inject } from "../app/inject";
import { BaseCtrl } from "./baseCtrl";

@inject(ErrorService, AuthService, CommentRequest, ConverterService, 
    AppSystem.DEPENDENCY_MODAL_SERVICE, AppSystem.DEPENDENCY_STATE, 
    AppSystem.DEPENDENCY_ESCAPING_SERVICE)
class CommentInfoCtrl extends BaseCtrl {
    query: ICommentSearch;

    pages: number[];

    comments: IComment[];

    selectedComment: IComment;

    readonly statuses: CommentStatus[];

    readonly goToPage: (pageIndex: number) => void;

    readonly sortComments: (col: ColumnIndex) => void;

    private pagedQuery: PagedQuery<ICommentSearch>;

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

        this.query = {
            asc: false,
            page: 1,
            colIndex: ColumnIndex.DATE
        };

        this.pagedQuery = new PagedQuery(this.query, this.filterItems.bind(this));
        this.goToPage = this.pagedQuery.goToPage.bind(this.pagedQuery);
        this.sortComments = this.sortItems.bind(this);

        this.comments = [];

        this.statuses = EnumHelper.getKeys(CommentStatus);

        super.setCurrentUser(authSrv, () => this.filterComments(), this.$state);
    }

    private filterItems(filterQuery: ICommentSearch) {
        this.processRequest(this.commentReq.get(filterQuery), cmntInfo => {
            this.comments = cmntInfo.data;
            this.articleNames = cmntInfo.articleNames;
            this.complaintNumber = cmntInfo.complaintNumber;
            this.relatedCmntNumber = cmntInfo.relatedCmntNumber;

            this.pages = PagedQuery.getPageNumberArray(cmntInfo.dataCount, cmntInfo.pageLength);
            Object.assign(this.query, filterQuery);

            this.selectedComment = null;
        });
    }

    private sortItems(col: ColumnIndex) { this.pagedQuery.sortItems(col, this.pages); }
    
    filterComments() { this.pagedQuery.filterItems(); }

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
