var protectWeb = require('../middleware/protect-web');
var usersService = require('../services/users');
var express = require('express');
var router = express.Router();

router.get('/', protectWeb, function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
