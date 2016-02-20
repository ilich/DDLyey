var db = require('../db');
var ObjectID = require('mongodb').ObjectID;
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt-nodejs');

module.exports = function (passport) {
    var INVALID_LOGIN = 'Incorrect username or password.';
    
    passport.serializeUser(function (user, done) {
        return done(null, user._id);    
    });
    
    passport.deserializeUser(function (id, done) {
        var users = db.get().collection('users');
        users.findOne(new ObjectID(id), function (err, user) {
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
            var users = db.get().collection('users');
            users.findOne({ username: username }, function (err, user) {
                if (err) {
                    return done(err);
                }
                
                if (user === null) {
                    req.flash('username', username);
                    return done(null, false, { message: INVALID_LOGIN });
                }
                
                bcrypt.compare(password, user.password, function (err, result) {
                    if (err) {
                        return done(err);
                    }
                    
                    if (result === true) {
                        return done(null, user);
                    } else {
                        req.flash('username', username);
                        return done(null, false, { message: INVALID_LOGIN });
                    }
                });
            });
        });
    }));
};