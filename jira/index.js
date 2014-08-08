var request = require('request');
var q = require('q');
var _ = require('lodash');

var username = process.env.JIRA_USERNAME;
var password = process.env.JIRA_PASSWORD;
var baseUrl = process.env.JIRA_BASEURL;

function issueUrl(issueId) {
  return baseUrl + '/issue/' + issueId;
}

function get(url) {
  var deferred = q.defer();

  console.log(url);

  request.get(url, function (error, response, body) {
    if (error) {
      deferred.reject(error);
      return;
    }

    deferred.resolve({
      response: response,
      body: JSON.parse(body)
    });

  }).auth(username, password, true);

  return deferred.promise;
}

function toQueryString(params) {
  return '?' + _.map(params, function (value, key) {
    return key + '=' + encodeURIComponent(value);
  }).join('&');
}

function addComponentStatusQueryString(url, component, status) {
  return url + toQueryString({
    jql: 'component="'+ component +'" and status="'+ status +'" and IssueType in (Story, Bug)'
  });
}

function addExpandRenderedFieldsQueryString(url) {
  return url + toQueryString({
    expand: 'renderedFields'
  });
}

function searchUrl() {
  return baseUrl + '/search';
}

exports.issues = _.compose(get, _.curry(addComponentStatusQueryString)(searchUrl()));

exports.issue = _.compose(get, addExpandRenderedFieldsQueryString, issueUrl);