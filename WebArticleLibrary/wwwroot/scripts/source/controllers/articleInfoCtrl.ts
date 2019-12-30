import { ArticleRequest, ArticleStatus, IArticle, IArticleSearch } from "../services/api/articleRequest";
import { ErrorService } from "../services/errorService";
import { EnumHelper, AppSystem } from "../app/system";
import { IUserInfo } from "../services/api/userRequest";
import { ColumnIndex } from "../services/api/apiRequest";
import { EstimateType } from "../services/api/estimateRequest";
import { AuthService } from "../services/authService";
import { StateService } from "@uirouter/angularjs";
import { HistoryRequest, IHistory } from "../services/api/historyRequest";
import { ui } from "angular";
import { ModalOpener } from "../app/modalOpener";
import { inject } from "../app/inject";
import { PagedQuery } from "../app/pagedQuery";
import { BaseCtrl } from "./baseCtrl";

@inject(ErrorService, AuthService, AppSystem.DEPENDENCY_STATE, AppSystem.DEPENDENCY_MODAL_SERVICE, ArticleRequest, HistoryRequest)
class ArticleInfoCtrl extends BaseCtrl {
    readonly statuses: number[];

    privateArtPages: number[];

    privateQuery: IArticleSearch;

    publicArtPages: number[];

    publicQuery: IArticleSearch;

    selectedPrivateArticles: IArticle[];
    
    selectedArticle: IArticle;

    privateArticles: IArticle[];

    publicArticles: IArticle[];

    privateEstimate: number;

    estimate: number;

    private readonly modalOpener: ModalOpener;

    private privatePagedQuery: PagedQuery<IArticleSearch>;

    private publicPagedQuery: PagedQuery<IArticleSearch>;

    readonly sortPublicArticles: (forPublic: boolean, col: ColumnIndex) => void;

    readonly sortPrivateArticles: (forPublic: boolean, col: ColumnIndex) => void;

    readonly goToPage: (pageIndex: number, forPublic: boolean) => void;

    private userNames: Record<number, string>;

    private estimates: Record<number, EstimateType>;

    private cmntNumber: Record<number, number>;

    private artHistories: Record<number, IHistory[]>;

    constructor(errorSrv: ErrorService,
        authSrv: AuthService,
        $state: StateService,
        $modal: ui.bootstrap.IModalService,
        private articleReq: ArticleRequest,
        private historyReq: HistoryRequest) {
        super(errorSrv);

        this.modalOpener = new ModalOpener($modal);

        this.artHistories = {};

        this.selectedPrivateArticles = [];

        this.statuses = EnumHelper.getKeys(ArticleStatus);

        this.sortPublicArticles = this.sortArticles.bind(this, true);
        this.sortPrivateArticles = this.sortArticles.bind(this, false);
        this.goToPage = this.goToArticlePage.bind(this);

        this.setCurrentUser(authSrv, this.initForm.bind(this), $state);
    }

    private sortArticles(forPublic: boolean, col: ColumnIndex) {
        if (forPublic)
            this.publicPagedQuery.sortItems(col, this.publicArtPages);
        else
            this.privatePagedQuery.sortItems(col, this.privateArtPages);
    }

    private goToArticlePage(pageIndex: number, forPublic: boolean) {
        if (forPublic)
            this.publicPagedQuery.goToPage(pageIndex);
        else
            this.privatePagedQuery.goToPage(pageIndex);
    }

    private initForm(userInfo: IUserInfo) {
        this.userInfo = userInfo;

        this.processRequest(this.articleReq.getAllArticles(), artData => {
            this.userNames = artData.userNames;
            this.estimates = artData.estimates;
            this.cmntNumber = artData.cmntNumber;

            if (this.userNames)
                this.userNames[this.userInfo.id] = this.userInfo.name;

            this.privateArticles = artData.privateData;
            this.privateArtPages = PagedQuery.getPageNumberArray(artData.privateDataCount, 
                artData.pageLength);

            this.privateQuery = {
                page: 1,
                colIndex: ColumnIndex.DATE,
                asc: false
            };
                        
            this.privatePagedQuery = new PagedQuery(this.privateQuery, 
                query => this.filterItems(false, query));

            if (this.hasAdminStatus()) {
                this.publicArticles = artData.publicData;
                this.publicArtPages = PagedQuery.getPageNumberArray(artData.publicDataCount, 
                    artData.pageLength);
                
                this.publicQuery = {
                    page: 1,
                    colIndex: ColumnIndex.DATE,
                    asc: false
                };

                this.publicPagedQuery = new PagedQuery(this.publicQuery, 
                    query => this.filterItems(true, query));
            }
        });
    }

    get userId(): number { return this.userInfo ? this.userInfo.id: 0; }

    removeArticle() {
        if (!confirm('You are going to remove these articles. Continue?'))
            return;

        const ids = this.selectedPrivateArticles.map(art => art.id);

        this.processRequest(this.articleReq.remove(ids), artData => {
            this.selectedPrivateArticles = [];
            this.privateArticles = artData.privateData;
            this.privateArtPages = PagedQuery
                .getPageNumberArray(artData.privateDataCount, artData.pageLength);

            this.privateQuery.page = 1;
            this.privateQuery.colIndex = ColumnIndex.NAME;
            this.privateQuery.asc = true;
        });
    }
    
    selectArticleRow(article: IArticle) {
        this.selectedArticle = this.selectedArticle && this.selectedArticle.id === article.id ? null : article;
    }

    filterArticles(forPublic: boolean) {
        (forPublic ? this.publicPagedQuery: this.privatePagedQuery).filterItems();
    }

    private filterItems(forPublic: boolean, filterQuery: IArticleSearch) {
        this.processRequest(this.articleReq.getAllArticles(filterQuery), artData => {
            this.selectedPrivateArticles = [];

            this.unionLists(this.userNames, artData.userNames);
            this.unionLists(this.estimates, artData.estimates);
            this.unionLists(this.cmntNumber, artData.cmntNumber);

            if (forPublic) {
                this.publicArticles = artData.publicData;
                this.publicArtPages =
                    PagedQuery.getPageNumberArray(artData.publicDataCount, artData.pageLength);
                Object.assign(this.publicQuery, filterQuery);
            }
            else {
                this.privateArticles = artData.privateData;
                this.privateArtPages = 
                    PagedQuery.getPageNumberArray(artData.privateDataCount, artData.pageLength);
                Object.assign(this.privateQuery, filterQuery);
            }
        });
    }

    private unionLists<T1 extends (string | number | symbol), T2>(
        target: Record<T1, T2>, source: Record<T1, T2>) {
        if (!target || !source)
            return;

        for (const prop in source) {
            if (!target[prop])
                target[prop] = source[prop];
        }
    }

    getUserName(userId: number): string {
        return this.userNames[userId];
    }
    
    getCommentCount(art: IArticle): number {
        return art ? this.cmntNumber[art.id] : 0;
    }
    
    getEstimate(art: IArticle, isPrivate: boolean): number {
        let est: number;

        if (this.estimates) {
            est = art ? (this.estimates[art.id] || 0) : 0;

            if (isPrivate)
                this.privateEstimate = est;
            else
                this.estimate = est;
        }

        return est;
    }

    isApproved(art: IArticle): boolean {
        return art ? art.status === ArticleStatus.APPROVED : false;
    }

    assignArticle(art: IArticle) {
        this.processRequest(this.articleReq.assign(art.id), () => {
            art.assignedToId = this.userInfo.id;
            art.status = ArticleStatus.ON_REVIEW;
        });
    }

    unassignArticle(art: IArticle) {
        this.processRequest(this.articleReq.unassign(art.id), () => {
            art.assignedToId = null;
            art.status = ArticleStatus.CREATED;
        });
    }

    isForAssign(): boolean {
        return this.selectedArticle && 
            this.selectedArticle.status == ArticleStatus.CREATED;
    }

    getArticleStatusCaption(artStatus: ArticleStatus): string {
        return this.articleReq.getStatusCaption(artStatus);
    }

    selectPrivateArticleRow(art: IArticle) {
        if (this.hasSelectedPrivateArticle(art.id))
            this.selectedPrivateArticles = this.selectedPrivateArticles.filter(a => a.id !== art.id);
        else
            this.selectedPrivateArticles.push(art);
    }

    hasSelectedPrivateArticle(id: number): boolean {
        return this.selectedPrivateArticles.some(val => val.id === id);
    }

    showHistory(art: IArticle) {
        const history = this.artHistories[art.id];

        if (history)
            this.openHistoryModal(history, art);
        else
            this.processRequest(this.historyReq.getHistory(art.id), history => {
                this.artHistories[art.id] = history;
                this.openHistoryModal(history, art);
            });
    };

    openHistoryModal(histories: IHistory[], art: IArticle) {
        this.processRequest(this.modalOpener.openArticleHistoryModal({
            histories: histories,
            articleName: art.name,
            isArticleApproved: this.isApproved(art)
        }));
    }
}

export { ArticleInfoCtrl };
