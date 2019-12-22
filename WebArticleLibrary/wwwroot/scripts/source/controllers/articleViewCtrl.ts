import { BaseCtrl } from "./baseCtrl";
import { ErrorService } from "../services/errorService";
import { StateService } from "@uirouter/core";
import { EstimateRequest, EstimateType } from "../services/api/estimateRequest";
import { Article, ArticleRequest, ArticleStatus } from "../services/api/articleRequest";
import { ui, ILocationService, IAnchorScrollService, IPromise, ITimeoutService } from "angular";
import { ModalOpener } from "../app/modalOpener";
import { ComplaintRequest } from "../services/api/complaintRequest";
import { IComment, CommentRequest, CommentStatus } from "../services/api/commentRequest";
import { AmmendmentRequest } from "../services/api/amendmentRequest";
import { Constants, AppSystem } from "../app/system";
import { HistoryRequest, IHistory } from "../services/api/historyRequest";
import { AuthService } from "../services/authService";
import { ConverterService } from "../services/converterService";
import { JQueryFeatures } from "../app/jQueryFeatures";
import { inject } from "../app/inject";

@inject(ErrorService, AppSystem.DEPENDENCY_MODAL_SERVICE, AuthService, AppSystem.DEPENDENCY_TIMEOUT,
    ConverterService, EstimateRequest, ComplaintRequest, CommentRequest, ArticleRequest,
    AmmendmentRequest, HistoryRequest, AppSystem.DEPENDENCY_STATE, AppSystem.DEPENDENCY_LOCATION,
    AppSystem.DEPENDENCY_SCROLL_SERVICE, AppSystem.DEPENDENCY_ESCAPING_SERVICE)
class ArticleViewCtrl extends BaseCtrl {
    estimate: number;

    comment: IComment;

    comments: IComment[];

    estimateType: EstimateType;

    updatedDate: Date;

    articleHtmlContent: string;

    showComments: boolean;

    userId: number;

    article: Article;

    private userNames: Record<number, string>;

    private artHistories: IHistory[];

    private readonly modalOpener: ModalOpener;

    private userPhotos: Record<number, string>;

    private _commentCtrl: JQuery<HTMLElement>;

    private static readonly COMMENT_CONTENT_ID = "#comment";

    constructor(errorSrv: ErrorService,
        $modal: ui.bootstrap.IModalService,
        authSrv: AuthService,
        $timeout: ITimeoutService,
        private converterSrv: ConverterService,
        private estimateReq: EstimateRequest,
        private complaintReq: ComplaintRequest,
        private commentReq: CommentRequest,
        private articleReq: ArticleRequest,
        private amendmentReq: AmmendmentRequest,
        private historyReq: HistoryRequest,
        private $state: StateService,
        private $location: ILocationService,
        private $anchorScroll: IAnchorScrollService,
        private $sce: angular.ISCEService) {
        super(errorSrv);

        this.modalOpener = new ModalOpener($modal);

        const articleId: number = this.$state.params.id;

        this.userNames = [];
        this.userPhotos = [];

        if (!articleId)
			$state.go('app');

        this.setCurrentUser(authSrv, async userInfo => {
            const articleData = await this.articleReq.view(articleId, (userInfo || {}).id);
            this.article = articleData.article;
            
            if (!userInfo && !this.isArticleApproved())
                throw new Error('The article has not been published yet');
            
            this.userId = userInfo ? userInfo.id: 0;

            const articleStatus = this.article.status;

            if ((articleStatus === ArticleStatus.DRAFT || articleStatus === ArticleStatus.ON_EDIT) &&
                this.article.authorId !== this.userId)
                throw new Error('You cannot see the article while it is being edited');

            this.updatedDate = articleData.updatedDate;

            this.userPhotos = articleData.userPhotos;

            this.comments = articleData.comments;
            this.userNames = articleData.userNames;

            this.estimate = articleData.estimate;
            this.estimateType = articleData.curEstimate;

            this.articleHtmlContent = this.getHtml(this.article.content);

            $timeout(() => $('#artContent').find('.amendment').remove());

            if (userInfo) {
                const historyIdParam = this.$state.params.historyId;

                if (historyIdParam)
                    this.showHistory(historyIdParam);

                if (!this.isArticleApproved())
                    return;

                this.initCommentControl();
                this.goToPrechosenComment($timeout);
            }
        });
    }

    private initCommentControl() {
        new JQueryFeatures(this.commentCtrl).initHtmlEditor();

        this.comment = {            
            articleId: this.article.id,
            content: '',
            status: CommentStatus.CREATED
        };
    }

    private get commentCtrl() {
        if (!this._commentCtrl)
           this._commentCtrl = $(ArticleViewCtrl.COMMENT_CONTENT_ID);

        return this._commentCtrl;
    }

    private goToPrechosenComment($timeout: ITimeoutService) {
        const commentIdParam = this.$state.params.commentId;

        if (!commentIdParam)
            return;

        const chosenComment = this.comments.find(c => c.id === commentIdParam);

        if (!chosenComment) {
            alert('The searched comment was probably removed or banned');
            return;
        }

        $timeout(() => {
            this.showComments = true;
            this.goToComment(commentIdParam);
        });
    }

    private isArticleApproved(): boolean { 
        return this.article && this.article.status === ArticleStatus.APPROVED; 
    }

    getUserName(userId: number): string { 
        return this.userNames[userId]; 
    }

    getHtml(content: string): string {
        return this.converterSrv.convertByteStringToHtml(this.$sce, content);
    }

    searchForUserArticles(userId: number) {
        this.$state.go('app.articlesearch', { author: this.getUserName(userId) });
    }

    sendComment() {
        if (!this.comment)
            return;

        this.processRequest(this.commentReq.create(this.comment), () => this.reloadPage());
    }

    onTextInput() {
        this.comment.content = this.commentCtrl.html();
    }

    private reloadPage() {
        this.$state.transitionTo(this.$state.current, { id: this.article.id }, 
            { reload: true, inherit: false, notify: true });
    }

    removeComment(comment: IComment) {
        if (!confirm('You are going to remove the comment. Continue?'))
            return;

        this.processRequest(this.commentReq.updateStatus(comment.id, CommentStatus.DELETED), 
            () => this.reloadPage());
    }

    complainAboutArticle() {
        if (confirm('You are going to make a complaint about the article. Continue?'))
            this.complain();
    }

    private complain(commentId?: number) {
        this.processRequest(this.modalOpener.openComplaintModal({
            isForComment: commentId ? true: false
        }), async content => {
            if (!content)
                return;

            await this.complaintReq.create({
                text: content,
                articleId: this.article.id,
                userCommentId: commentId
            });

            alert("Your complaint is waiting its turn to be looked into");
        });
    }

    complainAboutComment(commentId: number) {
        if (confirm('You are going to make a complaint about the selected comment. Continue?'))
            this.complain(commentId);
    }

    assess(isPositive: boolean) {
        const estimateType = isPositive ? EstimateType.POSITIVE: EstimateType.NEGATIVE;

        this.processRequest(this.estimateReq.assessArticle(this.article.id, 
            estimateType), resp => {
                this.estimate = resp.finalEstimate;
                this.estimateType = estimateType;
            });
    }

    close() { this.$state.go('app.articleinfo'); }

    respondTo(commentId: number) {
        if (!this.comment)
            return;

        this.comment.responseToId = commentId;
    }

    cancelResponse() {
        if (!this.comment)
            return;
        
        this.comment.responseToId = null;
    }

    goToComment(commetnId: number) {
        this.respondTo(commetnId);
        this.$location.hash(commetnId.toString());
        this.$anchorScroll();
    }

    isCommentBlocked(status: CommentStatus) { return status === CommentStatus.BLOCKED; }

    isCommentDeletedById(commentId: number) {
        const foundComment = this.comments.find(c => c.id === commentId);
        return !foundComment || this.isCommentDeleted(foundComment.status);
    }

    isCommentDeleted(status: CommentStatus) { return status === CommentStatus.DELETED; }

    banComment(comment: IComment, isRecovering: boolean) {
        let process: string;
        let status: CommentStatus;

        if (isRecovering) {
            process = 'recover';
            status = CommentStatus.CREATED;
        }
        else {
            process = 'ban';
            status = CommentStatus.BLOCKED;
        }

        if (confirm('You are going to ' + process + ' the comment. Continue?'))
            this.processRequest(this.commentReq.updateStatus(this.comment.id, status), 
                () => comment.status = status);
    }

    banArticle() {
        if (!confirm('You are going to return the article onto the review state. Continue?'))
            return;

        this.processRequest(this.modalOpener.openAmendmentModal({ isGlobal: true }), 
            async content => {
                await this.articleReq.assign(this.article.id);

                await this.amendmentReq.create({
                    articleId: this.article.id,
                    content: content
                });

                this.$state.go('app.articleedit', { id: this.article.id });
            });
    }

    getUserPhoto(userId: number) {
        const contents: string = this.userPhotos[userId];
        return contents ? "data:image/jpeg;base64," + contents : Constants.NO_PHOTO_FILE_URL;
    }

    showHistory(historyId?: number) {
        if (this.artHistories)
            this.processRequest(this.openHistoryModal(this.artHistories, historyId));
        else
            this.processRequest(this.historyReq.getHistory(this.article.id), async histories => {
                this.artHistories = histories;
                await this.openHistoryModal(this.artHistories, historyId);
            });
    }

    private openHistoryModal(histories: IHistory[], historyId?: number): IPromise<void> {
        if (!histories)
            return;

        return this.modalOpener.openArticleHistoryModal({
            articleName: this.article.name,
            isArticleApproved: this.article.status === ArticleStatus.APPROVED,
            historyId: historyId,
            histories: this.artHistories
        });
    }
}

export { ArticleViewCtrl };
