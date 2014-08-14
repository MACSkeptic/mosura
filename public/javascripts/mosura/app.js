angular.module('mosura', ['ngRoute', 'ngResource', 'ngCookies', 'LocalStorageModule']);

angular.module('mosura').config(function ($routeProvider, $locationProvider, localStorageServiceProvider) {
  localStorageServiceProvider.setPrefix('mosura');

  $routeProvider.when('/login', { controller: 'LoginController', templateUrl: '/templates/login.html' });
  $routeProvider.when('/development', { controller: 'DevelopmentController', templateUrl: '/templates/development.html' });
  $routeProvider.when('/discovery', { controller: 'DiscoveryController', templateUrl: '/templates/discovery.html' });
  $routeProvider.otherwise({ redirectTo: '/development' });

  $locationProvider.html5Mode(false);
});

angular.module('mosura').factory('JiraCredentials', function ($cookieStore) {
  return {
    fromCookie: function () {
      var credentials = $cookieStore.get('jira');
      return credentials && credentials.username && credentials.password && credentials;
    },
    toCookie: function (credentials) {
      return $cookieStore.put('jira', credentials);
    }
  };
});

angular.module('mosura').factory('EnsureLogin', function ($location, $cookieStore, JiraCredentials) {
  return {
    then: function (comebackTo) {
      if (JiraCredentials.fromCookie()) { return; }
      $cookieStore.put('last-page', comebackTo || '/development');
      $location.path('/login');
    }
  };
});

angular.module('mosura').controller('LoginController', function ($scope, $interval, $location, $resource, $cookieStore, localStorageService, JiraCredentials) {
  function navigateBackToWhereYouCameFrom() {
    $location.path($cookieStore.get('last-page') || '/development');
  }

  function storeJiraCredentialsOnCookie() {
    JiraCredentials.toCookie($scope.jiraCredentials);
  }

  $scope.login = function () {
    storeJiraCredentialsOnCookie();
    navigateBackToWhereYouCameFrom();
  };
});

angular.module('mosura').factory('DataHandler', function ($scope, $interval, $resource, localStorageService) {
  var api;

  api.loadColumnsFromCache = function (scope) {
    var cachedColumns = localStorageService.get('columns');
    scope = scope || {};

    if (cachedColumns && cachedColumns.length) {
      scope.columns = cachedColumns;
    }

    return scope.columns;
  };

  api.daysSince = function (zuluTimeString) {
    var now = new Date().getTime();
    var then = new Date(zuluTimeString).getTime();

    return Math.round(((((now - then) / 1000) / 60) / 60) / 24);
  };

  api.calculateStaleFor = function (data) {
    if (!data || !data.issues) { return null; }

    data.issues.forEach(function (issue) {
      issue.staleFor = daysSince(issue.fields.updated);
    });

    return data;
  };

  return api;
});

angular.module('mosura').controller('DiscoveryController', function ($scope, $interval, $location, $resource, localStorageService, EnsureLogin) {
  EnsureLogin.then('/discovery');
});

angular.module('mosura').controller('DevelopmentController', function (
  $scope, $interval, $resource, localStorageService, EnsureLogin, DataHandler) {
  EnsureLogin.then('/development');

  var issuesResource = $resource('/jira/issues/:status');
  var poller = null;

  $scope.data = {};
  $scope.columns = [];

  function loadColumnsFromCache() { return DataHandler.loadColumnsFromCache($scope); }
  function daysSince(zuluTimeString) { return DataHandler.daysSince(zuluTimeString); }
  function calculateStaleFor(data) { return DataHandler.calculateStaleFor(data); }

  function addUiUrl(data) {
    if (!data || !data.issues) { return null; }

    data.issues.forEach(function (issue) {
      issue.ui = issue.self.replace(/rest\/api\/2.*/, 'browse/' + issue.key);
    });

    return data;
  }

  function loadColumnsFromServer() {
    $resource('/config/columns').query().$promise.then(function (targetColumns) {
      console.log('target columns:', targetColumns);
      targetColumns.forEach(function (column) {
        issuesResource.get({ status: column.status }).$promise.then(calculateStaleFor).then(function (data) {
          console.log('loaded data for column:', column.name);
          $scope.columns[column.order] = column;
          column.data = data;
          return column.data;
        }).then(addUiUrl).then(saveColumnsToCache);
      });
    });
  }

  function saveColumnsToCache() {
    localStorageService.set('columns', $scope.columns);
  }

  function loadColumns() {
    if (poller) { $interval.cancel(poller); poller = null; }

    loadColumnsFromCache();

    loadColumnsFromServer();

    // reload every 5 minutes
    poller = $interval(loadColumnsFromServer, 5 * 60 * 1000);
  }

  loadColumns();
});
