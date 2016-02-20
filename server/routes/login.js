var passport = require('passport');
var express = require('express');
var router = express.Router();

router.get('/', function (req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/');    
    }
    
    var username = req.flash('username');
    var errors = req.flash('error');
    
    res.render('login', {
        errors: errors,
        username: username.length > 0 ? username[0] : '' 
    });
});

router.post('/', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));

module.exports = router;