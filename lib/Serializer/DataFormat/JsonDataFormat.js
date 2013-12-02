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
        if (data instanceof Error) {
            data = this.getErrorData(data);
        }
        var serializedData = JSON.stringify(data);
    } catch (error) {
        callback(error);
        return;
    }
    callback(null, serializedData);
};

JsonDataFormat.prototype.getErrorData = function(error) {
    return Object.getOwnPropertyNames(error)
        .reduce(function(initial, key) {
            initial[key] = error[key];
            return initial;
        }, {});
};

/**
 * Unserialize string to
 * @param {string} data string to unserialize
 * @param {Function} callback
 */
JsonDataFormat.prototype.unserialize = function(data, callback) {
    var parsed;
    try {
        parsed = JSON.parse(data);
    } catch (error) {
        callback(error);
        return;
    }
    callback(null, parsed);
};

module.exports = JsonDataFormat;
