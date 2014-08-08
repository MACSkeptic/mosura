angular.module('mosura', ['ngRoute', 'ngResource', 'ngCookies']);

angular.module('mosura').controller('mainController', function ($scope, $resource, $cookieStore) {
  var issuesResource = $resource('/jira/issues/:status');
  $scope.data = {};
  $scope.columns = [];

  function loadColumns() {
    $scope.allGood = true;
    console.table([
      ['username', $scope.jira.username],
      ['password', 'password for ' + $scope.jira.username + ' ;)'],
      ['baseUrl', $scope.jira.baseUrl],
      ['component', $scope.jira.component]
    ]);
    $resource('/config/columns').query().$promise.then(function (targetColumns) {
      targetColumns.forEach(function (column) {
        $scope.columns[column.order] = column;
        column.data = issuesResource.get({ status: column.status });
      });
    });
  }

  $scope.jira = $cookieStore.get('jira') || {};

  if ($scope.jira.username && $scope.jira.password && $scope.jira.baseUrl && $scope.jira.component) {
    loadColumns();
  }

  $scope.updateCookie = function () {
    $cookieStore.put('jira', $scope.jira);
    loadColumns();
  };
});