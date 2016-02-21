var databaseService = require('../services/database');

module.exports = function (req, res, next) {
    databaseService.getDatabases(function (databases) {
        res.locals.databaseList = [];
        databases.forEach(function (db) {
            res.locals.databaseList.push({
                id: db._id,
                name: db.database
            });
        }); 
        
        next();
    });
};