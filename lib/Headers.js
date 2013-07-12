'use strict';

/**
 * Container for headers
 *
 * @param {array} headers
 * @constructor
 */
var Headers = function(headers) {
  this.headers = {};
  for (var headerName in headers) {
    if (headers.hasOwnProperty(headerName)) {
      this.set(headerName, headers[headerName]);
    }
  }
};

/**
 * Return value of header with given name
 *
 * @param {string} name name of header (case insensitive)
 * @returns {string} undefined if header with given name does not exists
 */
Headers.prototype.get = function(name) {
  return this.headers[name.toLowerCase()];
};
/**
 * Return hash of all headers
 *
 * @returns {Object}
 */
Headers.prototype.getAll = function() {
  return this.headers;
};

/**
 * Set value of header with given name
 *
 * @param {string} name
 * @param {string} value
 */
Headers.prototype.set = function(name, value) {
  this.headers[name.toLowerCase()] = value;
};

Headers.prototype.toString = function() {
  var output = '', headerName;
  for (headerName in this.headers) {
    if (this.headers.hasOwnProperty(headerName)) {
      output += headerName+':'+this.headers[headerName];
    }
  }
  return output;
};

Headers.prototype.clone = function() {
  return new Headers(JSON.parse(JSON.stringify(this.headers)));
};

module.exports = Headers;