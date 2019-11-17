import { ErrorService } from "../services/errorService";
import { inject } from "../app/inject";
import { BaseCtrl } from "./baseCtrl";
import { AppSystem } from "../app/system";
import { AuthService } from "../services/authService";
import { ArticleRequest, IArticle } from "../services/api/articleRequest";
import { IUserInfo } from "../services/api/userRequest";
import * as angular from "angular";
import * as $ from "jquery";

@inject(AuthService, ErrorService, AppSystem.DEPENDENCY_TIMEOUT, ArticleRequest)
class HomeCtrl extends BaseCtrl {
    public userInfo: IUserInfo;

    public slides: ISlide[];

    private userNames: Record<number, string>;

    constructor(authSrv: AuthService, errorSrv: ErrorService, 
        private $timeout: angular.ITimeoutService, 
        private articlReq: ArticleRequest) { 
        super(errorSrv);

        this.slides = [];

        this.processRequest(authSrv.getCurrentUser(), 
            outcome => this.setUserInfo(outcome as IUserInfo));
    }
    
    public getUserName(userId: number) {
        return this.userNames ? this.userNames[userId] : null;
    }

    private setUserInfo(userInfo: IUserInfo) {
        this.articlReq.getArticleTitles().then(artData => {
            this.userInfo = userInfo;

            this.articlReq.getDefaultCategories().then(categories => {
                this.userNames = artData.userNames;

                if (artData.articles.length <= 3) {
                    for (let i = 0; i < 3; ++i) {
                        const item = artData.articles[i];

                        const category = item ? this.getCategory(item.tags, categories) : 
                            categories[this.getRandomInt(0, categories.length - 1)];

                        this.slides.push({
                            article: item,
                            index: this.getRandomInt(1, 3),
                            category
                        });
                    }
                }
                else {
                    const step = artData.articles.length / 3;

                    for (let i = 0; i < 3; ++i) {
                        const item = artData.articles[i];

                        this.slides.push({
                            article: item,
                            index: this.getRandomInt(i+1, 
                                (i == 2 ? artData.articles.length : i + step) - 1),
                            category: this.getCategory(item.tags, categories)
                        });
                    }
                }

                this.$timeout(() => { 
                    $('#slides').carousel(); 
                }, 0);
            });
        })
    }

    private getRandomInt(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    private getCategory(tags: string, categories: string[]) {
        return categories.find(cat =>
            tags.toLowerCase().split(' ').indexOf(cat.toLowerCase()) != -1)
    }
}

interface ISlide {
    article: IArticle;

    index: number;

    category: string;
}

export { HomeCtrl };
