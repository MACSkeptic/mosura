var request = require('request');
var q = require('q');
var _ = require('lodash');

var DEFAULTS = {
  username: process.env.JIRA_USERNAME,
  password: process.env.JIRA_PASSWORD,
  baseUrl: process.env.JIRA_BASEURL,
  component: process.env.JIRA_COMPONENT
};

function addIssueUrl(configuration) {
  configuration.url = configuration.baseUrl + '/issue/' + configuration.issueId;
  return configuration;
}

function get(configuration) {
  var deferred = q.defer();

  console.log(configuration);

  request.get(configuration.url, function (error, response, body) {
    if (error) { return deferred.reject(error); }
    deferred.resolve({ response: response, body: JSON.parse(body) });
  }).auth(configuration.username, configuration.password, true);

  return deferred.promise;
}

function toQueryString(params) {
  return '?' + _.map(params, function (value, key) { return key + '=' + encodeURIComponent(value); }).join('&');
}

function addComponentStatusQueryString(configuration) {
  configuration.url = configuration.url + toQueryString({
    jql: 'component="'+ configuration.component +'" and status="'+ configuration.status +'" and IssueType in (Story, Bug)',
    expand: 'renderedFields'
  });
  return configuration;
}

function addExpandRenderedFieldsQueryString(configuration) {
  configuration.url = configuration.url + toQueryString({ expand: 'renderedFields' });
  return configuration;
}

function addSearchUrl(configuration) {
  configuration.url = configuration.baseUrl + '/search';
  return configuration;
}

function useDefaults(configuration) {
  return _.merge({}, DEFAULTS, configuration);
}

exports.issues = _.compose(get, addComponentStatusQueryString, addSearchUrl, useDefaults);
exports.issue = _.compose(get, addExpandRenderedFieldsQueryString, addIssueUrl, useDefaults);