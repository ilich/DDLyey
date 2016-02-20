var MongoClient = require('mongodb').MongoClient;

var connection = null;

module.exports = {
    connect: function (connectionString, done) {
        if (connection) {
            return done(null, connection);
        }
        
        MongoClient.connect(connectionString, function (err, res) {
            if (err) {
                return done(err);
            }
            
            connection = res;
            done(null, connection);
        });
    },
    
    get: function () {
        return connection;
    },
    
    close: function (done) {
        if (!connection) {
            return done(null);
        }
        
        connection.close(function (err) {
            if (err) {
                return done(err);
            }    
            
            connection = null;
            done(null);
        });
    }
}