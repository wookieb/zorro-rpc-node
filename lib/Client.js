'use strict';
var Headers = require('./Headers'),
    messageTypes = require('./messageTypes'),
    Seq = require('seq'),
    EventEmitter = require('events').EventEmitter,
    utils = require('util'),
    errors = require('./errors'),
    format = require('format');

var createRequest = function(type, method, args, headers, callback) {
    try {
        var request = {
            type: type,
            headers: this.defaultHeaders.clone()
        };
        headers && request.headers.addAll(headers);

        if (request.type !== messageTypes.PING) {
            request.method = method;
            request.args = args;
        }

        if (request.type === messageTypes.PING) {
            request.time = (new Date()).getTime();
        }

    } catch (error) {
        callback(error);
        return;
    }

    if (request.args === undefined) {
        callback(undefined, request);
        return;
    }

    this.serializer.serializeArguments(request.method, request.args, request.headers.get('content-type'),
        function(error, serializedArguments) {
            if (error) {
                callback(error);
                return;
            }
            request.args = serializedArguments;
            callback(undefined, request);
        });
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

    var self = this;
    Seq()
        .seq('request', createRequest.bind(this), type, method, args, headers, Seq)
        .seq('response', function() {
            self.transport.doRequest(this.vars.request, this);
        })
        .seq(function(response) {

            // no need to unserialize... undefined :)
            if (response.type === messageTypes.PONG) {
                callback(undefined, (new Date()).getTime() - this.vars.request.time);
                return;
            }

            var request = this.vars.request,
                validResponseMessageType = messageTypes.getResponseTypeForRequestType(request.type);

            if (response.type !== messageTypes.ERROR && response.type !== validResponseMessageType) {
                var msg = format('Invalid response type "%s" for request type "%s"', response.type, request.type)
                callback(new Error(msg));
                return;
            }

            if (!messageTypes.isResponseTypeWithResult(response.type)) {
                this(undefined, undefined);
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
                if (!(result instanceof Error)) {
                    var error = result,
                        msg = format('Error caught during execution of method "%s"', this.vars.request.method);
                    result = new errors.ResponseError(msg);
                    result.error = error;
                }
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

    this.basic = this.basicCall = this.call = performRequest.bind(this, messageTypes.REQUEST);
    this.oneWay = this['one-way'] = this.oneWayCall = performRequest.bind(this, messageTypes.ONE_WAY);
    this.push = this.pushCall = performRequest.bind(this, messageTypes.PUSH);
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

