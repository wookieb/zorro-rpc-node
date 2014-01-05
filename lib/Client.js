'use strict';
var Headers = require('./Headers'),
    messageTypes = require('./messageTypes'),
    Seq = require('seq'),
    EventEmitter = require('events').EventEmitter,
    utils = require('util');

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

    var self = this;
    Seq()
        .seq('response', this.transport.doRequest, request, Seq)
        .seq(function(response) {
            // no need to unserialize... undefined :)
            if (response.type === messageTypes.PONG) {
                callback();
                return;
            }

            var methodName = 'unserializeResult';
            if (response.type === messageTypes.ERROR) {
                methodName = 'unserializeError';
            }
            self.serializer[methodName](request.method, response.result, response.headers.get('Content-Type'), this);
        })
        .seq(function(result) {
            var response = this.vars.response;
            if (response.type === messageTypes.ERROR) {
                callback(result);
                return;
            }
            callback(undefined, result);
        })
        .catch(function(error) {
            callback(error);
        });
};

/**
 * @param {Object} options
 * @constructor
 */
var Client = function(options) {
    options = options || {};

    if (!options.transport) {
        throw new TypeError('No client transport defined');
    }

    if (!options.serializer) {
        throw new TypeError('No serializer defined');
    }

    this.transport = options.transport;
    this.serializer = options.serializer;
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

    EventEmitter.call(this);

    if ('on' in this.transport) {
        this.transport.on('error', this.emit.bind(this, 'error'));
    }
};

utils.inherits(Client, EventEmitter);

module.exports = Client;

