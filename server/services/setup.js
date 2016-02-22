var bcrypt = require('bcrypt-nodejs');
var db = require('../db');
var config = require('../config/config');

function isConfigured(next) {
    db.get().listCollections({name: 'users'}).toArray(function (err, items) {
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
                var users = db.get().collection('users');
                users.createIndex({username: 1}, function (err, result) {
                    if (err) {
                        return next(err);
                    }
                    
                    users.insert({
                        username: config.default.username,
                        password: bcrypt.hashSync(config.default.password),
                        email: config.default.email,
                        created: new Date() 
                    }, function (err, result) {
                        if (err) {
                            return next(err);
                        }
                        
                        // Create indexes for metadata search
                        var metadata = db.get().collection('metadata');
                        metadata.createIndex({database: 1, type: 1, name: 1}, function (err, result) {
                            if (err) {
                                return next(err);
                            }
                            
                            metadata.createIndex({name: 'text', text: 'text'}, function (err, result) {
                                if (err) {
                                    return next(err);
                                }
                                
                                return next();
                            });
                        });
                    });
                });
            } else {
                return next();
            }
        });
    }
};