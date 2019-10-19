(function () {
	'use strict';

    angular.module('ArticleLibraryApp').controller('FooterCtrl', 
        ['$scope', 'ContactRequest', 'ErrorService',
		function ($scope, ContactRequest, ErrorService) {
			
			var onRequest = function (end) {
				if (end) {
					$scope.sending = false;
					$scope.msg = null;
				}
				else {
					$scope.sending = true;
					$scope.msg = "Please, wait...";
				}
				$scope.isError = false;
			};
			var onError = function (data, msg) {
				if (data) {
					$scope.sending = false;
					$scope.isError = true;
					$scope.msg = ErrorService.processError(msg, data);
				}
			};

			onRequest();

			ContactRequest.getBasicInfo().then(function (data) {
				$scope.info = data;
				onRequest(true);
			}, onError);
		}]);
})();