angular.module('mosura', ['ngRoute', 'ngResource']);

angular.module('mosura').controller('mainController', function ($scope, $resource) {
  var issuesResource = $resource('/jira/issues/:status');
  $scope.data = {};
  $scope.columns = [];

  $resource('/config/columns').query().$promise.then(function (targetColumns) {
    targetColumns.forEach(function (column) {
      $scope.columns[column.order] = column;
      column.data = issuesResource.get({ status: column.status });
    });
  });
});