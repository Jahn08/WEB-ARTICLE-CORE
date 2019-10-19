(function () {
	'use strict';

	angular.module('ArticleLibraryApp').controller('UserConfirmationCtrl', ['$scope', 'AuthRequest', '$stateParams', '$state', 'ErrorService',
		function ($scope, AuthRequest, $stateParams, $state, ErrorService) {
			$scope.ConfirmationStateMsg = 'Please wait for the end of the confirmation process...';

			AuthRequest.confirm($stateParams.id).then(function () {
				alert('Congratulations! Your account has been confirmed. You can now use it to log in');
				$state.go('app');
			}, function (data) {
				$scope.ConfirmationStateMsg = ErrorService.processError('Unfortunately, your account has not been confirmed', data);
				$scope.error = true;
			});
		}]);
})();