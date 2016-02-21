var crypto = require('crypto');
var util = require('util');
var strftime = require('strftime');

module.exports = {
    getApiKey: function (url, apiId, apiSecret) {
        var time = strftime('%Y %b %d %H:%M:%S', new Date());
        var rnd = crypto.randomBytes(8).toString('hex');
        url = url + time + rnd;
        
        var key = crypto.createHmac('sha1', apiSecret).update(url).digest('hex');
        key = util.format('ddleye:%s:%s:%s', apiId, rnd, key);
        var buffer = new Buffer(key);
        
        return {
            time: time,
            key: buffer.toString('base64')
        };
    }
};