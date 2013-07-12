'use strict';

var Serializer = require('./Serializer'),
  util = require('util'),
  Seq = require('seq');

/**
 * Serializer that handle data serialization without schema
 *
 * @constructor
 */
var SchemalessSerializer = function() {
  Serializer.call(this);
  this.getDataFormat = getDataFormat.bind(this);
};

var getDataFormat = function(mimeType, callback) {
  try {
    var dataFormat = this.getDataFormatForMimeType(mimeType);
    callback(null, dataFormat);
  } catch (error) {
    callback(error);
  }
};

var handleArguments = function(type, args, mimeType, callback) {
  Seq()
    .seq('dataFormat', this.getDataFormat, mimeType, Seq)
    .set(args)
    .parEach(function(arg) {
      this.vars.dataFormat[type](arg, type === 'unserialize' ? undefined : this, this);
    })
    .seq(function(args) {
      callback(null, args);
    })
    .catch(callback);
};

var handleResult = function(type, result, mimeType, callback) {
  Seq()
    .seq('dataFormat', this.getDataFormat, mimeType, Seq)
    .seq(function() {
      this.vars.dataFormat[type](result, type === 'unserialize' ? undefined : this, this);
    })
    .seq(function(result) {
      callback(null, result);
    })
    .catch(callback);
};
util.inherits(SchemalessSerializer, Serializer);

/**
 * Serialize arguments
 *
 * @param {string} method RPC method name
 * @param {Array} args array of arguments to serialize
 * @param {string} mimeType mime type of serialized data
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
 * @param {string} mimeType mime type of data to unserialization
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
 * @param {string} mimeType mime type of serialized data
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
 * @param {string} mimeType mime type of data to unserialization
 * @param {Function} callback
 */
SchemalessSerializer.prototype.unserializeResult = function(method, result, mimeType, callback) {
  handleResult.call(this, 'unserialize', result, mimeType, callback);
};

module.exports = SchemalessSerializer;