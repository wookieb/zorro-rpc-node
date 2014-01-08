'use strict';

var Serializer = require('./Serializer'),
    util = require('util'),
    Seq = require('seq');

/**
 * Serializer that handles data serialization/deserialization without schema
 *
 * @constructor
 */
var SchemalessSerializer = function(defaultDataFormat) {
    Serializer.call(this);
    this.getDataFormat = getDataFormat.bind(this);
    if (defaultDataFormat) {
        this.defaultDataFormat = defaultDataFormat;
    }
};

var getDataFormat = function(mimeType, callback) {
    try {
        var dataFormat = this.getDataFormatForMimeType(mimeType);
    } catch (error) {
        callback(error);
        return;
    }
    callback(null, dataFormat);
};

var handleArguments = function(type, args, mimeType, callback) {
    if (typeof mimeType === 'function') {
        callback = mimeType;
        mimeType = undefined;
    }
    Seq()
        .seq('dataFormat', this.getDataFormat, mimeType, Seq)
        .set(args)
        .seqMap(function(arg) {
            this.vars.dataFormat[type](arg, this);
        })
        .unflatten()
        .seq(function(args) {
            callback(null, args);
        })
        .catch(callback);
};

var handleResult = function(type, result, mimeType, callback) {
    if (typeof mimeType === 'function') {
        callback = mimeType;
        mimeType = undefined;
    }
    Seq()
        .seq('dataFormat', this.getDataFormat, mimeType, Seq)
        .seq(function() {
            this.vars.dataFormat[type](result, this);
        })
        .seq(function(result) {
            callback(null, result);
        })
        .catch(callback);
};

var handleError = handleResult;

util.inherits(SchemalessSerializer, Serializer);

/**
 * @param {string} method RPC method name
 * @param {Array} args array of arguments to serialize
 * @param {string} [mimeType] mime type
 * @param {Function} callback
 */
SchemalessSerializer.prototype.serializeArguments = function(method, args, mimeType, callback) {
    handleArguments.call(this, 'serialize', args, mimeType, callback);
};

/**
 * Unserialize arguments
 *
 * @param {string} method RPC method name
 * @param {Array} args array of string to unserialize
 * @param {string} [mimeType] mime type of data to unserialization
 * @param {Function} callback
 */
SchemalessSerializer.prototype.unserializeArguments = function(method, args, mimeType, callback) {
    handleArguments.call(this, 'unserialize', args, mimeType, callback);
};

/**
 * Serialize result of RPC call
 *
 * @param {string} method RPC method name
 * @param {Object} result result object to serialize
 * @param {string} [mimeType] mime type of serialized data
 * @param {Function} callback
 */
SchemalessSerializer.prototype.serializeResult = function(method, result, mimeType, callback) {
    handleResult.call(this, 'serialize', result, mimeType, callback);
};

/**
 * Unserialize result of RPC call
 *
 * @param {string} method RPC method name
 * @param {string} result result string to unserialize
 * @param {string} [mimeType] mime type of data to unserialization
 * @param {Function} callback
 */
SchemalessSerializer.prototype.unserializeResult = function(method, result, mimeType, callback) {
    handleResult.call(this, 'unserialize', result, mimeType, callback);
};

/**
 * Unserialize error string
 *
 * @param {string} method RPC method name
 * @param {string} error error string to unserialize
 * @param {string} [mimeType] mime type of data to unserialization
 * @param {Function} callback
 */
SchemalessSerializer.prototype.unserializeError = function(method, error, mimeType, callback) {
    handleError.call(this, 'unserialize', error, mimeType, callback);
};

/**
 * Serializer error
 *
 * @param {string} method RPC method name
 * @param {Error} error error to serialize
 * @param {string} [mimeType] mime type of data to serialization
 * @param {Function} callback
 */
SchemalessSerializer.prototype.serializeError = function(method, error, mimeType, callback) {
    handleError.call(this, 'serialize', error, mimeType, callback);
};


module.exports = SchemalessSerializer;
