var crypto = require('crypto');
var strftime = require('strftime');
var ObjectID = require('mongodb').ObjectID;
var db = require('../db');
var config = require('../config/config');

function calculateSha1Hmac(text, key) {
    var hash = crypto.createHmac('sha1', key).update(text).digest('hex');
    return hash;
}

module.exports = {
    supportedDatabases: function () {
        return [
            {id: 'mysql', text: 'MySQL'}
        ]
    },

    engineName: function (engine) {
        var database = this.supportedDatabases().find(function (d) { return d.id === engine; });
        return database ? database.text : null;
    },

    isValidEngine: function (engine) {
        return this.engineName(engine) !== null;
    },
    
    getDatabases: function (callback) {
        var self = this;
        var results = [];
        
        var databases = db.get().collection('databases');
        var stream = databases.find().sort({'database': 1}).stream();
        
        stream.on('end', function () {
            callback(results);
        });
        
        stream.on('data', function (data) {
            if (data !== null) {
                data.time = strftime('%F %T', data.created);
                data.engineName = self.engineName(data.engine);
                results.push(data);
            }
        });
    },
    
    findDatabaseById: function (id, callback) {
        var self = this;
        var objectId;
        
        try {
            objectId = new ObjectID(id);  
        } catch (err) {
             return callback(err);
        }
        
        var databases = db.get().collection('databases');
        databases.findOne(objectId, function (err, data) {
            if (err) {
                return callback(err);
            }
            
            if (!data) {
                return callback(null, null);
            }
            
            data.time = strftime('%F %T', data.created);
            data.timeModified = data.modified ? strftime('%F %T', data.modified) : 'Not yet';
            data.engineName = self.engineName(data.engine);
            return callback(null, data);
        });
    },

    createDatabase: function (database, callback) {
        database.created = new Date();

        var databases = db.get().collection('databases');
        databases.insertOne(database, function (err, r) {
            if (err) {
                return callback(err);
            }
            
            if (r == null) {
                return callback(null, null);
            }
            
            database = r.ops[0];
            var key = calculateSha1Hmac(r.insertedId.toHexString(), config.applicationKey);
            databases.update(database, {
                $set: { secret: key }
            }, function (err) {
                if (err) {
                    return callback(err);
                } else {
                    return callback(null, database);
                }
            });
        });
    }
};