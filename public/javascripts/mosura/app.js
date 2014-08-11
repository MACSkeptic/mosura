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

  function daysSince(zuluTime) {
    var now = new Date().getTime();
    var then = new Date(zuluTime).getTime();

    return Math.round(((((now - then) / 1000) / 60) / 60) / 24);
  }

  function calculateStaleFor(data) {
    data.issues.forEach(function (issue) {
      issue.staleFor = daysSince(issue.fields.updated);
    });
    return data;
  }

  function adjustUrls(data) {
    data.issues.forEach(function (issue) {
      issue.ui = issue.self.replace(/rest\/api\/2.*/, 'browse/' + issue.key);
    });
    return data;
  }

  function loadColumnsFromServer() {
    if (!hasJiraInformation()) {
      $scope.allGood = false;
      return;
    }

    $resource('/config/columns').query().$promise.then(function (targetColumns) {
      console.log('target columns:', targetColumns);
      targetColumns.forEach(function (column) {
        issuesResource.get({ status: column.status }).$promise.then(calculateStaleFor).then(function (data) {
          console.log('loaded data for column:', column.name);
          $scope.columns[column.order] = column;
          column.data = data;
          return column.data;
        }).then(adjustUrls).then(saveColumnsToCache);
      });
    });
  }

  function saveColumnsToCache() {
    localStorageService.set('columns', $scope.columns);
  }

  function loadColumns() {
    if (poller) { $interval.cancel(poller); poller = null; }

    $scope.allGood = true;
    loadColumnsFromCache();

    loadColumnsFromServer();

    // reload every 5 minutes
    poller = $interval(loadColumnsFromServer, 5 * 60 * 1000);
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
  loadColumns();
});