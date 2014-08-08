var express = require('express');
var router = express.Router();

router.get('/columns', function(req, res) {
  var columns = [];
  try {
    columns = require('../columns.json');
  } catch (e) {
    console.error(e);

    columns = [
      { order: 0, name: 'in development', status: 'In Progress' },
      { order: 1, name: 'waiting for QA', status: 'QA Required' },
      { order: 2, name: 'in QA', status: 'QA In Progress' },
      { order: 3, name: 'waiting for UAT', status: 'Waiting For Acceptance' },
      { order: 4, name: 'in UAT', status: 'UAT In Progress' }
    ]
  }

  res.json(columns);
});

module.exports = router;
