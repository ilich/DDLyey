var db = require('../db');
var config = require('../config/config');
var rack = require('hat').rack();
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
    
    changePassword: function (userId, password, newPassword, callback) {
        var users = db.get().collection('users');
        users.findOne(new ObjectID(userId), function (err, user) {
            if (err) {
                return callback(false);
            }
            
            if (user === null) {
                return callback(false);
            }
            
            bcrypt.compare(password, user.password, function (err, result) {
                if (err) {
                    return callback(false);
                }
                
                if (!result) {
                    return callback(false);
                }
                
                bcrypt.hash(newPassword, null, null, function (err, hash) {
                    if (err) {
                        return callback(false);
                    }
                    
                    users.updateOne(user, {
                        $set: {password: hash, modified: new Date()}
                    }, function (err) {
                        if (err) {
                            return callback(false);
                        } else {
                            return callback(true);
                        }
                    });
                });
            });
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
                    users.update(user, {
                        $set: {lastAccess: new Date()}
                    }, function (err) {
                        if (err) {
                            return callback(null, null);
                        } else {
                            return callback(null, user);    
                        }
                    });
                } else {
                    return callback(null, null);
                }
            });
        });
    },
    
    logout: function (req, res, callback) {
        var token = req.cookies[config.rememberMeCookie.name];
        if (!token) {
            req.logout();
            return callback();
        }
        
        var tokens = db.get().collection('tokens');
        tokens.remove({ token: token }, function () {
            res.clearCookie(config.rememberMeCookie.name);
            req.logout();
            return callback();    
        });
    },
    
    rememberMeToken: {
        
        create: function (user, callback) {
            var token = rack(),
                tokens = db.get().collection('tokens');
            
            tokens.insert({
                token: token,
                user: user._id
            }, function (err) {
                if (err) {
                    return callback(err);
                } else {
                    return callback(null, token);
                }
            });
        },
        
        consume: function (token, callback) {
            var tokens = db.get().collection('tokens'),
                users = db.get().collection('users');
                
            tokens.findOne({ token: token }, function (err, token) {
                if (err) {
                    return callback(err);
                }
                
                if (!token) {
                    return callback(null, null);
                }
                
                users.findOne(new ObjectID(token.user), function (err, user) {
                    if (err) {
                        return callback(err);
                    }
                    
                    tokens.remove(token, function (err) {
                        if (err) {
                            return callback(err); 
                        } else if (user === null) {
                            return callback(null, null);
                        } else {
                            return callback(null, user);
                        }    
                    });
                });
            });
        }
        
    }
    
};