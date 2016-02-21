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
    res.render('account/change-password', {
        csrfToken: req.csrfToken(),
        errors: [],
        success: ''
    });        
});

router.post('/change-password', protectWeb, function (req, res, next) {
    var password = req.body.password.trim(),
        newPassword = req.body.newPassword.trim(),
        confirmPassword = req.body.confirmPassword.trim();
    
    var errors = [];
    
    if (password === '') {
        errors.push('Current password is required.');
    }
    
    if (newPassword === '') {
        errors.push('New password is required.');
    }
    
    if (confirmPassword === '') {
        errors.push('You should confirm your new password.');
    }
    
    if (newPassword !== confirmPassword) {
        errors.push('Passwords do not match.');
    }
    
    if (newPassword.length < 8) {
        errors.push('Your password should have at least 8 characters.');
    }
    
    if (errors.length > 0) {
        return res.render('account/change-password', {
            csrfToken: req.csrfToken(),
            errors: errors,
            success: ''
        });     
    }
    
    usersService.changePassword(req.user._id, password, newPassword, function (result) {
        if (result) {
            return res.render('account/change-password', {
                csrfToken: req.csrfToken(),
                errors: [],
                success: 'Your password has been changed.'
            });
        } else {
            return res.render('account/change-password', {
                csrfToken: req.csrfToken(),
                errors: ['Invalid current password.'],
                success: ''
            });
        } 
    });
});

module.exports = router;