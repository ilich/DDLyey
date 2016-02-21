var db = require('../db');
var LocalStrategy = require('passport-local').Strategy;
var RememberMeStrategy = require('passport-remember-me').Strategy;
var usersService = require('../services/users');

module.exports = function (passport) {
    var INVALID_LOGIN = 'Incorrect username or password.';
    
    passport.serializeUser(function (user, done) {
        return done(null, user._id);    
    });
    
    passport.deserializeUser(function (id, done) {
        usersService.findUserById(id, function (err, user) {
            if (err) {
                return done(err);
            } else if (user === null) {
                return done(null, false);
            } else {
                return done(null, user);
            }
        });
    });
    
    passport.use(new LocalStrategy({
            usernameField: 'username',
            passwordField: 'password',
            passReqToCallback: true
        }, function (req, username, password, done) {
            process.nextTick(function () {
                usersService.login(username, password, function (err, user) {
                    if (err) {
                        return done(err);
                    } else if (user === null) {
                        req.flash('username', username);
                        return done(null, false, { message: INVALID_LOGIN });
                    } else {
                        return done(null, user);
                    }
                });
            });
        })
    );
    
    passport.use(new RememberMeStrategy(function (token, done) {
            process.nextTick(function() {
                usersService.rememberMeToken.consume(token, function (err, user) {
                    if (err) {
                        return done(err);
                    } else if (user === false) {
                        return done(null, false);
                    } else {
                        return done(null, user);
                    }
                });
            });
        },
        function (user, done) {
            process.nextTick(function() {
                usersService.rememberMeToken.create(user, done);
            });
        })
    );
};