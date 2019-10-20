var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define("app/system", ["require", "exports", "angular"], function (require, exports, angular) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class AppSystem {
        static get appModule() {
            return angular.module(this.APP_MODULE_NAME);
        }
    }
    exports.AppSystem = AppSystem;
    AppSystem.APP_MODULE_NAME = 'ArticleLibraryApp';
    AppSystem.DEPENDENCY_WINDOW = '$window';
    AppSystem.DEPENDENCY_RESOURCE = '$resource';
    AppSystem.DEPENDENCY_STATE = '$state';
    AppSystem.DEPENDENCY_COOKIES = '$cookies';
    class Constants {
    }
    exports.Constants = Constants;
    Constants.NO_PHOTO_FILE_URL = 'images/noPhoto.png';
    Constants.MODAL_CLICK_MSG = 'backdrop';
});
define("services/api/apiRequest", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ApiRequest {
        constructor($resource, controllerName) {
            this.$resource = $resource;
            this.controllerName = controllerName;
        }
        get baseUrl() {
            return this.combinePaths('api', this.controllerName);
        }
        combinePaths(pathA, pathB) {
            return pathA + (pathB ? '/' + pathB : '');
        }
        getResource(params, path = '') {
            return this.$resource(this.getCombinedPath(path)).get(params).$promise;
        }
        getCombinedPath(path) {
            return this.combinePaths(this.baseUrl, path);
        }
        saveResource(params, path = '') {
            return this.$resource(this.getCombinedPath(path)).save(params).$promise;
        }
        removeResource(params, path = '') {
            return this.$resource(this.getCombinedPath(path)).remove(params).$promise;
        }
    }
    exports.ApiRequest = ApiRequest;
    var ColumnIndex;
    (function (ColumnIndex) {
        ColumnIndex[ColumnIndex["NAME"] = 0] = "NAME";
        ColumnIndex[ColumnIndex["AUTHOR"] = 1] = "AUTHOR";
        ColumnIndex[ColumnIndex["TAGS"] = 2] = "TAGS";
        ColumnIndex[ColumnIndex["ASSIGNED_TO"] = 3] = "ASSIGNED_TO";
        ColumnIndex[ColumnIndex["STATUS"] = 4] = "STATUS";
        ColumnIndex[ColumnIndex["TEXT"] = 5] = "TEXT";
        ColumnIndex[ColumnIndex["ID"] = 6] = "ID";
        ColumnIndex[ColumnIndex["DATE"] = 7] = "DATE";
        ColumnIndex[ColumnIndex["ARTICLE"] = 8] = "ARTICLE";
    })(ColumnIndex || (ColumnIndex = {}));
    exports.ColumnIndex = ColumnIndex;
});
define("services/api/userRequest", ["require", "exports", "services/api/apiRequest"], function (require, exports, apiRequest_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class UserRequest extends apiRequest_1.ApiRequest {
        constructor($resource) {
            super($resource, 'UserInfo');
        }
        getUserInfo(userId, getPhoto) {
            return this.getResource({ userId, getPhoto });
        }
        getUsers(query) {
            return this.getResource(query, 'All');
        }
        setUserStatus(userId, status) {
            return this.saveResource({
                userId: userId,
                status: status
            }, 'Status');
        }
        getStatusCaption(status) {
            return status === UserStatus.USER ? 'user' :
                (status === UserStatus.ADMINISTRATOR ? 'administrator' : 'banned');
        }
        saveUserInfo(userInfo) {
            return this.saveResource(userInfo);
        }
        confirmEmail(confirmationId) {
            return this.getResource(confirmationId, 'ConfirmEmail');
        }
        resetPassword(email) {
            return this.getResource(email, 'ResetPassword');
        }
        replacePassword(newPassword, confirmationId) {
            return this.saveResource({ newPassword, confirmationId }, 'ReplacePassword');
        }
    }
    exports.UserRequest = UserRequest;
    var UserStatus;
    (function (UserStatus) {
        UserStatus[UserStatus["USER"] = 0] = "USER";
        UserStatus[UserStatus["BANNED"] = 1] = "BANNED";
        UserStatus[UserStatus["ADMINISTRATOR"] = 5] = "ADMINISTRATOR";
    })(UserStatus || (UserStatus = {}));
});
define("app/inject", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function inject(...dependencies) {
        return (constructor) => {
            constructor.$inject = dependencies.map(d => typeof d === 'string' ? d : d.name);
        };
    }
    exports.inject = inject;
});
define("services/authService", ["require", "exports", "services/api/userRequest", "app/inject"], function (require, exports, userRequest_1, inject_1) {
    "use strict";
    var AuthService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    let AuthService = AuthService_1 = class AuthService {
        constructor($window, userReq, $cookies, $state) {
            this.$window = $window;
            this.userReq = userReq;
            this.$cookies = $cookies;
            this.$state = $state;
        }
        getCurrentUser(getPhoto = false) {
            return new Promise((resolve, reject) => {
                if (!this.$cookies.get(AuthService_1.AUTH_COOKIE)) {
                    this.logOut();
                    resolve(0);
                }
                else {
                    const user = this.$window.localStorage.getItem(AuthService_1.AUTH_COOKIE);
                    if (user)
                        resolve(JSON.parse(user));
                    else {
                        this.userReq.getUserInfo(null, getPhoto).then(data => {
                            this.logIn(data);
                            resolve(data);
                        }).catch(reason => {
                            if (reason.status === 401) {
                                this.logOut();
                                resolve(0);
                            }
                            else
                                reject(reason);
                        });
                    }
                }
            });
        }
        logOut() {
            this.$cookies.remove(AuthService_1.AUTH_COOKIE, { path: '/' });
            this.$window.localStorage.removeItem(AuthService_1.AUTH_USER_ITEM);
        }
        logIn(data, force = false) {
            if (!this.$window.localStorage.getItem(AuthService_1.AUTH_COOKIE) || force)
                this.$window.localStorage.setItem(AuthService_1.AUTH_COOKIE, JSON.stringify(data));
        }
        reloadState() {
            this.$state.reload();
        }
    };
    AuthService.AUTH_USER_ITEM = 'CurrentUser';
    AuthService.AUTH_COOKIE = 'Auth_Id';
    AuthService = AuthService_1 = __decorate([
        inject_1.inject('$window', userRequest_1.UserRequest, '$cookies', '$state')
    ], AuthService);
    exports.AuthService = AuthService;
});
define("app/configurator", ["require", "exports", "app/system", "angular", "services/authService"], function (require, exports, system_1, angular, authService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    angular.module(system_1.AppSystem.APP_MODULE_NAME, ['ui.router', 'ui.bootstrap', 'ngResource', 'ngCookies', 'ngSanitize'])
        .config(($stateProvider, $urlRouterProvider, $locationProvider) => {
        $locationProvider.hashPrefix('');
        $stateProvider.state('app', {
            url: '/',
            views: {
                'header': {
                    templateUrl: 'views/Header.html',
                    controller: 'HeaderCtrl'
                },
                'content': {
                    templateUrl: 'views/Home.html',
                    controller: "HomeCtrl"
                },
                'footer': {
                    templateUrl: 'views/Footer.html',
                    controller: "FooterCtrl"
                }
            },
            resolve: {
                section: function () {
                    return 'app';
                }
            }
        })
            .state('app.confirmuser', {
            url: 'confirmuser/:id',
            views: {
                'content@': {
                    template: '<span ng-class="{\'text-success\':!error, \'text-danger\':error}">{{ConfirmationStateMsg}}</span>',
                    controller: 'UserConfirmationCtrl'
                }
            }
        })
            .state('app.confirmemail', {
            url: 'confirmemail/:id',
            views: {
                'content@': {
                    template: '<span ng-class="{\'text-success\':!error, \'text-danger\':error}">{{ConfirmationStateMsg}}</span>',
                    controller: 'EmailConfirmationCtrl'
                }
            }
        })
            .state('app.afterregistration', {
            url: 'afterregistration',
            views: {
                'content@': {
                    template: '<span class="text-info">A message with a confirmation link was sent to your email.' +
                        'Please, activate your account through the link until it gets expired</span>'
                }
            }
        })
            .state('app.aftermarkingpasswordforresetting', {
            url: 'aftermarkingpasswordforresetting',
            views: {
                'content@': {
                    template: '<span class="text-info">A message with a confirmation link was sent to your email.' +
                        'Please, reset your current password through the link until it gets expired</span>'
                }
            }
        })
            .state('app.userinfo', {
            url: 'userinfo',
            views: {
                'content@': {
                    templateUrl: 'views/UserInfo.html',
                    controller: 'UserInfoCtrl'
                }
            },
            data: {
                secure: true
            }
        })
            .state('app.complaintinfo', {
            url: 'complaintinfo',
            views: {
                'content@': {
                    templateUrl: 'views/ComplaintInfo.html',
                    controller: 'ComplaintInfoCtrl'
                }
            },
            data: {
                secure: true
            }
        })
            .state('app.articleinfo', {
            url: 'articleinfo',
            views: {
                'content@': {
                    templateUrl: 'views/ArticleInfo.html',
                    controller: 'ArticleInfoCtrl'
                }
            },
            data: {
                secure: true
            }
        })
            .state('app.commentinfo', {
            url: 'commentinfo',
            views: {
                'content@': {
                    templateUrl: 'views/CommentInfo.html',
                    controller: 'CommentInfoCtrl'
                }
            },
            data: {
                secure: true
            }
        })
            .state('app.estimateinfo', {
            url: 'estimateinfo',
            views: {
                'content@': {
                    templateUrl: 'views/EstimateInfo.html',
                    controller: 'EstimateInfoCtrl'
                }
            },
            data: {
                secure: true
            }
        })
            .state('app.properties', {
            url: 'properties/:confirmEmail',
            views: {
                'content@': {
                    templateUrl: 'views/Properties.html',
                    controller: 'PropertiesCtrl'
                }
            },
            data: {
                secure: true
            }
        })
            .state('app.resetpassword', {
            url: 'resetpassword/:id',
            views: {
                'content@': {
                    templateUrl: 'views/ResetPassword.html',
                    controller: 'ResetPasswordCtrl'
                }
            }
        })
            .state('app.aboutus', {
            url: "aboutus",
            views: {
                'content@': {
                    templateUrl: 'views/AboutUs.html',
                    controller: 'AboutUsCtrl'
                },
                'header@': {
                    templateUrl: 'views/Header.html',
                    controller: 'HeaderCtrl',
                }
            },
            resolve: {
                section: function () {
                    return "aboutus";
                }
            }
        })
            .state('app.articleedit', {
            url: "editarticle/:id/:category",
            views: {
                'content@': {
                    templateUrl: 'views/ArticleEdit.html',
                    controller: 'ArticleEditCtrl'
                },
                'header@': {
                    templateUrl: 'views/Header.html',
                    controller: 'HeaderCtrl',
                }
            },
            data: {
                secure: true
            },
            resolve: {
                section: function ($stateParams) {
                    return $stateParams.id ? 'app' : 'createarticle';
                }
            }
        })
            .state('app.articleview', {
            url: "viewarticle/:id/:commentId/:historyId",
            views: {
                'content@': {
                    templateUrl: 'views/ArticleView.html',
                    controller: 'ArticleViewCtrl'
                }
            }
        })
            .state('app.articlesearch', {
            url: "searcharticle/:category/:author",
            views: {
                'content@': {
                    templateUrl: 'views/ArticleSearch.html',
                    controller: "ArticleSearchCtrl"
                },
                'header@': {
                    templateUrl: 'views/Header.html',
                    controller: 'HeaderCtrl',
                }
            },
            resolve: {
                section: function ($stateParams) {
                    return $stateParams.category || 'searcharticle';
                }
            }
        });
        $urlRouterProvider.otherwise('/');
    }).run(['$state', '$rootScope', authService_1.AuthService.name, function ($state, $rootScope, authService) {
            $rootScope.$on('$stateChangeStart', function (event, toState) {
                if (toState.data && toState.data.secure) {
                    authService.getCurrentUser().then(outcome => {
                        if (outcome === 0) {
                            event.preventDefault();
                            $state.transitionTo('app', null, {
                                reload: true, inherit: false, notify: true
                            });
                        }
                    });
                }
            });
        }]);
});
define("directives/directiveFactory", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class DirectiveFactory {
        static clickDisabled() {
            return {
                restrict: DirectiveFactory.ATTRIBUTE_RESTRICTION,
                scope: {
                    disabled: '=clickDisabled'
                },
                link: (scope, el) => {
                    el.on('click', () => !scope.disabled);
                }
            };
        }
        static limitedVal() {
            return {
                restrict: DirectiveFactory.ELEMENT_RESTRICTION,
                scope: {
                    value: '=',
                    length: '='
                },
                template: '<div title="{{value}}">{{value|limitToFormat:length}}</div>'
            };
        }
        static sortBtn() {
            return {
                restrict: DirectiveFactory.ELEMENT_RESTRICTION,
                scope: {
                    name: '=',
                    asc: '=',
                    colIndex: '=',
                    fnClick: '=',
                    curColIndex: '='
                },
                templateUrl: 'views/directives/SortBtn.html'
            };
        }
        static pagination() {
            return {
                restrict: DirectiveFactory.ELEMENT_RESTRICTION,
                scope: {
                    pages: '=',
                    curPage: '=',
                    fnNextPage: '=',
                    addParam: '='
                },
                templateUrl: 'views/directives/Pagination.html'
            };
        }
        static breadcrumb() {
            return {
                restrict: DirectiveFactory.ELEMENT_RESTRICTION,
                scope: {
                    links: '='
                },
                link: (scope) => {
                    scope.states = scope.links.split('|').map(v => {
                        const vals = v.split(':');
                        return { name: vals[0], state: vals.length > 1 ? vals[1] : null };
                    });
                },
                templateUrl: 'views/directives/Breadcrumb.html'
            };
        }
        static loading() {
            return {
                restrict: DirectiveFactory.ELEMENT_RESTRICTION,
                scope: {
                    msg: '=',
                    isError: '=',
                    sending: '='
                },
                templateUrl: 'views/directives/Loading.html'
            };
        }
    }
    exports.DirectiveFactory = DirectiveFactory;
    DirectiveFactory.ATTRIBUTE_RESTRICTION = 'A';
    DirectiveFactory.ELEMENT_RESTRICTION = 'E';
});
define("directives/configurator", ["require", "exports", "directives/directiveFactory", "app/system"], function (require, exports, directiveFactory_1, system_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const appModule = system_2.AppSystem.appModule;
    [directiveFactory_1.DirectiveFactory.loading, directiveFactory_1.DirectiveFactory.breadcrumb, directiveFactory_1.DirectiveFactory.clickDisabled,
        directiveFactory_1.DirectiveFactory.limitedVal, directiveFactory_1.DirectiveFactory.pagination, directiveFactory_1.DirectiveFactory.sortBtn]
        .forEach(func => appModule.directive(func.name, func));
});
define("filters/limitToFormat", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function limitToFormat() {
        return function (input, length) {
            input = input || '';
            return input.length > length ? input.substr(0, length) + '...' : input;
        };
    }
    exports.limitToFormat = limitToFormat;
});
define("filters/configurator", ["require", "exports", "filters/limitToFormat", "app/system"], function (require, exports, limitToFormat_1, system_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    system_3.AppSystem.appModule.filter('limitToFormat', limitToFormat_1.limitToFormat);
});
define("services/api/authRequest", ["require", "exports", "services/api/apiRequest"], function (require, exports, apiRequest_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class AuthRequest extends apiRequest_2.ApiRequest {
        constructor($resource) {
            super($resource, 'Authentication');
        }
        logOut() {
            return this.getResource(undefined, 'LogOut');
        }
        logIn(userData) {
            return this.saveResource(userData, 'LogIn');
        }
        register(userData) {
            return this.saveResource(userData, 'Register');
        }
        confirm(confirmationId) {
            return this.getResource(confirmationId, 'Confirm');
        }
    }
    exports.AuthRequest = AuthRequest;
});
define("services/api/contactRequest", ["require", "exports", "services/api/apiRequest"], function (require, exports, apiRequest_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ContactRequest extends apiRequest_3.ApiRequest {
        constructor($resource) {
            super($resource, 'ContactInfo');
        }
        getBasicInfo() {
            return this.getResource();
        }
        getAboutUsInfo() {
            return this.getResource(undefined, 'AboutUs');
        }
    }
    exports.ContactRequest = ContactRequest;
});
define("services/errorService", ["require", "exports", "services/authService", "app/inject"], function (require, exports, authService_2, inject_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ErrorService = class ErrorService {
        constructor(authService) {
            this.authService = authService;
        }
        formatError(msg, data) {
            return this.formatMessage(msg) + data;
        }
        formatMessage(msg) {
            return msg ? msg + ': ' : '';
        }
        processError(msg, data) {
            if (data.status === 401) {
                this.authService.logOut();
                this.authService.reloadState();
                return;
            }
            const outcome = this.formatMessage(msg);
            let status = `status: '${data.statusText ? data.statusText : data.status}'`;
            if (data.status !== 500)
                status += `, reason: '${data.data ? data.data : data}'`;
            return outcome + status;
        }
    };
    ErrorService = __decorate([
        inject_2.inject(authService_2.AuthService)
    ], ErrorService);
    exports.ErrorService = ErrorService;
});
define("services/converterService", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ConverterService {
        strToBytes(content) {
            return btoa(unescape(encodeURIComponent(content)));
        }
        bytesToStr(content) {
            return decodeURIComponent(escape(atob(content)));
        }
    }
    exports.ConverterService = ConverterService;
});
define("services/api/commentRequest", ["require", "exports", "services/api/apiRequest", "services/converterService", "app/inject"], function (require, exports, apiRequest_4, converterService_1, inject_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let CommentRequest = class CommentRequest extends apiRequest_4.ApiRequest {
        constructor($resource, converter) {
            super($resource, 'Comment');
            this.converter = converter;
        }
        create(comment) {
            comment.content = this.converter.strToBytes(comment.content);
            return this.saveResource(comment);
        }
        getComments(query) {
            return this.getResource(query);
        }
        updateStatus(commentId, status) {
            return this.saveResource({ id: commentId, status }, 'Status');
        }
        getStatusCaption(status) {
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
    };
    CommentRequest = __decorate([
        inject_3.inject('$resource', converterService_1.ConverterService)
    ], CommentRequest);
    exports.CommentRequest = CommentRequest;
    var CommentStatus;
    (function (CommentStatus) {
        CommentStatus[CommentStatus["CREATED"] = 1] = "CREATED";
        CommentStatus[CommentStatus["BLOCKED"] = 6] = "BLOCKED";
        CommentStatus[CommentStatus["DELETED"] = 7] = "DELETED";
    })(CommentStatus || (CommentStatus = {}));
});
define("services/api/estimateRequest", ["require", "exports", "services/api/apiRequest"], function (require, exports, apiRequest_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class EstimateRequest extends apiRequest_5.ApiRequest {
        constructor($resource) {
            super($resource, 'Estimate');
        }
        assessArticle(articleId, estimate) {
            return this.saveResource({ id: articleId, estimate });
        }
        getEstimates(query) {
            return this.getResource(query);
        }
        getTypeCaption(estimate) {
            switch (estimate) {
                case EstimateType.NEGATIVE:
                    return 'negative';
                case EstimateType.POSITIVE:
                    return 'positive';
                default:
                    return 'none';
            }
        }
    }
    exports.EstimateRequest = EstimateRequest;
    var EstimateType;
    (function (EstimateType) {
        EstimateType[EstimateType["NONE"] = 0] = "NONE";
        EstimateType[EstimateType["POSITIVE"] = 1] = "POSITIVE";
        EstimateType[EstimateType["NEGATIVE"] = 2] = "NEGATIVE";
    })(EstimateType || (EstimateType = {}));
    exports.EstimateType = EstimateType;
});
define("services/api/articleRequest", ["require", "exports", "services/api/apiRequest", "app/inject", "services/converterService"], function (require, exports, apiRequest_6, inject_4, converterService_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ArticleRequest = class ArticleRequest extends apiRequest_6.ApiRequest {
        constructor($resource, $window, converter) {
            super($resource, 'Article');
            this.$window = $window;
            this.converter = converter;
        }
        update(article, tempTags) {
            if (article.status !== ArticleStatus.ON_EDIT &&
                article.status !== ArticleStatus.ON_REVIEW &&
                article.status !== ArticleStatus.ON_AMENDING)
                article.reviewedContent = null;
            else
                article.reviewedContent = this.converter.strToBytes(article.reviewedContent);
            article.content = this.converter.strToBytes(article.content);
            article.tags = tempTags.join(' ');
            return this.saveResource(article);
        }
        createVersion(articleId) {
            return this.getResource(articleId, 'NewVersion');
        }
        remove(articleIds) {
            return this.removeResource(articleIds);
        }
        getAllArticles(query) {
            return this.searching(query, 'All');
        }
        searching(query, methodName) {
            return this.getResource(query, methodName);
        }
        search(query) {
            return this.searching(query);
        }
        getDefaultCategories() {
            const methodName = 'Categories';
            const tagStr = this.$window.localStorage.getItem(methodName);
            return new Promise((resolve, reject) => {
                if (tagStr)
                    resolve(JSON.parse(tagStr));
                else
                    this.getResource(undefined, methodName).then(data => {
                        this.$window.localStorage.setItem(methodName, JSON.stringify(data));
                        resolve(data);
                    }).catch(err => reject(err));
            });
        }
        getArticleTitles() {
            return this.getResource(undefined, 'Titles');
        }
        view(articleId, userId) {
            return this.getResource(userId, articleId.toString());
        }
        getStatusCaption(status) {
            switch (status) {
                case ArticleStatus.DRAFT:
                    return 'draft';
                case ArticleStatus.CREATED:
                    return 'created';
                case ArticleStatus.ON_REVIEW:
                    return 'on review';
                case ArticleStatus.ON_EDIT:
                    return 'on edit';
                case ArticleStatus.APPROVED:
                    return 'approved';
                case ArticleStatus.ON_AMENDING:
                    return 'on amending';
                default:
                    return 'none';
            }
        }
        assign(articleId) {
            return this.setArticleAssignment(articleId, true);
        }
        setArticleAssignment(id, shouldAssign) {
            return this.saveResource({ id: id, assign: shouldAssign }, 'Assignment');
        }
        unassign(articleId) {
            return this.setArticleAssignment(articleId, false);
        }
    };
    ArticleRequest = __decorate([
        inject_4.inject('$resource', '$window', converterService_2.ConverterService)
    ], ArticleRequest);
    exports.ArticleRequest = ArticleRequest;
    var ArticleStatus;
    (function (ArticleStatus) {
        ArticleStatus[ArticleStatus["DRAFT"] = 0] = "DRAFT";
        ArticleStatus[ArticleStatus["CREATED"] = 1] = "CREATED";
        ArticleStatus[ArticleStatus["ON_REVIEW"] = 2] = "ON_REVIEW";
        ArticleStatus[ArticleStatus["ON_EDIT"] = 3] = "ON_EDIT";
        ArticleStatus[ArticleStatus["APPROVED"] = 4] = "APPROVED";
        ArticleStatus[ArticleStatus["REFUSED"] = 5] = "REFUSED";
        ArticleStatus[ArticleStatus["BLOCKED"] = 6] = "BLOCKED";
        ArticleStatus[ArticleStatus["DELETED"] = 7] = "DELETED";
        ArticleStatus[ArticleStatus["ON_AMENDING"] = 8] = "ON_AMENDING";
    })(ArticleStatus || (ArticleStatus = {}));
});
define("services/api/notificationRequest", ["require", "exports", "services/api/apiRequest"], function (require, exports, apiRequest_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class NotificationRequest extends apiRequest_7.ApiRequest {
        constructor($resource) {
            super($resource, 'Notification');
        }
        get(userId) {
            return this.getResource(userId);
        }
        clear(notificationIds) {
            return this.removeResource(notificationIds);
        }
    }
    exports.NotificationRequest = NotificationRequest;
});
define("services/api/historyRequest", ["require", "exports", "services/api/apiRequest"], function (require, exports, apiRequest_8) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class HistoryRequest extends apiRequest_8.ApiRequest {
        constructor($resource) {
            super($resource, 'History');
        }
        getHistory(articleId) {
            return this.getResource(articleId);
        }
    }
    exports.HistoryRequest = HistoryRequest;
    var HistoryObjectType;
    (function (HistoryObjectType) {
        HistoryObjectType[HistoryObjectType["ARTICLE"] = 0] = "ARTICLE";
        HistoryObjectType[HistoryObjectType["AMENDMENT"] = 1] = "AMENDMENT";
        HistoryObjectType[HistoryObjectType["COMMENT"] = 2] = "COMMENT";
    })(HistoryObjectType || (HistoryObjectType = {}));
});
define("services/api/amendmentRequest", ["require", "exports", "services/api/apiRequest"], function (require, exports, apiRequest_9) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class AmmendmentRequest extends apiRequest_9.ApiRequest {
        constructor($resource) {
            super($resource, 'Amendment');
        }
        getAmendments(articleId) {
            return this.getResource(articleId);
        }
        update(amendments) {
            return this.saveResource(amendments);
        }
        remove(amendmentIds) {
            return this.removeResource(amendmentIds);
        }
        create(amendment) {
            return this.saveResource(amendment, 'New');
        }
    }
    exports.AmmendmentRequest = AmmendmentRequest;
});
define("services/api/complaintRequest", ["require", "exports", "services/api/apiRequest"], function (require, exports, apiRequest_10) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ComplaintRequest extends apiRequest_10.ApiRequest {
        constructor($resource) {
            super($resource, 'Complaint');
        }
        create(complaint) {
            return this.saveResource(complaint);
        }
        getComplaints(query) {
            return this.getResource(query);
        }
        setComplaintStatus(complaintId, status, response) {
            return this.saveResource({
                id: complaintId,
                status,
                response
            }, 'Status');
        }
        assign(complaintId) {
            return this.setAssignment(complaintId, true);
        }
        setAssignment(complaintId, shouldAssign) {
            return this.saveResource({ id: complaintId, assign: shouldAssign }, 'Assignment');
        }
        unassign(complaintId) {
            return this.setAssignment(complaintId, false);
        }
        // getComplaintEntityTypeEnum: function() {
        //     return [{value: 0, name:"comment"},
        //         {value: 1, name: "article"}];
        // },
        getComplaintStatusCaption(status) {
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
    }
    exports.ComplaintRequest = ComplaintRequest;
    var ComplaintStatus;
    (function (ComplaintStatus) {
        ComplaintStatus[ComplaintStatus["CREATED"] = 1] = "CREATED";
        ComplaintStatus[ComplaintStatus["APPROVED"] = 4] = "APPROVED";
        ComplaintStatus[ComplaintStatus["REFUSED"] = 5] = "REFUSED";
    })(ComplaintStatus || (ComplaintStatus = {}));
    var ComplaintEntityType;
    (function (ComplaintEntityType) {
        ComplaintEntityType[ComplaintEntityType["COMMENT"] = 0] = "COMMENT";
        ComplaintEntityType[ComplaintEntityType["ARTICLE"] = 1] = "ARTICLE";
    })(ComplaintEntityType || (ComplaintEntityType = {}));
});
define("services/configurator", ["require", "exports", "services/api/userRequest", "services/api/authRequest", "services/api/contactRequest", "services/authService", "services/errorService", "services/converterService", "services/api/articleRequest", "services/api/notificationRequest", "services/api/historyRequest", "services/api/amendmentRequest", "services/api/commentRequest", "services/api/estimateRequest", "services/api/complaintRequest", "app/system"], function (require, exports, userRequest_2, authRequest_1, contactRequest_1, authService_3, errorService_1, converterService_3, articleRequest_1, notificationRequest_1, historyRequest_1, amendmentRequest_1, commentRequest_1, estimateRequest_1, complaintRequest_1, system_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const services = [authService_3.AuthService, errorService_1.ErrorService, userRequest_2.UserRequest,
        authRequest_1.AuthRequest, contactRequest_1.ContactRequest, converterService_3.ConverterService, articleRequest_1.ArticleRequest,
        notificationRequest_1.NotificationRequest, historyRequest_1.HistoryRequest, amendmentRequest_1.AmmendmentRequest, commentRequest_1.CommentRequest,
        estimateRequest_1.EstimateRequest, complaintRequest_1.ComplaintRequest];
    const module = system_4.AppSystem.appModule;
    services.forEach(srv => module.service(srv.name, srv));
});
//# sourceMappingURL=app.js.map