var express = require('express');
var router = express.Router();
var jiraBackend = require('../jira');

router.get('/issues/:status', function(req, res) {
  jiraBackend.issues(req.params.status).then(function (result) {
    res.json(result.body);
  });
});

module.exports = router;
