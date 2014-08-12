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

  request.get(configuration.url, function (error, response, body) {
    if (error) { return deferred.reject(error); }
    deferred.resolve({ response: response, body: JSON.parse(body) });
  }).auth(configuration.username, configuration.password, true);

  return deferred.promise;
}

function requestWithBody(verb, configuration) {
  var deferred = q.defer();
  console.log(verb, configuration);
  
  request(
    {
      method: verb,
      url: configuration.url,
      json: configuration.body,
      auth: _.merge({}, configuration, { sendImmediately: true })
    },
    function (error, response, body) {
      if (error) { return deferred.reject(error); }
      deferred.resolve({ response: response, body: body });
    }
  );

  return deferred.promise;
}

function post(configuration) {
  return requestWithBody('POST', configuration);
}

function put(configuration) {
  return requestWithBody('PUT', configuration);
}

function toQueryString(params) {
  return '?' + _.map(params, function (value, key) { return key + '=' + encodeURIComponent(value); }).join('&');
}

function jqlFor(configuration) {
  return 'component="'+ configuration.component +'" and status="'+ configuration.status +'" and IssueType in (Story, Bug)';
}

function addComponentStatusBody(configuration) {
  configuration.body = {
    jql: jqlFor(configuration),
    expand: [],
    fields: ['key', 'summary', 'issuetype', 'assignee', 'fixVersions', 'issueLinks', 'status', 'updated']
  };
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

function addUpdateFieldBody(configuration) {
  var fields = {};
  fields[configuration.field] = configuration.value;
  configuration.body = { fields: fields };
  return configuration;
}

exports.updateField = _.compose(put, addUpdateFieldBody, addIssueUrl, useDefaults);
exports.issues = _.compose(post, addComponentStatusBody, addSearchUrl, useDefaults);
exports.issue = _.compose(get, addExpandRenderedFieldsQueryString, addIssueUrl, useDefaults);
