var db = require('../db');
var ObjectID = require('mongodb').ObjectID;
var bcrypt = require('bcrypt-nodejs');

module.exports = {
    
    findUserById: function (userId, callback) {
        var users = db.get().collection('users');
        users.findOne(new ObjectID(userId), function (err, user) {
            if (err) {
                return callback(err);
            } else if (user === null) {
                return callback(null, null);
            } else {
                return callback(null, user);
            }
        });       
    },
    
    login: function (username, password, callback) {
        var users = db.get().collection('users');
        users.findOne({ username: username }, function (err, user) {
            if (err) {
                return callback(err);
            }
            
            if (user === null) {
                return callback(null, null);
            }
            
            bcrypt.compare(password, user.password, function (err, result) {
                if (err) {
                    return callback(err);
                }
                
                if (result === true) {
                    return callback(null, user);
                } else {
                    return callback(null, null);
                }
            });
        });
    } 
    
};