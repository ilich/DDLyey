var protectWeb = require('../middleware/protect-web');
var databaseService = require('../services/database');
var async = require('async');
var express = require('express');
var router = express.Router();

router.get('/', protectWeb, function(req, res, next) {
    databaseService.getDatabases(function (databases) {
        res.render('database/index', {
            databases: databases
        });         
    });
    
});

router.get('/create-database', protectWeb, function (req, res, next) {
    var engines = databaseService.supportedDatabases();
    
    res.render('database/form', {
        csrfToken: req.csrfToken(),
        title: 'New database',
        engines: engines,
        errors: [],
        database: '',
        engine: '',
        notes: ''
    });
});

router.post('/create-database', protectWeb, function (req, res, next) {
    var database = req.body.database.trim(),
        engine = req.body.engine.trim(),
        notes = req.body.notes.trim();
    
    var engines = databaseService.supportedDatabases();
    var errors = [];
        
    if (database === '') {
        errors.push('Database name is required.');
    }
    
    if (engine === '') {
        errors.push('Database engine is required.');
    }
    
    if (!databaseService.isValidEngine(engine)) {
        errors.push('Database engine is not supported.');
    }

    if (errors.length > 0) {
        return res.render('database/form', {
            csrfToken: req.csrfToken(),
            title: 'New database',
            engines: engines,
            errors: errors,
            database: database,
            engine: engine,
            notes: notes
        });    
    } else {
        databaseService.createDatabase({
            database: database,
            engine: engine,
            notes: notes
        }, function (err, db) {
            if (err || db === null) {
                return res.render('database/form', {
                    csrfToken: req.csrfToken(),
                    title: 'New database',
                    engines: engines,
                    errors: ['Cannot register the database in the system.'],
                    database: database,
                    engine: engine,
                    notes: notes
                });     
            } else {
                return res.redirect('/' + db._id);
            }
        });
    }
});

router.get('/:database', protectWeb, function (req, res, next) {
    var dbId = req.params.database;
    databaseService.findDatabaseById(dbId, function (err, database) {
        if (err || !database) {
            // Forward request to 404 handler (see app.js)
            return next();
        }
        
        database.metadata = {}
        async.each(['table', 'view', 'procedure', 'function'], function (type, callback) {
            databaseService.getObjects(database._id, type, function (err, objects) {
                if (err || !objects) {
                    return callback(err);
                }
                
                database.metadata[type] = objects;
                return callback();
            });
        }, function (err, result) {
            if (err) {
                return next();
            } else {
                return res.render('database/view', {
                    db: database,
                    scripts: ['/js/view-database.js']
                });
            }
        });
    })
});

module.exports = router;
