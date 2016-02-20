var bcrypt = require('bcrypt-nodejs');
var storage = require('../db');
var config = require('../config/config');

function isConfigured(next) {
    var db = storage.get();
    db.listCollections({name: 'users'}).toArray(function (err, items) {
        if (err) {
            return next(err);
        }
        
        if (items.length === 0) {
            return next(null, false);
        } else {
            return next(null, true);
        }
    });
}

module.exports = {
    configure: function (next) {
        isConfigured(function (err, isConfigured) {
            if (err) {
                return next(err);
            }
            
            if (!isConfigured) {
                // Create default user (demo/demo) and continue
                var db = storage.get();
                var users = db.collection('users');
                users.insert({
                    username: config.default.username,
                    password: bcrypt.hashSync(config.default.password),
                    created: new Date() 
                }, function (err, result) {
                    if (err) {
                        return next(err);
                    }
                    
                    next();
                });
            } else {
                return next();
            }
        });
    }
};