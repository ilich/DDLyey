var passport = require('passport');
var usersService = require('../services/users');
var config = require('../config/config');
var express = require('express');
var router = express.Router();

router.get('/', function (req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/');    
    }
    
    var username = req.flash('username');
    var errors = req.flash('error');
    
    res.render('login/login', {
        csrfToken: req.csrfToken(),
        errors: errors,
        username: username.length > 0 ? username[0] : '' 
    });
});

router.post('/', passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: true
}), function (req, res, next) {
    if (!req.body.remember) {
        return res.redirect('/');    
    }
    
    usersService.rememberMeToken.create(req.user, function (err, token) {
        if (err) {
            return next(err);
        }
        
        res.cookie(config.rememberMeCookie.name, token, config.rememberMeCookie.options);
        return res.redirect('/');
    });
});

module.exports = router;