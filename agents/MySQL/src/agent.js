var mysql = require('mysql');

function MySqlAgent(server, database, user, password, apiId, apiSecret) {
    this.apiId = apiId;
    this.apiSecret = apiSecret;
    this.connection = mysql.createConnection({
        host: server,
        user: user,
        password: password,
        database: database
    });
}

MySqlAgent.prototype.sync = function () {
    console.log('\n');
    
    this.connection.connect(function (err) {
        if (err) {
            console.error(" error: %s\n", err);
            return;
        }
        
        console.log(' Connected to MySQL');        
    });
    
    // TODO
};

module.exports = MySqlAgent;