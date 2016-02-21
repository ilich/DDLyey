#!/usr/bin/env node

var commander = require('commander');
var program = new commander.Command('ddleye-mysql');
var MySqlAgent = require('./agent');

function isValid(program) {
    if (!program.server) {
        console.error('\n error: --server is required\n');
        return false;
    }
    
    if (!program.database) {
        console.error('\n error: --database is required\n');
        return false;
    }
    
    if (!program.user) {
        console.error('\n error: --user is required\n');
        return false;
    }
    
    if (!program.id) {
        console.error('\n errror: --id is required\n');
        return false;
    }
    
    if (!program.mongodb) {
        console.error('\n error: --mongodb is required\n');
        return false;
    }
    
    return true;
}

function main() {
    program
        .version('0.0.1')
        .option('-s, --server [server]', 'MySQL server')
        .option('-d, --database [database]', 'MySQL database')
        .option('-u, --user [user]', 'MySQL user')
        .option('-p, --password [password]', 'MySQL password')
        .option('-i, --id [id]', 'DDLeye API database ID')
        .option('-m, --mongodb [mongodb]', 'MongoDB connection string')
        .parse(process.argv);
        
    if (!isValid(program)) {
        process.exit(1);
    }
    
    console.log('\n');
    console.log('Started');
    
    var agent = new MySqlAgent(
        program.server, 
        program.database, 
        program.user, 
        program.password,
        program.id,
        program.mongodb);
    
    agent.sync(function (err) {
        if (err) {
            console.log(' error: %s\n', err);
            process.exit(1);
        } else {
            console.log('DONE!');
        }
    });
}

main();