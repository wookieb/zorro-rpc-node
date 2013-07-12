'use strict';

var xtend = require('xtend');

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
  var serializedData;
  try {
    serializedData = JSON.stringify(data);
  } catch (error) {
    callback(error);
    return;
  }
  callback(null, serializedData);
};

/**
 * Unserialize string to
 * @param {string} data string to unserialize
 * @param {Object} object target object where data should be placed
 * @param {Function} callback
 */
JsonDataFormat.prototype.unserialize = function(data, object, callback) {
  callback = typeof object === 'function' ? object : callback;

  var parsed;
  try {
    parsed = JSON.parse(data);
  } catch (error) {
    callback(error);
    return;
  }
  if (object) {
    parsed = xtend(object, parsed);
  }
  callback(null, parsed);
};

module.exports = JsonDataFormat;