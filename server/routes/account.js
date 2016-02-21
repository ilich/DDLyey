var usersService = require('../services/users');
var protectWeb = require('../middleware/protect-web');
var express = require('express');
var router = express.Router();

router.get('/logout', protectWeb, function (req, res, next) {
    usersService.logout(req, res, function () {
        res.redirect('/login');    
    });      
});

router.get('/change-password', protectWeb, function (req, res, next) {
    
});

module.exports = router;