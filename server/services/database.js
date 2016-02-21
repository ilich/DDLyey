var crypto = require('crypto');
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