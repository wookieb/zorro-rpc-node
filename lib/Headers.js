'use strict';

/**
 * Container for headers
 *
 * @param {array} headers
 * @constructor
 */
var Headers = function(headers) {
    this.headers = {};
    this.addAll(headers);
};

/**
 * Adds array of headers
 *
 * @param {array} headers
 */
Headers.prototype.addAll = function(headers) {
    if (headers instanceof Headers) {
        headers = headers.getAll();
    }

    for (var headerName in headers) {
        if (headers.hasOwnProperty(headerName)) {
            this.set(headerName, headers[headerName]);
        }
    }
};

/**
 * Returns value of header
 *
 * @param {string} name name of header (case insensitive)
 * @returns {string} undefined if header with given name does not exists
 */
Headers.prototype.get = function(name) {
    return (this.headers[name.toLowerCase()] || {}).value;
};

/**
 * Returns hash of all headers
 *
 * @returns {Object}
 */
Headers.prototype.getAll = function() {
    var headers = {};
    for (var i in this.headers) {
        var header = this.headers[i];
        headers[header.name] = header.value;
    }
    return headers;
};

Headers.prototype.unset = function(name) {
    delete this.headers[name.toLowerCase()];
};

/**
 * Sets value of header
 *
 * @param {string} name
 * @param {string} value
 */
Headers.prototype.set = function(name, value) {
    this.headers[name.toLowerCase()] = {
        name: name,
        value: value
    };
};

Headers.prototype.toString = function() {
    var output = '';
    for (var i in this.headers) {
        var header = this.headers[i];
        output += header.name+':'+header.value+"\n";
    }
    return output;
};

Headers.prototype.clone = function() {
    return new Headers(this.getAll());
};

module.exports = Headers;
