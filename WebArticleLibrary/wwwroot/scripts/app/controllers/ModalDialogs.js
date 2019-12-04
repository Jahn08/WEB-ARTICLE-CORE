﻿(function () {
	'use strict';

	angular.module('ArticleLibraryApp')
		.controller('CommentModalCtrl', ['$scope', '$sce', '$uibModalInstance', 'ConverterService', 'ArticleReqFactory', 'data',
			function ($scope, $sce, $uibModalInstance, ConverterService, ArticleReqFactory, data) {
				$scope.parentId = data.parentId;
				$scope.comments = data.comments;

				if (!$scope.parentId) {
					$scope.comments = $scope.comments.filter(function (val) {
						return val.status != ArticleReqFactory.ST_DELETED;
					});
				}

				var userNames = data.userNames;

				$scope.isBlocked = function (status) {
					return status == ArticleReqFactory.ST_BLOCKED;
				};

				$scope.getUserName = function (authorId) {
					return authorId && userNames ? userNames[authorId] : null;
				};

				$scope.getCommentContent = function (content) {
					return content ? $sce.trustAsHtml(ConverterService.bytesToStr(content)) : null;
				};

				$scope.closeModal = function () {
					$uibModalInstance.dismiss();
				};
			}])
		.controller('ResponseModalCtrl', ['$scope', '$uibModalInstance',
			function ($scope, $uibModalInstance) {
				var response = {};

				$scope.closeModal = function () {
					if (confirm('Without a comment you cannot change the state. Continue?'))
						$uibModalInstance.dismiss();
				};
				$scope.save = function () {
					response.content = $scope.content;
					$uibModalInstance.close(response);
				};
			}])
		.controller('ComplaintModalCtrl', ['$scope', '$uibModalInstance', 'data',
			function ($scope, $uibModalInstance, data) {
				var complaint = {};

				if (data.commentId) {
					complaint.userCommentId = data.commentId;
					$scope.typeAddition = "a comment";
				}
				else {
					$scope.typeAddition = "an article";
				}

				complaint.articleId = data.articleId;

				$scope.closeModal = function () {
					$uibModalInstance.dismiss();
				};
				$scope.save = function () {
					complaint.text = $scope.content;
					$uibModalInstance.close(complaint);
				};
			}])
		.controller('AmendmentModalCtrl', ['$scope', '$uibModalInstance', 'data',
			function ($scope, $uibModalInstance, data) {
				var amendment = {};

				if (data.amendment) {
					amendment = data.amendment;
					var strs = amendment.content.split(' - ');
					$scope.content = strs.length > 1 ? strs[1] : amendment.content;

					if (!data.selection)
						data.selection = strs[0].replace(/\"/g, '');
				}

				data.selection = data.selection || '';
				$scope.global = !data.selection.length ? true : data.global;
				$scope.selection = data.selection;
				$scope.cutSelection = data.selection.length > 100 ? data.selection.substr(0, 100) + "..." : data.selection;
				$scope.readonly = data.readonly;

				$scope.closeModal = function () {
					$uibModalInstance.dismiss();
				};
				$scope.save = function () {
					amendment.content = '"' + $scope.selection + '" - ' + $scope.content;
					$uibModalInstance.close(amendment);
				};
			}]);
})();