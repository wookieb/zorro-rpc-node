'use strict';

var Seq = require('seq'),
  Headers = require('./Headers'),
  MethodTypes = require('./MethodTypes'),
  MessageTypes = require('./MessageTypes');

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

  if (!options.serializer) {
    throw new TypeError('No serializer defined');
  }

  this.transport = options.transport;
  this.serializer = options.serializer;
  this.defaultHeaders = options.headers || new Headers();
  this.forwardHeaders = options.forwardHeaders || ['requestId'];

  this.methods = {};
  this.methods[MethodTypes.BASIC] = {};
  this.methods[MethodTypes.ONE_WAY] = {};
  this.methods[MethodTypes.PUSH] = {};

  this.handler = this.handler.bind(this);
  this.getMethod = getMethod.bind(this);
};

var getMethod = function(method, type, callback) {
  var handler = this.methods[type][method];
  if (typeof handler !== 'function') {
    callback(new Error(
      'Method "'+method+'" does not exists for type '+MethodTypes.getNameForType(type)
    ));
    return;
  }
  callback(null, handler);
};

var requestTypeToMethodType = {};
requestTypeToMethodType[MessageTypes.REQUEST] = MethodTypes.BASIC;
requestTypeToMethodType[MessageTypes.ONE_WAY_CALL] = MethodTypes.ONE_WAY;
requestTypeToMethodType[MessageTypes.PUSH] = MethodTypes.PUSH;

/**
 * Handle incoming request
 * Unserialize arguments, serialize result, handle process of response building
 *
 * @param {object} request
 * @param callback
 */
Server.prototype.handler = function(request, callback) {
  var self = this,
    response = {
      headers: this.defaultHeaders.clone()
    },
    methodType;

  // headers forwarding
  this.forwardHeaders.forEach(function(forwardedHeader) {
    var headerValue = request.headers.get(forwardedHeader);
    if (headerValue) {
      response.headers.set(forwardedHeader, headerValue);
    }
  });

  // PING requests does not need more processing
  if (request.type === MessageTypes.PING) {
    response.type = MessageTypes.PONG;
    callback(null, response);
    return;
  }

  methodType = requestTypeToMethodType[request.type];
  Seq()
    .seq(this.getMethod, request.method, methodType, Seq)
    .seq(function(method) {
      var args = request.args;
      switch (methodType) {
        case MethodTypes.BASIC:
          response.type = MessageTypes.RESPONSE;
          args.push(this, request, response.headers);
          method.apply(this, args);
          return;
        case MethodTypes.PUSH:
          response.type = MessageTypes.PUSH_ACK;
          args.push(this, request, response.headers);
          method.apply(this, args);
          return;
        case MethodTypes.ONE_WAY:
          response.type = MessageTypes.ONE_WAY_CALL_ACK;
          process.nextTick(function() {
            callback(null, response);
          });
          args.push(request);
          method.apply(this, args);
      }
    })
    .seq(function(result) {
      self.serializer.serializeResult(
        request.method,
        result,
        request.headers.get('Content-type'),
        this
      );
    })
    .catch(function(error) {
      response.type = MessageTypes.ERROR;
      self.serializer.serializeResult(
        request.method,
        error,
        request.headers.get('Content-type'),
        this
      );
    })
    .seq(function(result) {
      response.result = result;
      callback(null, response);
    })
    .catch(callback);
};

/**
 * Just runs the server
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
 * Register RPC method
 *
 * @param {string} method name of rpc method
 * @param {string} type of method - one of value available in MethodTypes
 * @param {function} callback that should be call to execute given RPC method
 */
Server.prototype.registerMethod = function(method, type, callback) {
  if (typeof type === 'function') {
    type = MethodTypes.BASIC;
    callback = type;
  }
  this.methods[type][method] = callback;
};

module.exports = Server;