angular.module('mosura', ['ngRoute', 'ngResource']);

angular.module('mosura').controller('mainController', function ($scope, $resource) {
  $scope.data = {};
  $scope.data.inProgress = $resource('/jira/issues/:status').get({ status: 'In Progress' });
  $scope.data.waitingForAcceptance = $resource('/jira/issues/:status').get({ status: 'Waiting For Acceptance' });
});