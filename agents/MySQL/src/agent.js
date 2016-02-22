var util = require('util');
var mysql = require('mysql');
var async = require('async');
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var auth = require('./auth');

var DB_OBJECT = {
    TABLES: 0,
    VIEWS: 1,
    PROCEDURES: 2,
    FUNCTIONS: 3
};

function MySqlAgent(server, database, user, password, apiId, mongo) {
    console.log('===========================================');
    console.log('MySQL Host: %s', server);
    console.log('Target Database: %s', database);
    console.log('User: %s', user);
    console.log('DDLeye API: %s', apiId);
    console.log('MongoDB: %s', mongo);
    console.log('===========================================');
    
    this.apiId = apiId;
    this.mongo = mongo;
    this.schema = database;
    this.connection = mysql.createConnection({
        host: server,
        user: user,
        password: password
    });
}

MySqlAgent.prototype.sync = function (done) {
    if (!done) {
        throw new TypeError('Invalid MySqlAgent.prototype.sync call');
    }
    
    var self = this;
    MongoClient.connect(self.mongo, function (err, db) {
        if (err) {
            return done(err);
        }
        
        console.log('Connected to MongoDB');
        
        var metadata = db.collection('metadata');
        
        self.connection.connect(function (err) {
            if (err) {
                return done(err)
            }
            
            console.log('Connected to MySQL');        
        });
        
        function syncObjects(objectType) {
            var sql = null;
            var mongoObjectType = null;
            switch(objectType) {
                case DB_OBJECT.TABLES:
                    sql = 'CALL DDLeye.GetTables(?);';
                    mongoObjectType = 'table';
                    break;
                    
                case DB_OBJECT.VIEWS:
                    sql = 'CALL DDLeye.GetViews(?);';
                    mongoObjectType = 'view';
                    break;
                    
                case DB_OBJECT.PROCEDURES:
                    sql = 'CALL DDLeye.GetProcedures(?)';
                    mongoObjectType = 'procedure';
                    break;
                    
                case DB_OBJECT.FUNCTIONS:
                    sql = 'CALL DDLeye.GetFunctions(?)';
                    mongoObjectType = 'function';
                    break;
            }
            
            if (!sql) {
                throw new TypeError('Invalid MySQL object type');
            }
            
            return new Promise(function (resolve, reject) {
                self.connection.query(sql, [ self.schema ], function (err, result) {
                    if (err) {
                        return reject(err);
                    }
                    
                    async.each(result[0], function (mysqlData, callback) {
                        metadata.insert({
                            database: new ObjectID(self.apiId),
                            type: mongoObjectType,
                            name: mysqlData.OBJECT_NAME,
                            text: mysqlData.TEXT,
                            checksum: mysqlData.CHECKSUM,
                            lastModified: new Date()
                        }, function (err) {
                            console.log('Indexed %s (%s)', mysqlData.OBJECT_NAME, mongoObjectType);
                            
                            if (err) {
                                return callback(err);
                            } else {
                                return callback();
                            }
                        });
                    }, function (err, result) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
            });
        }

        metadata.deleteMany({database: new ObjectID(self.apiKey)}, function (err, r) {
            if (err) {
                return done(err);
            }
            
            console.log('MongoDB metadata for %s has been cleaned up', self.apiKey);
            
            Promise.all([
                syncObjects(DB_OBJECT.TABLES),
                syncObjects(DB_OBJECT.VIEWS),
                syncObjects(DB_OBJECT.PROCEDURES),
                syncObjects(DB_OBJECT.FUNCTIONS)
            ]).then(function () {
                db.close(function () {
                    console.log('Disconnected from MongoDB'); 
                    
                    self.connection.end(function () {
                        console.log('Disconnected from MySQL'); 
                        done();   
                    });    
                });
                
            }).catch(function (reason) {
                done(reason);  
            });    
        });
    });
};

module.exports = MySqlAgent;