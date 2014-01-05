'use strict';
var messageTypes = require('../../messageTypes'),
    headersParser = require('../../Util/headersParser'),
    Headers = require('../../Headers'),
    Seq = require('seq'),
    zmq = require('zmq'),
    EventEmitter = require('events').EventEmitter,
    utils = require('util'),
    format = require('format'),
    errors = require('../../errors');

var ServerTransport = function(socket) {
    if (!'getsockopt' in socket) {
        throw new TypeError('ZeroMQ server transport requires ROUTER socket');
    }

    if (socket.getsockopt(zmq.ZMQ_TYPE) !== zmq.ZMQ_ROUTER) {
        throw new TypeError('Invalid socket type. ROUTER required');
    }

    this.socket = socket;
    this.handleRequest = handleRequest.bind(this);
    EventEmitter.call(this);
};

ServerTransport.create = function(address) {
    var socket = zmq.socket('router');
    if (!Array.isArray(address)) {
        address = [address];
    }
    address.forEach(socket.bindSync.bind(socket));
    return new ServerTransport(socket);
};

utils.inherits(ServerTransport, EventEmitter);

var buildRequest = function(type, headers, method, args, callback) {
    if (!messageTypes.isAllowedForRequest(type)) {
        callback(new error.TransportError(format('Invalid request - invalid message type "%s" for request', type)));
        return;
    }
    var request = {
        type: type,
        headers: new Headers(headersParser.parseHeaders(headers)),
        method: method
    };

    if (type === messageTypes.PING) {
        callback(null, request);
        return;
    }
    request.method = method;
    request.args = args;
    callback(null, request);
};

var handleRequest = function(zeroMQRequestId) {
    if (arguments.length < 2) {
        throw new errors.TransportError('Invalid request for ZeroMQ socket');
    }

    var args = Array.prototype.slice.call(arguments, 2).map(function(element) {
            return element.toString('utf8');
        }),
        self = this,
        requestType = args[0],
        requestHeaders = args[1] || '',
        requestMethodName = args[2],
        requestArguments = args.slice(3);

    Seq()
        .seq(buildRequest, requestType, requestHeaders, requestMethodName, requestArguments, Seq)
        .seq(function(request) {
            self.handler(request, this);
        })
        .seq(function(response) {
            sendResponse.call(self, zeroMQRequestId, response);
        })
        .catch(function(error) {
            self.emit('error', error);
        });
};

var sendResponse = function(zid, response) {
    var message = [zid, '', response.type, response.headers.toString()];
    if (messageTypes.isResponseTypeWithResult(response.type)) {
        message.push(response.result);
    }
    this.socket.send(message);
};

ServerTransport.prototype.startListen = function(handler) {
    if (this.handler) {
        this.stopListen();
    }
    this.handler = handler;
    this.socket.on('message', this.handleRequest);
};

ServerTransport.prototype.stopListen = function() {
    this.socket.off('message', this.handleRequest);
    this.handler = undefined;
};

module.exports = ServerTransport;
