'use strict';
var Headers = require('./Headers'),
    messageTypes = require('./messageTypes'),
    Seq = require('seq');

var createRequest = function(type, method, args, headers) {
    var request = {
        type: type,
        headers: this.defaultHeaders.clone()
    };
    headers && request.headers.addAll(headers);

    if (request.type !== messageTypes.PING) {
        request.method = method;
        request.args = args;
    }
    return request;
};

var performRequest = function(type, method, args, headers, callback) {
    if (!Array.isArray(args)) {
        args = [args];
    }
    if (typeof headers === 'function') {
        callback = headers;
        headers = {};
    }
    if (typeof args === 'function') {
        callback = args;
        args = [];
    }

    try {
        var request = createRequest.call(this, type, method, args, headers);
    } catch (e) {
        callback(e);
        return;
    }

    Seq()
        .seq(this.transport.doRequest, request, Seq)
        .seq(function(result) {
            callback(null, result);
        })
        .catch(callback);
};

/**
 * @param {Object} options
 * @constructor
 */
var Client = function(options) {
    options = options || {};

    if (!options.transport) {
        throw new TypeError('No specified transport layer');
    }

    this.transport = options.transport;
    this.defaultHeaders = options.headers || new Headers();

    this.basic = this.call = performRequest.bind(this, messageTypes.REQUEST);
    this.oneWayCall = performRequest.bind(this, messageTypes.ONE_WAY_CALL);
    this.push = performRequest.bind(this, messageTypes.PUSH);
    this.ping = function(headers, callback) {
        if (headers instanceof Function) {
            callback = headers;
            headers = undefined;
        }
        performRequest.call(this, messageTypes.PING, undefined, undefined, headers, callback);
    }.bind(this);
};

module.exports = Client;

