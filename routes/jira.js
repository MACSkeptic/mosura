var express = require('express');
var router = express.Router();
var jiraBackend = require('../jira');
var _ = require('lodash');

router.get('/issues/:status', function(req, res) {
  var jiraConfiguration = (!req.cookies.jira && {}) ||
    (req.cookies.jira.username ? req.cookies.jira : JSON.parse(req.cookies.jira));

  jiraBackend.issues(_.merge({}, jiraConfiguration, { status: req.params.status })).then(function (result) {
    res.json(result.body);
  });
});

module.exports = router;
