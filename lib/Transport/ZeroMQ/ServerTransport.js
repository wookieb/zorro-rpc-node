'use strict';
var MessageTypes = require('../../MessageTypes'),
  HeadersParser = require('../../HeadersParser'),
  Headers = require('../../Headers'),
  Seq = require('seq'),
  zmq = require('zmq'),
  EventEmitter = require('event').EventEmitter,
  utils = require('util');

var ServerTransport = function(address) {
  this.socket = zmq.socket('router');
  this.socket.bind(address);

  this.handleRequest = handleRequest.bind(this);
  EventEmitter.call(this);
};

utils.inherits(ServerTransport, EventEmitter);

var handleRequest = function(zid) {
  var args = Array.prototype.slice.call(arguments, 3),
    self = this,
    requestId;

  args = args.map(function(element) {
    return element.toString('utf8');
  });

  Seq()
    .seq(buildRequest, args[0], args[1], args[2], args.slice(3), Seq)
    .seq(function(request) {
      requestId = request.headers.get('requestId');
      if (!requestId) {
        this(new Error('No request id'));
        return;
      }
      // calling
      self.handler(request, this);
    })
    .seq(function(response) {
      sendResponse.call(self, zid, requestId, response, this);
    })
    .catch(function() {
      console.error(arguments[0]);
    });
};

var buildRequest = function(type, headers, method, args, callback) {
  type = parseInt(type, 10);
  if (!MessageTypes.isAvailableForRequest(type)) {
    callback(new Error('Invalid message type "'+type+'" for request'));
    return;
  }
  var request = {
    type: type
  };
  if (type === MessageTypes.PING) {
    callback(null, request);
    return;
  }
  request.headers = new Headers(HeadersParser.parseHeaders(headers));
  request.method = method;
  request.args = args;
  callback(null, request);
};

var sendResponse = function(zid, requestId, response) {
  var message = [zid, requestId, '', response.type];
  message.push(response.headers.toString());

  if (!response.result) {
    this.socket.send(message);
    return;
  }
  message.push(response.result);
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