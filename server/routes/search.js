var protectWeb = require('../middleware/protect-web');
var databaseService = require('../services/database');
var express = require('express');
var router = express.Router();

function parseQuery(req) {
    var keywords = req.query.q,
        database = req.query.d,
        metadata = req.query.t,
        isRegex = req.query.r;
    
    if (!keywords) {
        keywords = ''
    } else {
        keywords = keywords.trim();
    }

    isRegex = !!isRegex;    
    
    if (!database) {
        database = ''
    } else {
        database = database.trim();
    }
    
    if (!metadata) {
        metadata = [];
    } else if (!Array.isArray(metadata)) {
        metadata = [metadata];
    }
    
    return {
        isRegex: isRegex,
        keywords: keywords,
        database: database,
        metadata: metadata
    }
}

router.get('/', protectWeb, function (req, res, next) {
    databaseService.getDatabases(function (databases) {
        var query = parseQuery(req);
        
        var customScripts = [];
        if (query.database !== '' || query.metadata.length > 0) {
            customScripts.push('$(document).ready(function () { $(\".advanced-search\").show(); });')
        }
        
        if (query.keywords !== '') {
            databaseService.search(query, function (result) {
                return res.render('search/search', {
                    databases: databases,
                    query: query,
                    results: result,
                    scripts: ['/js/search.js'],
                    customScripts: customScripts
                });    
            });
        } else {
            return res.render('search/search', {
                databases: databases,
                query: query,
                results: [],
                scripts: ['/js/search.js'],
                customScripts: customScripts
            });    
        }
    });
    
});

module.exports = router;