'use strict';

/**
 * JSON serialization format
 *
 * @constructor
 */
var JsonDataFormat = function() {
};

JsonDataFormat.prototype.mimeTypes = ['application/json'];
/**
 * Serialize data to string
 *
 * @param {Object} data
 * @param {Function} callback
 */
JsonDataFormat.prototype.serialize = function(data, callback) {
    try {
        var replacer = undefined;
        if (data instanceof Error) {
            replacer = Object.getOwnPropertyNames(data);
        }
        var serializedData = JSON.stringify(data, replacer)+'';
    } catch (error) {
        callback(error);
        return;
    }
    callback(null, serializedData);
};

/**
 * Unserialize string to
 * @param {string} data string to unserialize
 * @param {Function} callback
 */
JsonDataFormat.prototype.unserialize = function(data, callback) {
    var parsed;
    try {
        if (data !== 'undefined') {
            parsed = JSON.parse(data);
        }
    } catch (error) {
        callback(error);
        return;
    }
    callback(null, parsed);
};

module.exports = JsonDataFormat;
