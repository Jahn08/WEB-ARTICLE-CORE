import * as angular from "angular";
import { StateService } from "@uirouter/core";
import { BaseCtrl } from "./baseCtrl";
import { ErrorService } from "../services/errorService";
import { ArticleRequest, IArticleSearch, IArticle } from "../services/api/articleRequest";
import { ColumnIndex, ISearchQuery } from "../services/api/apiRequest";
import { inject } from "../app/inject";
import { AppSystem } from "../app/system";
import * as $ from "jquery";

interface ISearchedArticle extends IArticle {
    author?: string;

    hashTags?: string[];
}

@inject(ErrorService, AppSystem.DEPENDENCY_TIMEOUT, AppSystem.DEPENDENCY_STATE, ArticleRequest)
class ArticleSearchCtrl extends BaseCtrl {
    
    // TODO: Tackle an empty row in the select featuring this dictionary
    public readonly columns: Record<number, string> = { 
        [ColumnIndex.NAME]: 'Name',
        [ColumnIndex.AUTHOR]: 'Author',
        [ColumnIndex.TAGS]: 'Tags',
        [ColumnIndex.TEXT]: 'Description',
        [ColumnIndex.DATE]: 'Date' 
    };

    public query: IArticleSearch;

    public pages: number[] = [1];

    public articles: ISearchedArticle[];

    public userNames: Record<number, string>;

    public categories: string[];

    public tags: string[];

    private readonly TAG_SEPARATOR = ' ';

    constructor(errorSrv: ErrorService,
        $timeout: angular.ITimeoutService,
        $state: StateService,
        private articleReq: ArticleRequest) {
        super(errorSrv);

        this.initCategoryControl();
    
        this.processRequest(articleReq.getDefaultCategories(), categories => {
            this.categories = categories;
    
            let category: string;
    
            const stateParams = $state.params;

            if ((category = stateParams['category']) && !this.categories.includes(category))
                this.categories.push(category);
    
            $timeout(function () {
                $('#categories').trigger("change");
            }, 0);

            this.query = {                  
                asc: false,
                page: 1,
                colIndex: ColumnIndex.DATE
            };

            const author = stateParams['author'];
            if (category || author) {
                this.query.author = author;

                this.tags = [category];

                this.search();
            }
        });
    }
    
    goToPage(index: number) {
        if (this.query.page === index)
            return;

        this.search(index);
    }

    search(pageIndex?: number) {
        if (!this.query || !this.query.page)
            return;

        const searchQuery = Object.assign({}, this.query);

        if (pageIndex)
            searchQuery.page = pageIndex;

        searchQuery.tags = this.tags.join(' ');

        this.processRequest(this.articleReq.search(searchQuery), data => {
            const pages = this.buildPageArray(data.articleCount, data.pageLength);
            this.pages = pages.length ? pages : [1];
            
            this.query.page = searchQuery.page;

            this.articles = data.articles;
            this.userNames = data.userNames;

            this.articles.forEach(val => {
                val.author = this.userNames ? this.userNames[val.authorId] : null;
                val.hashTags = val.tags.split(this.TAG_SEPARATOR);
            });
        });
    }

    private buildPageArray(dataLength: number, pageLength: number) {
        return new Array<number>(Math.ceil(dataLength / pageLength));
    }
}

export { ArticleSearchCtrl };
