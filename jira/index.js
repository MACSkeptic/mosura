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

exports.issue = _.compose(get, issueUrl);