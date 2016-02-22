var crypto = require('crypto');
var strftime = require('strftime');
var async = require('async');
var ObjectID = require('mongodb').ObjectID;
var db = require('../db');
var config = require('../config/config');

function calculateSha1Hmac(text, key) {
    var hash = crypto.createHmac('sha1', key).update(text).digest('hex');
    return hash;
}

function validateDatabaseObjectType(type) {
    return type === 'table' || type === 'view' || type === 'procedure' || type === 'function';
}

function typeId2type(typeId) {
    switch(typeId) {
        case '0':
            return 'table';
        
        case '1':
            return 'view';
            
        case '2':
            return 'procedure';
            
        case '3':
            return 'function';
            
        default:
            return null;
    }
}

function validateChecksum(object) {
    if (!object || !object.checksum || !object.text) {
        return false;
    }
    
    var hash = crypto.createHash('sha1').update(object.text).digest('hex');
    return hash === object.checksum;
}

module.exports = {
    supportedDatabases: function () {
        return [
            {id: 'mysql', text: 'MySQL'}
        ]
    },

    engineName: function (engine) {
        var database = this.supportedDatabases().find(function (d) { return d.id === engine; });
        return database ? database.text : null;
    },

    isValidEngine: function (engine) {
        return this.engineName(engine) !== null;
    },
    
    getDatabases: function (callback) {
        var self = this;
        var results = [];
        
        var databases = db.get().collection('databases');
        var stream = databases.find().sort({'database': 1}).stream();
        
        stream.on('end', function () {
            callback(results);
        });
        
        stream.on('data', function (data) {
            if (data !== null) {
                data.time = strftime('%F %T', data.created);
                data.engineName = self.engineName(data.engine);
                results.push(data);
            }
        });
    },
    
    findDatabaseById: function (id, callback) {
        var self = this;
        var objectId;
        
        try {
            objectId = new ObjectID(id);  
        } catch (err) {
             return callback(err);
        }
        
        var databases = db.get().collection('databases');
        databases.findOne(objectId, function (err, data) {
            if (err) {
                return callback(err);
            }
            
            if (!data) {
                return callback(null, null);
            }
            
            data.time = strftime('%F %T', data.created);
            data.timeModified = data.modified ? strftime('%F %T', data.modified) : 'Not yet';
            data.engineName = self.engineName(data.engine);
            return callback(null, data);
        });
    },
    
    createDatabase: function (database, callback) {
        database.created = new Date();

        var databases = db.get().collection('databases');
        databases.insertOne(database, function (err, r) {
            if (err) {
                return callback(err);
            }
            
            if (!r) {
                return callback(null, null);
            }
            
            database = r.ops[0];
            var key = calculateSha1Hmac(r.insertedId.toHexString(), config.applicationKey);
            databases.update(database, {
                $set: { secret: key }
            }, function (err) {
                if (err) {
                    return callback(err);
                } else {
                    return callback(null, database);
                }
            });
        });
    },
    
    search: function (query, callback) {
        if (!query) {
            return callback([]);
        }
        
        // Build query
        var mongoQuery = {};
        if (query.keywords) {
            if (query.isRegex) {
                mongoQuery['$or'] = [
                    {name: new RegExp(query.keywords, 'i')},
                    {text: new RegExp(query.keywords, 'i')}
                ];
            } else {
                mongoQuery['$text'] = {
                    $search: query.keywords
                }    
            }
            
        }
        
        if (query.database) {
            try {
                mongoQuery.database = new ObjectID(query.database);    
            } catch (err) {
                // Ignore wrong database IDs
            }
        }
        
        if (Array.isArray(query.metadata) && query.metadata.length > 0) {
            var types = []
            for (var i = 0; i < query.metadata.length; i++) {
                var type = typeId2type(query.metadata[i]);
                if (type) {
                    types.push(type);
                }
            }
            
            if (types.length > 0) {
                mongoQuery.type = {
                    $in: types
                };
            }
        }
        
        // Find metedata objects in the database
        var metadata = db.get().collection('metadata');
        var aggregateQry = [
            {
                $match: mongoQuery
            },
            {
                $lookup: {
                    from: 'databases',
                    localField: 'database',
                    foreignField: '_id',
                    as: 'databaseInfo'
                }
            },
            {
                $sort: {
                    'lastModified': -1,
                    'databaseInfo.database': 1,
                    'name': 1
                }
            }
        ];
        
        var stream = metadata.aggregate(aggregateQry).stream();
        
        var objects = []
        stream.on('end', function () {
            return callback(objects);
        });
        
        stream.on('data', function (object) {
            object.time = strftime('%F %T', object.lastModified);
            objects.push(object);
        });
    },
    
    getObjectById: function (objectId, callback) {
        var metadata = db.get().collection('metadata');
        metadata.findOne(new ObjectID(objectId), function (err, object) {
            if (err) {
                return callback(err);
            }    
            
            if (!object) {
                return callback(null, null);
            } else {
                object.time = strftime('%F %T', object.lastModified);
                return callback(null, object);
            }
        });  
    },
    
    getObjects: function (databaseId, type, callback) {
        if (typeof type === 'function') {
            callback = type;
            type = null;
        }
        
        this.findDatabaseById(databaseId, function (err, database) {
            if (err) {
                return callback(err);
            }
            
            if (!database) {
                return callback(null, null);
            }
            
            var metadata = db.get().collection('metadata');
            var query = {
                database: database._id,
            };
            
            if (type != null) {
                query.type = type;    
            }
            
            var objects = [];
            var stream = metadata.find(query).stream();
            
            stream.on('end', function () {
                return callback(null, objects);
            });
            
            stream.on('data', function (data) {
                objects.push(data);
            });
        });
    },
    
    removeObjects: function (databaseId, objectIds, callback) {
        this.findDatabaseById(databaseId, function (err, database) {
            if (err) {
                return callback(err);
            }
            
            if (!database) {
                return callback(null, null);
            }
            
            var metadata = db.get().collection('metadata');
            async.each(objectIds, function (objectId, removed) {
                metadata.deleteOne({_id: new ObjectID(objectId)}, function (err) {
                    if (err) {
                        return removed(err);
                    } else {
                        return removed();
                    }
                })
            }, callback);
        });
    },
    
    // Working with database metadata
    createOrUpdateObject: function (databaseId, object, callback) {
        // Validate type and checksum
        
        if (!object) {
            return callback('Object is not provided');
        }
        
        if(object.type) {
            object.type = object.type.toLowerCase();
        }
        
        if(object.checksum) {
            object.checksum = object.checksum.toLowerCase();
        }
        
        if (!validateDatabaseObjectType(object.type)) {
            return callback('Invalid object type');
        }
        
        if (!validateChecksum(object)) {
            return callback('Invalid checksum');
        }
        
        // Find if target databse exists
        this.findDatabaseById(databaseId, function (err, database) {
            if (err) {
                return callback(err);
            }
            
            if (!database) {
                return callback(null, null);
            }
            
            var metadata = db.get().collection('metadata');
            metadata.findOne({
                    database: database._id, 
                    name: object.name, 
                    type: object.type
                }, 
                function (err, objectInfo) {
                    if (err) {
                        return callback(err);
                    }
                    
                    if (objectInfo) {
                        // Update metadata object
                        
                        metadata.update(objectInfo, {
                            $set: {
                                type: object.type,
                                text: object.text,
                                checksum: object.checksum,
                                lastModified: new Date(),
                                modified: new Date()
                            }    
                        }, function (err) {
                            if (err) {
                                return callback(err);
                            } else {
                                return callback(null, objectInfo._id);
                            }   
                        });
                    } else {
                        // Add object to the database metadata list
                        
                        object.database = database._id;
                        object.lastModified = new Date();
                        
                        metadata.insertOne(object, function (err, r) {
                            if (err) {
                                return callback(err);
                            }
                            
                            if (!r) {
                                return callback(null, null);
                            }
                            
                            objectInfo = r.ops[0];
                            return callback(null, objectInfo._id);
                        });
                    }
                }
            );
        });  
    },
};