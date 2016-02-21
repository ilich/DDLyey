var crypto = require('crypto');
var databaseService = require('../services/database');
var config = require('../config/config');
var DateDiff = require('date-diff');

module.exports = function (req, res, next) {
    function accessDenied() {
        res.status(401).json({
            error: 'Unauthorized'
        });
    }
    
    function isOutdatedRequest() {
        var dateStr = req.headers.date;
        if (!dateStr) {
            return true;
        }
        
        var requestDate = new Date(dateStr);
        var diff = new DateDiff(new Date(), requestDate);
        
        // Request cannot last more then a few minutes
        var isOutdated = Math.floor(diff.years()) > 0
            || Math.floor(diff.months()) > 0
            || Math.floor(diff.days()) > 0;
           
        if (isOutdated) {
            return true;
        }
        
        var totalMinutes = Math.floor(diff.hours()) * 60 + Math.floor(diff.minutes());
        return totalMinutes > config.requestLifetime;
    }
    
    function validApiKey(parts, callback) {
        // KEY FORMAT: ddleye:<dbid>:<8 byte random>:sha1_hmac("method+' '+URL+Date+Random", <dbsecret>)
        
        if (parts.length !== 4) {
            return callback(false);
        }
        
        if (parts[0] !== 'ddleye') {
            return callback(false);
        }
        
        databaseService.findDatabaseById(parts[1], function (err, db) {
            if (err || !db) {
                return callback(false);
            }
            
            var check = req.method + ' /api' + req.path + req.headers.date + parts[2];
            var hash = crypto.createHmac('sha1', db.secret).update(check).digest('hex');
            return callback(hash == parts[3]);
        })
    }
    
    // Check that there is authentication header
    var authentication = req.headers.authentication;
    if (!authentication) {
        return accessDenied();
    }
    
    // Check that there is date header and request is not expired
    if (isOutdatedRequest()) {
        return accessDenied();
    }
    
    // Validate API key
    var buffer = new Buffer(authentication, 'base64');
    var decoded = buffer.toString().split(':');
    validApiKey(decoded, function (isValid) {
        if (isValid) {
            return next();
        } else {
            return accessDenied();
        }
    });
};