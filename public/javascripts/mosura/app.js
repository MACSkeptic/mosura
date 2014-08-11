angular.module('mosura', ['ngRoute', 'ngResource', 'ngCookies', 'LocalStorageModule']);

angular.module('mosura').config(function (localStorageServiceProvider) {
  localStorageServiceProvider.setPrefix('mosura');
});

angular.module('mosura').controller('mainController', function ($scope, $interval, $resource, $cookieStore, localStorageService) {
  var issuesResource = $resource('/jira/issues/:status');
  var poller = null;

  $scope.data = {};
  $scope.columns = [];

  function loadColumnsFromCache() {
    var cachedColumns = localStorageService.get('columns');

    if (cachedColumns && cachedColumns.length) {
      $scope.columns = cachedColumns;
    }

    return $scope.columns;
  }

  function loadColumnsFromServer() {
    $resource('/config/columns').query().$promise.then(function (targetColumns) {
      targetColumns.forEach(function (column) {
        $scope.columns[column.order] = column;
        column.data = issuesResource.get({ status: column.status });
      });
      //saveColumnsToCache();
    });
  }

  function saveColumnsToCache() {
    localStorageService.set('columns', $scope.columns);
  }

  function loadColumns() {
    if (poller) { $interval.cancel(poller); poller = null; }

    $scope.allGood = true;
    loadColumnsFromCache();

    // reload every 10 minutes
    loadColumnsFromServer();

    poller = $interval(loadColumnsFromServer, 10 * 60 * 1000);
  }

  function loadJiraCookie() {
    $scope.jira = $cookieStore.get('jira') || {};
  }

  function hasJiraInformation() {
    return $scope.jira.username && $scope.jira.password && $scope.jira.baseUrl && $scope.jira.component;
  }

  $scope.updateCookie = function () {
    $cookieStore.put('jira', $scope.jira);
    loadColumns();
  };

  loadJiraCookie();
  if (hasJiraInformation()) { loadColumns(); }
});