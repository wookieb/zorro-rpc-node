'use strict';

var Seq = require('seq'),
    Headers = require('./Headers'),
    methodTypes = require('./methodTypes'),
    messageTypes = require('./messageTypes'),
    EventEmitter = require('events').EventEmitter,
    util = require('util'),
    format = require('format');

/**
 * Wraps zorro rpc layers into RPC server
 *
 * @param {Object} options
 * @constructor
 */
var Server = function(options) {
    options = options || {};

    var transport = options.transport;

    if (!transport || (Array.isArray(transport) && transport.length === 0)) {
        throw new TypeError('No transport layer defined');
    }

    if (!options.serializer) {
        throw new TypeError('No serializer defined');
    }

    this.transport = Array.isArray(transport) ? transport : [transport];
    this.defaultHeaders = options.headers || new Headers();
    this.serializer = options.serializer;
    this.forwardedHeaders = ['request-id'].concat(Array.isArray(options.forwardedHeaders) ? options.forwardedHeaders : []);

    this.methods = {};
    this.methods[methodTypes.BASIC] = {};
    this.methods[methodTypes.ONE_WAY] = {};
    this.methods[methodTypes.PUSH] = {};

    this.handler = this.handler.bind(this);
    this.getMethod = getMethod.bind(this);

    EventEmitter.call(this);
    this.transport.forEach(function(transport) {
        transport.on('error', this.emit.bind(this, 'error'));
    }, this);
};

util.inherits(Server, EventEmitter);

var getMethod = function(method, type, callback) {
    var handler = this.methods[type][method];
    if (typeof handler !== 'function') {
        callback(new Error(format('Method "%s" does not exists for type "%s"', method, type)));
        return;
    }
    callback(null, handler);
};

var forwardHeaders = function(request, response) {
    // headers forwarding
    this.forwardedHeaders.forEach(function(forwardedHeader) {
        var headerValue = request.headers.get(forwardedHeader);
        if (headerValue) {
            response.headers.set(forwardedHeader, headerValue);
        }
    });
};

/**
 * Handle incoming request
 * Unserialize arguments, serialize result, handle process of response building
 *
 * @param {object} request
 * @param callback
 */
Server.prototype.handler = function(request, callback) {
    try {
        var response = {
                headers: this.defaultHeaders.clone(),
                type: messageTypes.getResponseTypeForRequestType(request.type)
            },
            methodType = methodTypes.getMethodTypeForRequestType(request.type);

        forwardHeaders.call(this, request, response);
    } catch (e) {
        callback(e);
        return;
    }

    // PING requests does not need more processing
    if (request.type === messageTypes.PING) {
        response.type = messageTypes.PONG;
        callback(null, response);
        return;
    }

    var self = this;

    var serializeAndSend = function(response) {
        Seq()
            .seq(function() {
                var method = 'serializeResult';
                if (response.type === messageTypes.ERROR) {
                    method = 'serializeError';
                }
                self.serializer[method](request.method, response.result, response.headers.get('Content-Type'), this);
            })
            .seq(function(result) {
                response.result = result;
                callback(null, response);
            })
            .catch(self.emit.bind(this, 'error'));
    };

    Seq()
        .seq(this.getMethod, request.method, methodType, Seq)
        .seq(function(method) {
            var args = request.args;
            switch (methodType) {
                case methodTypes.BASIC:
                case methodTypes.PUSH:
                    args.push(this, request, response.headers);
                    method.apply(undefined, args);
                    return;
                case methodTypes.ONE_WAY:
                    process.nextTick(function() {
                        callback(null, response);
                    });
                    args.push(request);
                    method.apply(undefined, args);
                    return;
            }
        })
        .seq(function(result) {
            response.result = result;
            serializeAndSend(response);
        })
        .catch(function(error) {
            if (error instanceof Error) {
                error.stack = [];
            }
            response.type = messageTypes.ERROR;
            response.result = error;
            serializeAndSend(response);
        })

};

/**
 * Runs the server
 */
Server.prototype.run = function() {
    this.transport.forEach(function(transport) {
        transport.startListen(this.handler);
    }, this);
};

/**
 * Stops the server
 */
Server.prototype.stop = function() {
    this.transport.forEach(function(transport) {
        transport.stopListen();
    });
};

/**
 * Registers RPC method
 *
 * @param {string} method name of rpc method
 * @param {string} type of method - one of value available in methodTypes
 * @param {function} callback method function
 */
Server.prototype.registerMethod = function(method, type, callback) {
    if (typeof type === 'function') {
        callback = type;
        type = methodTypes.BASIC;
    }
    if (!methodTypes.exists(type)) {
        throw new Error(format('Method type "%s" does not exists', type));
    }
    this.methods[type][method] = callback;
};

/**
 * Registers provided list of RPC methods
 *
 * @param {Object} methods
 */
Server.prototype.registerMethods = function(methods) {
    for (var methodName in methods) {
        var method = methods[methodName],
            callback,
            type = 'basic';
        if (typeof method === 'Function') {
            callback = method;
        } else {
            callback = method.callback || method.cb;
            type = method.type;
        }
        this.registerMethod(methodName, type, callback);
    }
};

Server.prototype.getMethods = function() {
    var result = [];
    for (var type in this.methods) {
        var methods = this.methods[type];
        for (var methodName in methods) {
            result.push({
                type: type,
                name: methodName,
                callback: methods[methodName]
            });
        }
    }
    return result;
};

module.exports = Server;
