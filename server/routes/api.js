var util = require('util');
var databaseService = require('../services/database');
var protectApi = require('../middleware/protect-api');
var express = require('express');

function createApiRouter(version) {
    var router = express.Router();
    var uri = util.format('/%s/:database', version);
    
    function createOrUpdateObject(req, res, next) {
        databaseService.createOrUpdateObject(req.params.database, req.body, function (err, objectId) {
            if (err || !objectId) {
                return res.status(400).json({
                    error: err || 'Operation failed'
                });
            }
            
            return res.json({
                id: objectId
            });
        });
    }
    
    function bulkDelete(req, res, next) {
        databaseService.removeObjects(req.params.database, req.body.objects, function (err) {
            console.log(err);
            if (err) {
                return res.status(400).json({
                    error: err || 'Operation failed'
                });
            }
            
            return res.json({
                success: true
            });
        });
    }
    
    router.get(uri, protectApi, function (req, res, next) {
        res.setHeader('Last-Modified', (new Date()).toUTCString());
        
        databaseService.getObjects(req.params.database, function (err, objects) {
            if (err || !objects) {
                return res.status(400).json({
                    error: err ? err.toString() : 'Operation failed'
                });
            }
            
            var result = objects.map(function (obj) {
                return {
                    id: obj._id,
                    name: obj.name,
                    type: obj.type,
                    created: obj.created,
                    modified: obj.modified,
                    checksum: obj.checksum
                };
            });
            
            return res.json(result);
        });
    });
    
    router.post(uri, protectApi, function (req, res, next) {
        if (req.body.action === 'bulk_delete') {
            return bulkDelete(req, res, next);
        } else {
            return createOrUpdateObject(req, res, next);    
        }
            
    });
    
    router.put(uri, protectApi, function (req, res, next) {
        return createOrUpdateObject(req, res, next);  
    });

    return router;
}

module.exports = createApiRouter;