import { AppSystem, Constants } from './system';
import * as angular from 'angular';
import { StateProvider, UrlRouterProvider, StateService, StateParams } from '@uirouter/angularjs';
import { AuthService } from '../services/authService';
import { HeaderCtrl } from '../controllers/headerCtrl';
import { HomeCtrl } from '../controllers/homeCtrl';
import { FooterCtrl } from '../controllers/footerCtrl';
import { AboutUsCtrl } from '../controllers/aboutUsCtrl';
import { ArticleSearchCtrl } from '../controllers/articleSearchCtrl';

angular.module(AppSystem.APP_MODULE_NAME, 
        ['ui.router', 'ui.bootstrap', 'ngResource', 'ngCookies', 'ngSanitize'])
    .config(($stateProvider: StateProvider, 
        $urlRouterProvider: UrlRouterProvider, 
        $locationProvider: angular.ILocationProvider) => {
            $locationProvider.hashPrefix('');

			$stateProvider.state('app', {
				url: '/',
				views: {
					'header': {
						templateUrl: 'views/Header.html',
                        controller: HeaderCtrl,
                        controllerAs: Constants.CONTROLLER_PSEUDONIM
					},
					'content': {
						templateUrl: 'views/Home.html',
                        controller: HomeCtrl,
                        controllerAs: Constants.CONTROLLER_PSEUDONIM
					},
					'footer': {
						templateUrl: 'views/Footer.html',
                        controller: FooterCtrl,
                        controllerAs: Constants.CONTROLLER_PSEUDONIM
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
                        controller: AboutUsCtrl,
                        controllerAs: Constants.CONTROLLER_PSEUDONIM
					},
					'header@': {
						templateUrl: 'views/Header.html',
                        controller: HeaderCtrl,
                        controllerAs: Constants.CONTROLLER_PSEUDONIM
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
						return $stateParams.id ? 'app': 'createarticle';
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
						controller: ArticleSearchCtrl,
                        controllerAs: Constants.CONTROLLER_PSEUDONIM
					},
					'header@': {
						templateUrl: 'views/Header.html',
						controller: HeaderCtrl,
                        controllerAs: Constants.CONTROLLER_PSEUDONIM
					}
				},
				resolve: {
					section: function ($stateParams: StateParams) {
						return $stateParams.category || 'searcharticle';
					}
				}
			});

			$urlRouterProvider.otherwise('/');
    }).run([AppSystem.DEPENDENCY_STATE, AppSystem.DEPENDENCY_ROOT_SCOPE_SERVICE, AuthService.name, 
        function ($state: StateService, 
            $rootScope: angular.IRootScopeService,
            authService: AuthService) {
        $rootScope.$on('$stateChangeStart', function(event, toState) { 

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
