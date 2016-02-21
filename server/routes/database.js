var protectWeb = require('../middleware/protect-web');
var databaseService = require('../services/database');
var express = require('express');
var router = express.Router();

router.get('/', protectWeb, function(req, res, next) {
    // TODO
    res.render('database/index');
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
                return res.redirect('/');
            }
        });
    }
    
});

module.exports = router;
