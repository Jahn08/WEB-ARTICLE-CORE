import { AppSystem } from './system';
import * as angular from 'angular';
import * as router from 'angular-ui-router';
import { AuthService } from '../services/authService';

angular.module(AppSystem.APP_MODULE_NAME, 
        ['ui.router', 'ui.bootstrap', 'ngResource', 'ngCookies', 'ngSanitize'])
    .config(($stateProvider: router.IStateProvider, 
        $urlRouterProvider: router.IUrlRouterProvider, 
        $locationProvider: angular.ILocationProvider) => {
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
    }).run(['$state', '$rootScope', AuthService.name, function ($state: router.IStateService, 
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
