'use strict';

var Seq = require('seq'),
    Headers = require('./Headers'),
    methodTypes = require('./methodTypes'),
    messageTypes = require('./messageTypes'),
    EventEmitter = require('events').EventEmitter,
    util = require('util');

/**
 * Wraps zorro rpc layers into RPC server
 *
 * @param {Object} options
 * @constructor
 */
var Server = function(options) {
    options = options || {};

    if (!options.transport) {
        throw new TypeError('No specified transport layer');
    }

    this.transport = options.transport;
    this.defaultHeaders = options.headers || new Headers();
    this.forwardHeaders = ['request-id'].concat(Array.isArray(options.headers) ? options.headers : []);

    this.methods = {};
    this.methods[methodTypes.BASIC] = {};
    this.methods[methodTypes.ONE_WAY] = {};
    this.methods[methodTypes.PUSH] = {};

    this.handler = this.handler.bind(this);
    this.getMethod = getMethod.bind(this);

    EventEmitter.call(this);
};

util.inherits(Server, EventEmitter);

var getMethod = function(method, type, callback) {
    var handler = this.methods[type][method];
    if (typeof handler !== 'function') {
        callback(new Error(
            'Method "'+method+'" does not exists for type "'+type+'"'
        ));
        return;
    }
    callback(null, handler);
};

var forwardHeaders = function(request, response) {
    // headers forwarding
    this.forwardHeaders.forEach(function(forwardedHeader) {
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
        .catch(function(error) {
            response.type = messageTypes.ERROR;
            response.result = error;
        })
        .seq(function(result) {
            if (response.type !== messageTypes.ERROR) {
                response.result = result;
            }
            callback(null, response);
        })
        .catch(this.emit.bind(this, 'error'));
};

/**
 * Runs the server
 */
Server.prototype.run = function() {
    this.transport.startListen(this.handler);
};

/**
 * Stops the server
 */
Server.prototype.stop = function() {
    this.transport.stopListen();
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
        throw new Error('Method type "'+type+'" does not exists');
    }
    this.methods[type][method] = callback;
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
