'use strict';
var messageTypes = require('../../messageTypes'),
    headersParser = require('../../Util/headersParser'),
    Headers = require('../../Headers'),
    Seq = require('seq'),
    zmq = require('zmq'),
    EventEmitter = require('events').EventEmitter,
    utils = require('util');

var ServerTransport = function(socket, serializer) {
    if (!'getsockopt' in socket) {
        throw new TypeError('ZeroMQ server transport requires ROUTER socket');
    }

    if (socket.getsockopt(zmq.ZMQ_TYPE) !== zmq.ZMQ_ROUTER) {
        throw new TypeError('Invalid socket type. ROUTER required');
    }

    if (!serializer) {
        throw new TypeError('Serializer instance required');
    }

    this.socket = socket;
    this.serializer = serializer;

    this.handleRequest = handleRequest.bind(this);
    EventEmitter.call(this);
};

ServerTransport.create = function(address, serializer) {
    var socket = zmq.socket('router');
    if (!Array.isArray(address)) {
        address = [address];
    }
    address.forEach(socket.bindSync.bind(socket));
    return new ServerTransport(socket, serializer);
};

utils.inherits(ServerTransport, EventEmitter);

var buildRequest = function(type, headers, method, args, callback) {
    if (!messageTypes.isAllowedForRequest(type)) {
        callback(new Error('Invalid request - invalid message type "'+type+'" for request'));
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
        throw new Error('Invalid request for ZeroMQ socket');
    }

    var args = Array.prototype.slice.call(arguments, 1).map(function(element) {
            return element.toString('utf8');
        }),
        self = this,
        requestType = args[0],
        requestHeaders = args[1] || '',
        requestMethodName = args[2],
        requestArguments = args.slice(3);

    Seq()
        .seq('request', buildRequest, requestType, requestHeaders, requestMethodName, requestArguments, Seq)
        .seq('response', function(request) {
            self.handler(request, this);
        })
        .seq(function(response) {
            if (messageTypes.isResponseTypeWithResult(response.type)) {
                var method = response.type === messageTypes.ERROR ? 'serializeError' : 'serializeResult';
                self.serializer[method].call(
                    self.serializer,
                    method,
                    response.result,
                    response.headers.get('Content-Type'),
                    this
                );
                return;
            }
            this();
        })
        .seq(function(serializedResult) {
            sendResponse.call(self, zeroMQRequestId, this.vars.response, serializedResult);
        })
        .catch(function(error) {
            self.emit('error', error);
        });
};

var sendResponse = function(zid, response, serializedResult) {
    var message = [zid, response.type, response.headers.toString()];
    if (messageTypes.isResponseTypeWithResult(response.type)) {
        message.push(serializedResult);
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
