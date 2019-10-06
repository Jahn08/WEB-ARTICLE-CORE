(function () {
	'use strict';

	angular.module('ArticleLibraryApp')
		.constant('authUserItem', { authUser: 'CurrentUser' })
		.constant('baseUrl', 'api/')
		.service('AuthService', ['$window', 'authUserItem', 'UserReqFactory', '$cookies', '$q', '$state',
			function ($window, authUserItem, UserReqFactory, $cookies, $q, $state) {
				var obj = this;
				const authCookie = 'Auth_Id';

				this.getCurrentUser = function (getPhoto) {				
					var deferred = $q.defer();

                    if (!$cookies.get(authCookie)) {
						obj.logOut();
						deferred.resolve(0);
					}
					else {
						var user = $window.localStorage.getItem(authUserItem.authUser);

						if (!user) {
							UserReqFactory.getUserInfo(null, getPhoto).then(function (data) {
								obj.logIn(data);
								deferred.resolve(data);
							}, function (data) {
								if (data.status == 401) {
									obj.logOut();
									deferred.resolve(0);
								}
								else
									deferred.reject(data);
							});
						}
						else
							deferred.resolve(JSON.parse(user));
					}
					
					return deferred.promise;
				};

				this.logIn = function (data, force) {
					if (!$window.localStorage.getItem(authUserItem.authUser) || force)
						$window.localStorage.setItem(authUserItem.authUser, JSON.stringify(data));
				};

				this.logOut = function () {
					$cookies.remove(authCookie, { path: '/'});
					$window.localStorage.removeItem(authUserItem.authUser);
                };

                this.reloadState = function () {
                    $state.reload();
                };
			}])
		.service('ErrorService', ['AuthService', function (AuthService) {
			this.processError = function (msg, data) {
				if (data.status === 401) {
					AuthService.logOut();
                    AuthService.reloadState();
 
                    return;
                }

                const outcome = msg ? msg + ': ' : '';

                if (typeof data === 'string')
                    return outcome + data;

                let status = `status: '${data.statusText ? data.statusText: data.status}'`;
                
                if (data.status !== 500)
                    status += `, reason: '${data.data ? data.data : data}'`;

				return outcome + status;
			};
		}])
		.factory('AuthReqFactory', ['$resource', 'baseUrl', function ($resource, baseUrl) {
			var obj = {};

			obj.logOut = function () {
				return $resource(baseUrl + 'Authentication/LogOut').get().$promise;
			};

			obj.logIn = function (userData) {
				return $resource(baseUrl + 'Authentication/LogIn').save(userData).$promise;
			};

			obj.register = function (regData) {
				return $resource(baseUrl + 'Authentication/Register').save(regData).$promise;
			};

			obj.confirm = function (confirmationId) {
				return $resource(baseUrl + 'Authentication/Confirm').get({
					confirmationId: confirmationId
				}).$promise;
			};

			return obj;
		}])
	.factory('InfoReqFactory', ['$resource', 'baseUrl', function ($resource, baseUrl) {
		var obj = {
			getBasicInfo: function() {
				return $resource(baseUrl + 'ContactInfo').get().$promise;
			},
			getAboutUsInfo: function() {
				return $resource(baseUrl + 'ContactInfo/AboutUs').get().$promise;
			}
		};

		return obj;
	}])
	.factory('UserReqFactory', ['$resource', 'baseUrl', function ($resource, baseUrl) {
		var obj = {

			getUserInfo: function(userId, getPhoto) {
                return $resource(baseUrl + 'UserInfo')
                    .get({ userId: (userId ? userId : ''), getPhoto: getPhoto == true }).$promise;
			},

			getUsers: function(page, colIndex, asc, filterOptions) {
				if (!filterOptions)
					filterOptions = {};

				filterOptions.page = page;
				filterOptions.colIndex = colIndex;
				filterOptions.asc = asc;

				return $resource(baseUrl + 'UserInfo/All').get(filterOptions).$promise;
			},

			setUserStatus: function(userId, status) {
				return $resource(baseUrl + 'UserInfo/Status').save({
					userId: userId,
					status: status
				}).$promise;
			},
		
			saveUserInfo: function(userInfo) {
				return $resource(baseUrl + 'UserInfo').save(userInfo).$promise;
			},

			confirmEmail: function(confirmationId) {
				return $resource(baseUrl + 'UserInfo/ConfirmEmail').get({
					confirmationId: confirmationId
				}).$promise;
			},
		
            resetPassword: function(email) {
				return $resource(baseUrl + 'UserInfo/ResetPassword').get({ email: email }).$promise;
			},

			replacePassword: function(newPassword, confirmationId) {
				return $resource(baseUrl + 'UserInfo/ReplacePassword').save({
					newPassword: newPassword,
					confirmationId: confirmationId
				}).$promise;
			},

			get ST_APPROVED() { return 0; },

			get ST_BANNED() { return 1; },

			get ST_ADMIN() { return 5; },

            getStatusCaption: function(statusId) {
				return statusId == obj.ST_APPROVED ? 'user' : (statusId == obj.ST_ADMIN ? 'administrator' : 'banned');
			},

            getAvailableStatuses: function() {
				return [this.ST_APPROVED,
					this.ST_BANNED,
					this.ST_ADMIN];
			}
		}

		return obj;
	}])
	.service('ConverterService', [function () {
		this.strToBytes = function (content) {
			return btoa(unescape(encodeURIComponent(content)));
		};
		this.bytesToStr = function (content) {
			return decodeURIComponent(escape(atob(content)));
		};
	}])
	.factory('ArticleReqFactory', ['$resource', 'baseUrl', 'ConverterService', '$window', '$q',
		function ($resource, baseUrl, ConverterService, $window, $q) {

		const _searching = function (page, colIndex, asc, filterOptions, method = null) {
			if (!filterOptions)
				filterOptions = {};

			filterOptions.page = page;
			filterOptions.colIndex = colIndex;
			filterOptions.asc = asc;

            const methodPath = method ? '/' + method: '';
			return $resource(baseUrl + 'Article' + methodPath).get(filterOptions).$promise;
		};

		var obj = {
            updateArticle: function(article) {
				if (article.status != this.ST_EDIT && article.status != this.ST_REVIEW && article.status != this.ST_AMENDING)
					article.reviewedContent = null;
				else
					article.reviewedContent = ConverterService.strToBytes(article.reviewedContent);
					
				article.content = ConverterService.strToBytes(article.content);
				article.tags = article.tempTags.join(' ');
				return $resource(baseUrl + 'Article').save(article).$promise;
			},
            createVersion: function(id) {
				return $resource(baseUrl + 'Article/NewVersion').get({ id: id }).$promise;
			},
            removeArticle: function(ids) {
                return $resource(baseUrl + 'Article').remove({ ids: ids }).$promise;
			},
            getArticleHistory: function(id) {
				return $resource(baseUrl + 'History').query({ id: id }).$promise;
			},
            getNotifications: function(userId) {
                return $resource(baseUrl + 'Notification').query({ userId: userId }).$promise;
			},
            clearNotifications: function(ids) {
				return $resource(baseUrl + 'Notification').remove({ ids: ids }).$promise;
			},			
            getDefaultCategories: function() {
				const methodName = 'Categories';
				var tagStr = $window.localStorage.getItem(methodName);
				
				var deffered = $q.defer();

				if (tagStr)
					deffered.resolve(JSON.parse(tagStr));
				else {
					$resource(baseUrl + 'Article/' + methodName).query().$promise.then(function (data) {
						$window.localStorage.setItem(methodName, JSON.stringify(data));
						deffered.resolve(data);
					}, function (err) {
						deffered.reject(err);
					});
				}

				return deffered.promise;
			},
            getArticleTitles: function() {
				return $resource(baseUrl + 'Article/Titles').get().$promise;
			},
            viewArticle: function(id, userId) {
				return $resource(baseUrl + `Article/${id}`).get({
					userId: userId
				}).$promise;
			},
            getAllArticles: function(page, colIndex, asc, filterOptions) {
				return _searching(page, colIndex, asc, filterOptions, 'All');
			},
            searchArticles: function(page, colIndex, asc, filterOptions) {
				return _searching(page, colIndex, asc, filterOptions);
			},
			get ST_DRAFT() { return 0; },

			get ST_CREATED() { return 1; },

			get ST_REVIEW() { return 2; },

			get ST_EDIT() { return 3; },

			get ST_APPROVED() { return 4; },

			get ST_REFUSED() { return 5; },

			get ST_BLOCKED() { return 6; },

			get ST_DELETED() { return 7; },

			get ST_AMENDING() { return 8; },

            getAvailableArticleStatuses: function() {
				return [this.ST_DRAFT,
					this.ST_CREATED,
					this.ST_REVIEW,
					this.ST_EDIT,
					this.ST_AMENDING,
					this.ST_APPROVED];
			},

            getStatusCaption: function(statusId) {
				switch (statusId) {
					case obj.ST_DRAFT:
						return 'draft';
					case obj.ST_CREATED:
						return 'created';
					case obj.ST_REVIEW:
						return 'on review';
					case obj.ST_EDIT:
						return 'on edit';
					case obj.ST_APPROVED:
						return 'approved';
					case obj.ST_AMENDING:
						return 'on amending';
					default:
						return 'none';
				}
			},
            assignArticle: function(id) {
                return this._setArticleAssignment(id, true);
            },
            _setArticleAssignment(id, shouldAssign) {
                return $resource(baseUrl + 'Article/Assignment')
                    .save({ id: id, assign: shouldAssign }).$promise;
            },
            unassignArticle: function(id) {
                return this._setArticleAssignment(id, false);
			},

			//*** AMENDMENTS ***
            getAmendments: function(id) {
				return $resource(baseUrl + 'Amendment').query({ articleId: id }).$promise;
			},
            updateAmendment: function(amendments) {
				return $resource(baseUrl + 'Amendment').save(amendments).$promise;
			},
            removeAmendment: function(amendmentIds) {
				return $resource(baseUrl + 'Amendment').remove({ ids: amendmentIds }).$promise;
			},
            createAmendment: function(articleId, amendment) {
				amendment.articleId = articleId;
				return $resource(baseUrl + 'Amendment/New').save(amendment).$promise;
			},
			
			//*** COMMENTS ***
            getAvailableCommentStatuses: function() {
				return [this.ST_CREATED, this.ST_BLOCKED, this.ST_DELETED];
			},
            createComment: function(articleId, comment) {
				comment.articleId = articleId;
				comment.content = ConverterService.strToBytes(comment.content);
				return $resource(baseUrl + 'Comment').save(comment).$promise;
			},
            getComments: function(page, colIndex, asc, userId, all, parentId, filterOptions) {
				if (!filterOptions)
					filterOptions = {};

				filterOptions.page = page;
				filterOptions.colIndex = colIndex;
				filterOptions.asc = asc;
				filterOptions.userId = userId;
				filterOptions.all = all;
				filterOptions.parentId = parentId;

				return $resource(baseUrl + 'Comment').get(filterOptions).$promise;
			},
            updateCommentStatus: function(id, status) {
				return $resource(baseUrl + 'Comment/Status').save({ id: id, status: status }).$promise;
			},
            getCommentStatusCaption: function(statusId) {
				switch (statusId) {
					case obj.ST_CREATED:
						return 'created';
					case obj.ST_BLOCKED:
						return 'blocked';
					case obj.ST_DELETED:
						return 'deleted';
					default:
						return 'none';
				}
			},

			//*** ESTIMATES ***
            assessArticle: function(id, positive) {
                return $resource(baseUrl + 'Estimate').save({ id: id, estimate: positive ? 1 : 2 })
                    .$promise;
			},
            getEstimates: function(page, colIndex, asc, userId, filterOptions) {
				if (!filterOptions)
					filterOptions = {};

				filterOptions.page = page;
				filterOptions.colIndex = colIndex;
				filterOptions.asc = asc;
				filterOptions.userId = userId;

				return $resource(baseUrl + 'Estimate').get(filterOptions).$promise;
			},
			get EST_POSITIVE() {
				return 1;
			},
			get EST_NEGATIVE() {
				return 2;
			},
            getEstimateStatusCaption: function(statusId) {
				switch (statusId) {
					case obj.EST_NEGATIVE:
						return 'negative';
					case obj.EST_POSITIVE:
						return 'positive';
					default:
						return 'none';
				}
			},
            getAvailableEstimateStatuses: function() {
				return [this.EST_POSITIVE, this.EST_NEGATIVE];
			},

			//*** COMPLAINTS ***
            createComplaint: function(complaint) {
				return $resource(baseUrl + 'Complaint').save(complaint).$promise;
			},
            getComplaints: function(page, colIndex, asc, filterOptions) {
				if (!filterOptions)
					filterOptions = {};

				filterOptions.page = page;
				filterOptions.colIndex = colIndex;
				filterOptions.asc = asc;
				
				return $resource(baseUrl + 'Complaint').get(filterOptions).$promise;
			},
            setComplaintStatus: function(id, status, response) {
				return $resource(baseUrl + 'Complaint/Status').save({
					id: id,
					status: status,
					response: response
				}).$promise;
			},
            assignCmpl: function(id) {
                return this._setCmplAssignment(id, true);
            },
            _setCmplAssignment: function (id, shouldAssign) {
                return $resource(baseUrl + 'Complaint/Assignment')
                    .save({ id: id, assign: shouldAssign }).$promise;
            },
            unassignCmpl: function(id) {
                return this._setCmplAssignment(id, false);
			},
            getComplaintEntityTypeEnum: function() {
				return [{value: 0, name:"comment"},
					{value: 1, name: "article"}];
			},
            getAvailableComplaintStatuses: function() {
				return [this.ST_CREATED,
					this.ST_APPROVED,
					this.ST_REFUSED];
			},
            getComplaintStatusCaption: function(statusId) {
				switch (statusId) {
					case obj.ST_CREATED:
						return 'created';
					case obj.ST_APPROVED:
						return 'approved';
					case obj.ST_REFUSED:
						return 'refused';
					default:
						return 'none';
				}
			}
		};
			
		return obj;
	}]);
})();