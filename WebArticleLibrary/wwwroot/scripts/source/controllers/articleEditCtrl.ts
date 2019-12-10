import { BaseCtrl } from "./baseCtrl";
import { ErrorService } from "../services/errorService";
import { ArticleStatus, IArticle, ArticleRequest } from "../services/api/articleRequest";
import { IAmendment, AmmendmentRequest } from "../services/api/amendmentRequest";
import { StateService } from "@uirouter/angularjs";
import { IUserInfo } from "../services/api/userRequest";
import { INgModelController, IPromise, ILocationService, IAnchorScrollService, IRootScopeService, ITimeoutService } from "angular";
import { AuthService } from "../services/authService";
import { ConverterService } from "../services/converterService";
import { inject } from "../app/inject";
import { AppSystem, Constants } from "../app/system";
import { AmendmentModalCtrl, IAmendmentDialogModel } from "./modals";

interface ISelection {
    selectedText?: string;

    focusNode?: Node;
}

@inject(ErrorService, AuthService, AppSystem.DEPENDENCY_ROOT_SCOPE_SERVICE, AppSystem.DEPENDENCY_TIMEOUT, ArticleRequest, AmmendmentRequest,
    AppSystem.DEPENDENCY_STATE, AppSystem.DEPENDENCY_MODAL_SERVICE, AppSystem.DEPENDENCY_LOCATION, AppSystem.DEPENDENCY_SCROLL_SERVICE, ConverterService)
class ArticleEditCtrl extends BaseCtrl {
    allCategories: string[];

    selection: ISelection;
    
    editArticleForm: INgModelController;    

    article: IArticle;
    
    amendments: IAmendment[];

    tempTags: string[];

    selectedAmendmentIndexes: number[];

    hasUnresolvedSelectedAmendments: boolean;

    isAmendingMode: boolean;

    isOnAmending: boolean;

    isOnEdit: boolean;

    isOnReview: boolean;

    scrolledAmendmentId: number;

    private _isReadMode: boolean;

    private readonly paramArticleId: number;

    private isDraft: boolean;
    
    private _articleContentCtrl: JQuery<HTMLElement>;
    
    private _articleReviewedContentCtrl: JQuery<HTMLElement>;

	private static readonly ART_REVIEWED_CONTENT_ID: string = '#reviewedContent';
    
    private static readonly ART_CONTENT_ID: string = '#editor';
    
    private static readonly AMENDMENT_CLASS_NAME: string = 'amendment';

    private static readonly AMENDMENT_RESOLVED_SYMBOL: string = '✔';

    private static readonly AMENDMENT_UNRESOLVED_SYMBOL: string = '✖';

    constructor(errorSrv: ErrorService,
        authSrv: AuthService,
        $scope: IRootScopeService,
        $timeout: ITimeoutService,
        private artReq: ArticleRequest,
        private amendmentReq: AmmendmentRequest, 
        private $state: StateService,
        private $modal: angular.ui.bootstrap.IModalService,
        private $location: ILocationService,
        private $anchorScroll: IAnchorScrollService,
        private converterSrv: ConverterService) {
        super(errorSrv);
        
		this.amendments = [];
        this.selectedAmendmentIndexes = [];
        this.allCategories = [];

        this.paramArticleId = $state.params.id;

        this.initCategoryControl();

		if (this.paramArticleId)
            this.setCurrentUser(authSrv, async ui => {
                this.initExistentArticle(ui, $timeout);
                this.initAmendingMode($scope, $timeout);
            }, $state);
        else {
            this.article = {
                id: 0,
                name: '',
                status: ArticleStatus.DRAFT
            };

            this.setControls($timeout);
        }
    }

    private async initExistentArticle(userInfo: IUserInfo, $timeout: ITimeoutService) {
        const viewData = await this.artReq.view(this.paramArticleId);
        const article = viewData.article;

        const articleStatus = article.status;

        if (article.authorId !== userInfo.id && (articleStatus === ArticleStatus.DRAFT ||
            articleStatus === ArticleStatus.ON_EDIT))
            throw new Error('You cannot see the article while it is being edited');
        
        this.article = viewData.article;

        this._isReadMode = this.article.authorId !== userInfo.id || (articleStatus !== ArticleStatus.ON_EDIT &&
            articleStatus != ArticleStatus.DRAFT);

        this.article.content = this.converterSrv.bytesToStr(this.article.content);
        
        if (this.article.reviewedContent)
            this.article.reviewedContent = this.converterSrv.bytesToStr(this.article.reviewedContent);

        this.tempTags = this.article.tags.split(' ');

        await this.setControls($timeout);
    }

    private initAmendingMode($scope: IRootScopeService, $timeout: ITimeoutService) {
        this.initAmendingState();

        if (this.isAmendingMode || this.isOnReview) {
            this.processRequest(this.amendmentReq.getAmendments(this.paramArticleId), amendments => {
                this.amendments = amendments;
                this.initAmendingState();
            });

            $timeout(() => ($('#amendmentPanel') as any).affix({ offset: { top: 20 } }));

            if (!this.isOnAmending)
                return;

            $(document).mousemove(() => $scope.$apply(() => {
                const selection = window.getSelection();

                const hasSelectedText = selection.anchorNode &&
                    $(selection.anchorNode).parents(ArticleEditCtrl.ART_REVIEWED_CONTENT_ID).length > 0 &&
                    $(selection.focusNode).parents(ArticleEditCtrl.ART_REVIEWED_CONTENT_ID).length > 0;

                this.selection = hasSelectedText ? {
                    selectedText: selection.toString(),
                    focusNode: selection.focusNode
                }: { selectedText: null };
            }));

            this.articleContentCtrl.focusout(() => 
                $scope.$apply(() => this.selection.selectedText = null));
        }
    }

    private initAmendingState() {
        const articleStatus = this.article.status;
        this.isAmendingMode = articleStatus === ArticleStatus.ON_AMENDING || articleStatus === ArticleStatus.ON_EDIT ||
            (articleStatus === ArticleStatus.ON_REVIEW && this.amendments.length > 0);

        const curUserId = this.userInfo.id;
        this.isOnReview = this.article.assignedToId === curUserId && articleStatus === ArticleStatus.ON_REVIEW;
        this.isOnAmending = this.article.assignedToId === curUserId && articleStatus === ArticleStatus.ON_AMENDING;
        this.isOnEdit = this.article.authorId === curUserId && articleStatus === ArticleStatus.ON_EDIT;
    }
    
    private async setControls($timeout: ITimeoutService) {
        const categories = await this.artReq.getDefaultCategories();
        this.allCategories = categories;

        let categoryParam;

        if (!this.paramArticleId && (categoryParam = this.$state.params.category))
            this.tempTags = [categoryParam];

        if (this.tempTags)
            this.tempTags.forEach(t => {
                if (this.allCategories.includes(t))
                    this.allCategories.push(t);
            });

        if (this.article.reviewedContent)
            this.articleReviewedContent = this.article.reviewedContent;

        this.articleContent = this.article.content;

        $timeout(() => $('#categories').trigger("change"), 0);
    }

    get isReadMode(): boolean { return this._isReadMode; }

    changeArticleState(toEditing: boolean, approve: boolean) {				
        let status: ArticleStatus;
        let msg: string;

        if (approve)
        {
            status = ArticleStatus.APPROVED;
            msg = 'You are going to approve publishing this article. Continue?';
        }
        else
        {
            if (toEditing)
            {
                status = ArticleStatus.ON_EDIT;

                if (this.article.status !== ArticleStatus.ON_EDIT)
                    msg = "You are going to send this article back for editing. Continue?";
            }
            else {
                status = ArticleStatus.ON_REVIEW;
                msg = "You are going to send this article for reviewing. Continue?";
            }
        }

        if (!msg || confirm(msg))
        {
            this.article.status = status;

            if (!approve)
                this.article.reviewedContent = this.articleReviewedContent;

            this.processRequest(this.updateArticle(approve, false), () => this.$state.go('app.articleinfo'));
        }
    }

    private get articleReviewedContent(): string { return this.articleReviewedContentCtrl.html(); }

    private get articleReviewedContentCtrl() { 
        if (!this._articleReviewedContentCtrl)
            this._articleReviewedContentCtrl = $(ArticleEditCtrl.ART_REVIEWED_CONTENT_ID);

        return this._articleReviewedContentCtrl;
    }

    private set articleReviewedContent(html: string) { this.articleReviewedContentCtrl.html(html); }

    private updateArticle(cleanMarks: boolean, excludeOriginalContent: boolean): IPromise<void> {
        if (cleanMarks) {
            const articleReviewedContentCtrl = this.articleReviewedContentCtrl;
            articleReviewedContentCtrl.remove(this.amendments.map(am => '#' + am.id).join(', '));
        }

        const curAmClassSelector = '.underlined';
        $(curAmClassSelector).removeClass(curAmClassSelector);
        $('.' + ArticleEditCtrl.AMENDMENT_CLASS_NAME).removeClass('label-info');

        if (!excludeOriginalContent)
            this.article.content = this.articleContent;

        this.tempTags = this.getTags();

        return this.artReq.update(this.article, this.tempTags);
    }

    private get articleContent(): string { return this.articleContentCtrl.html(); }

    private get articleContentCtrl() { 
        if (!this._articleContentCtrl)
            this._articleContentCtrl = $(ArticleEditCtrl.ART_CONTENT_ID);

        return this._articleContentCtrl;
    }

    private set articleContent(html: string) { 
        const artEditCtrl = this._articleContentCtrl;
        artEditCtrl.html(html); 
        (artEditCtrl as any).wysiwyg(); 
    }

    private getTags(): string[] {
        // select2 doesn't consider custom tags through the angular model link
        let tags = $('#categories').val() as string[];

        if (tags) {
            tags = tags.map(t => {
                const mas = t.split(/[,. :]/);
                return mas[mas.length - 1];
            });

            return tags;
        }
    }

    canBeDrafted(): boolean {
        return !this.userInfo || this.article.authorId === this.userInfo.id;
    }

    canBeSaved(): boolean {
        return !this.article.id || (this.article.authorId === this.userInfo.id && this.article.status === ArticleStatus.DRAFT);
    }

    canBeRemoved(): boolean {
        return this.article.id && this.article.authorId === this.userInfo.id;
    }

    createVersion() {
        this.processRequest(this.artReq.createVersion(this.article.id), versionInfo => {
            const url = this.$state.href('app.articleedit', { id: versionInfo.newVersionId });
            window.open(url);
        });
    }

    removeArticle(id: number) {
        if (confirm('You are going to remove this article. Continue?'))
            this.processRequest(this.artReq.remove([id]), () => this.$state.go('app.articleinfo'));
    }

    setDraftState(makeDraft: boolean) { this.isDraft = makeDraft; }

    createArticle() {
        let status: ArticleStatus;
        let msg: string;

        if (this.isDraft)
        {
            status = ArticleStatus.DRAFT;

            if (this.article.status !== ArticleStatus.DRAFT)
                msg = "You are going to make this article into a draft. Continue?";
        }
        else
        {
            status = ArticleStatus.CREATED;
            msg = "You are going to make this article available for reviewing. Continue?";
        }

        if (!msg || confirm(msg))
        {
            this.article.status = status;
            this.processRequest(this.updateArticle(this.isDraft, false), () => this.$state.go('app.articleinfo'));
        }
    }

    onTextInput() { this.article.content = this.articleContent; }

    onCategoryChange() {
        const tags = this.getTags();
        this.editArticleForm.$setValidity('tooManyCategories', !tags || tags.join(' ').length <= 50);
    }
    
    close() {
        if (confirm('You are about to close the page without saving any progress you might have done. Continue?'))
            this.$state.go('app.articleinfo');
    }

    getAmendmentComment(content: string): string {
        const parts: string[] = content.split(' - ');
        content = parts.length > 1 ? parts[1] : content;
        return content.length > 25 ? content.substring(0, 25) + '...' : content;
    }

    openAmendment(amIndex?: number) {
        let selIndex: number;
        let selText: string;

        if (amIndex == null) {
            selIndex = this.amendments.length;
            selText = this.selection.selectedText;
        }
        else
            selIndex = amIndex;

        let amendment: IAmendment = this.amendments[selIndex];

        const model: IAmendmentDialogModel = {
            selectionText: selText,
            amendment: amendment,
            isReadonly: !this.isOnAmending || (amendment && (amendment.resolved || amendment.archived))
        };

        this.processRequest(this.$modal.open({
            templateUrl: "views/modalDialogs/AmendmentModal.html",
            controller: AmendmentModalCtrl,
            controllerAs: Constants.CONTROLLER_PSEUDONIM,
            resolve: {
                [AppSystem.DEPENDENCY_DIALOG_MODEL]: model
            }
        }).result, async (content: string) => {
            amendment.content = content;

            if (amendment.id)
                await this.amendmentReq.update([amendment]);
            else {
                amendment.articleId = this.article.id;
                const newAmendment = await this.amendmentReq.create(amendment);

                const span = $("<span>").attr('id', newAmendment.id)
                    .attr('title', newAmendment.content)
                    .attr('contenteditable', 'false')
                    .text(ArticleEditCtrl.AMENDMENT_UNRESOLVED_SYMBOL)
                    .addClass(ArticleEditCtrl.AMENDMENT_CLASS_NAME + ' text-danger');

                const parents = $(this.selection.focusNode).parentsUntil(ArticleEditCtrl.ART_REVIEWED_CONTENT_ID);
                const focusNode = parents.length ? parents.last() : this.selection.focusNode;
                span.insertBefore(focusNode);

                this.article.reviewedContent = this.articleReviewedContent;
                await this.updateArticle(false, true);

                this.amendments[selIndex] = newAmendment;
            }
        });
    }

    removeAmendment() {
        const idsForRemove = this.amendments.filter(
            (val, index) => this.selectedAmendmentIndexes.includes(index)).map(val => val.id);

        if (!idsForRemove.length)
            return;

        this.processRequest(this.amendmentReq.remove(idsForRemove), async () => {
            idsForRemove.forEach(id => $('#' + id).remove());

            this.article.reviewedContent = this.articleReviewedContent;
            await this.updateArticle(false, true);

            this.amendments = this.amendments.filter(val => !idsForRemove.includes(val.id));
            this.selectedAmendmentIndexes = [];
        });
    }

    selectAmendment(index: number) {
        if ($('.amdBox' + index + ':checked').length > 0)
            this.selectedAmendmentIndexes.push(index);
        else
            this.selectedAmendmentIndexes = this.selectedAmendmentIndexes.filter(i => i !== index);

        this.hasUnresolvedSelectedAmendments = this.selectedAmendmentIndexes.every(i => {
            const _am = this.amendments[i];
            return _am && !_am.archived && !_am.resolved;
        });
    }

    areAmendmentsResolved(): boolean {
        return this.amendments.filter(am => !am.archived && !am.resolved).length === 0;
    }

    startAmending() {
        this.article.reviewedContent = this.articleContent;
        this.article.status = ArticleStatus.ON_AMENDING;

        this.processRequest(this.updateArticle(false, true), () =>
            this.$state.transitionTo(this.$state.current, { id: this.paramArticleId }, {
                reload: true, inherit: false, notify: true
            }));
    }

    resolveAmendment() {
        if (!this.isOnEdit)
            return;

        const amendmentsToResolve = this.amendments.filter(
            (val, index) => !this.selectedAmendmentIndexes.includes(index));

        if (!amendmentsToResolve.length)
            return;

        amendmentsToResolve.forEach(am => am.resolved = true);

        this.processRequest(this.amendmentReq.update(amendmentsToResolve), async () => {
            amendmentsToResolve.forEach(am =>
                $("#" + am.id).text(ArticleEditCtrl.AMENDMENT_RESOLVED_SYMBOL)
                    .removeClass('text-danger').addClass('text-success'));

            this.article.reviewedContent = this.articleReviewedContent;
            await this.updateArticle(false, false);
        });
    }

    scrollToAmendment(id: number) {
        if (id)
            return;

        this.scrolledAmendmentId = id;
        this.$location.hash(id.toString());
        this.$anchorScroll();

        $('.' + ArticleEditCtrl.AMENDMENT_CLASS_NAME).removeClass('label-info');
        $('#' + id).addClass('label-info');
    }
}

export { ArticleEditCtrl };
