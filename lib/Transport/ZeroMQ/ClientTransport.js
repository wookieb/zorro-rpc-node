'use strict';

var zmq = require('zmq'),
    Puid = require('puid'),
    errors = require('../../errors'),
    format = require('format'),
    messageTypes = require('../../messageTypes'),
    headersParser = require('../../Util/headersParser'),
    EventEmitter = require('events').EventEmitter,
    utils = require('util'),
    Headers = require('../../Headers');

var puid = new Puid(true);

var timeoutRequest = function(id) {
        var callbackEntry = this[id];
        if (callbackEntry) {
            clearTimeout(callbackEntry.timeout);
            callbackEntry.callback(errors.TimeoutError(format('Request "%s" timeout', id)));
        }
        delete this[id];
    },
    respond = function(id, response) {
        var callbackEntry = this[id];
        if (callbackEntry) {
            clearTimeout(callbackEntry.timeout);
            callbackEntry.callback(undefined, response);
        }
        delete this[id];
    },
    onResponse = function() {
        try {
            if (arguments.length < 2) {
                throw new error.TransportError('Invalid response received');
            }

            var args = Array.prototype.slice.call(arguments, 1),
                response = {
                    type: args[0].toString(),
                    headers: new Headers(headersParser.parseHeaders(args[1].toString('utf8')))
                },
                requestId = response.headers.get('Request-Id');
            if (!requestId) {
                throw new errors.TransportError('Response without Request-Id header received');
            }

            if (messageTypes.isResponseTypeWithResult(response.type)) {
                response.result = args[2].toString('utf8');
            }
            respond.call(this._requestCallbacks, requestId, response);
        } catch (error) {
            this.emit('error', error);
            return;
        }
    };

var sendRequest = function(request) {
    var message = ['', request.type, request.headers.toString()];
    if (request.type !== messageTypes.PING) {
        message.push(request.method);
        message.push.apply(message, request.args);
    }
    this.socket.send(message);
};

var ClientTransport = function(socket, options) {

    options = options || {};
    if (!'getsockopt' in socket) {
        throw new TypeError('ZeroMQ server transport requires ROUTER socket');
    }

    if (socket.getsockopt(zmq.ZMQ_TYPE) !== zmq.ZMQ_DEALER) {
        throw new TypeError('Invalid socket type. DEALER required');
    }

    this.socket = socket;
    this._timeout = -1;
    this._requestCallbacks = {};

    this.setTimeout(options.timeout || 5000);
    this.socket.on('message', onResponse.bind(this));

    EventEmitter.call(this);
};

utils.inherits(ClientTransport, EventEmitter);

ClientTransport.create = function(address, options) {
    var socket = zmq.socket('dealer');
    if (!Array.isArray(address)) {
        address = [address];
    }
    address.forEach(socket.connect.bind(socket));
    return new ClientTransport(socket, options);
};

ClientTransport.prototype.setTimeout = function(timeout) {
    timeout = parseInt(timeout, 10);
    this._timeout = timeout;
    this.socket.setsockopt(zmq.ZMQ_LINGER, timeout);
};

ClientTransport.prototype.getTimeout = function() {
    return this._timeout;
};

ClientTransport.prototype.doRequest = function(request, callback) {
    var requestId = puid.generate();
    request.headers.set('Request-Id', requestId);

    var callbackEntry = this._requestCallbacks[requestId] = {
        callback: callback,
        timeout: undefined
    };
    if (this._timeout > 0) {
        callbackEntry.timeout = setTimeout(timeoutRequest.bind(this._requestCallbacks, requestId), this._timeout);
    }

    sendRequest.call(this, request);
};

module.exports = ClientTransport;
