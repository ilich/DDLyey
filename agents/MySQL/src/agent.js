var util = require('util');
var mysql = require('mysql');

var DB_OBJECT = {
    TABLES: 0,
    VIEWS: 1,
    PROCEDURES: 2,
    FUNCTIONS: 3
};

function MySqlAgent(server, database, user, password, apiId, apiSecret) {
    console.log('===========================================');
    console.log('MySQL Host: %s', server);
    console.log('Target Database: %s', database);
    console.log('User: %s', user);
    console.log('DDLeye API: %s', apiId);
    console.log('===========================================');
    
    this.apiId = apiId;
    this.apiSecret = apiSecret;
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
    
    self.connection.connect(function (err) {
        if (err) {
            return done(err)
        }
        
        console.log('Connected to MySQL');        
    });
    
    function syncObjects(objectType) {
        var sql = null;
        switch(objectType) {
            case DB_OBJECT.TABLES:
                sql = 'CALL DDLeye.GetTables(?);';
                break;
                
            case DB_OBJECT.VIEWS:
                sql = 'CALL DDLeye.GetViews(?);';
                break;
                
            case DB_OBJECT.PROCEDURES:
                sql = 'CALL DDLeye.GetProcedures(?)';
                break;
                
            case DB_OBJECT.FUNCTIONS:
                sql = 'CALL DDLeye.GetFunctions(?)';
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
                
                // TODO
                
                console.log(result[0]);
                resolve();    
            });
        });
    }
    
    Promise.all([
        syncObjects(DB_OBJECT.TABLES),
        syncObjects(DB_OBJECT.VIEWS),
        syncObjects(DB_OBJECT.PROCEDURES),
        syncObjects(DB_OBJECT.FUNCTIONS)
    ]).then(function () {
        self.connection.end(function () {
            console.log('Disconnected from MySQL'); 
            done();   
        });
    }).catch(function (reason) {
        done(reason);  
    });
};

module.exports = MySqlAgent;