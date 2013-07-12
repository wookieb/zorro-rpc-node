'use strict';

var ClientTransport,
  zmq = require('zmq'),
  Puid = require('puid'),
  Seq = require('seq'),
  Headers = require('../../Headers'),
  MessageTypes = require('../../MessageTypes'),
  headersParser = require('../../HeadersParser');

var startCheckPool = function(pool, timeout) {
  if (timeout <= 0) {
    return;
  }
  timeout *= 1000;
  setInterval(function() {
    var entry,
      currentTime = new Date().getTime();
    for (var i in pool) {
      entry = pool[i];
      if (currentTime-entry.time >= timeout) {
        entry.callback(new Error('Timeout reached ('+(timeout / 1000)+'s)'));
        delete pool[i];
      }
    }
  }, 100);
};
var buildResponse = function(data) {
  var response = {},
    type;
  if (!data[0]) {
    throw new Error('Invalid response - no response type');
  }

  type = parseInt(data[0], 10);
  if (!MessageTypes.exists(type)) {
    throw new Error('Invalid response - invalid response type "'+data[0]+'"');
  }

  response.type = type;
  if (response.type === MessageTypes.PONG) {
    return response;
  }

  if (typeof data[1] === 'undefined') {
    throw new Error('Invalid response - no headers');
  }

  response.headers = new Headers(headersParser.parseHeaders(data[1]));
  if (response.type === MessageTypes.ONE_WAY_CALL_ACK) {
    return response;
  }

  if (typeof data[2] === 'undefined') {
    throw new Error('Invalid response - no result body');
  }

  response.result = data[2];
  return response;
};
var startHandleResponse = function(socket, pool) {
  var validResponses = {};
  validResponses[MessageTypes.PING] = MessageTypes.PONG;
  validResponses[MessageTypes.REQUEST] = MessageTypes.RESPONSE;
  validResponses[MessageTypes.ONE_WAY_CALL] = MessageTypes.ONE_WAY_CALL_ACK;
  validResponses[MessageTypes.PUSH] = MessageTypes.PUSH_ACK;

  socket.on('message', function() {
    var transportData,
      requestId = arguments[0].toString('utf8'),
      type = arguments[2].toString('utf8'),
      handler = pool[requestId],
      response;
    if (!handler) {
      return;
    }

    transportData = Array.prototype.slice.call(arguments, 2);
    transportData = transportData.map(function(element) {
      return element.toString('utf8');
    });

    try {
      response = buildResponse(transportData);
      if (response.type !== MessageTypes.ERROR && response.type !== validResponses[handler.type]) {
        throw new Error('Invalid response type for request "'+handler.type+'"');
      }
      handler.callback(null, response);
    } catch (error) {
      handler.callback(error);
    }
    delete pool[requestId];
  });
};

ClientTransport = function(options) {
  var serverAddress;
  options = options || {};
  options.timeout = options.timeout || 5;
  this.idGenerator = new Puid();
  this.pool = {};

  if (!options.server) {
    throw new Error('No server address');
  }

  this.socket = zmq.socket('dealer');
  this.socket.setsockopt(zmq.ZMQ_LINGER, 0);
  this.socket.setsockopt(zmq.ZMQ_RCVTIMEO, options.timeout * 1000);
  serverAddress = options.server;
  if (Array.isArray(serverAddress)) {
    serverAddress.forEach(this.socket.connect, this.socket);
  } else {
    this.socket.connect(serverAddress+'');
  }

  startCheckPool(this.pool, options.timeout);
  startHandleResponse(this.socket, this.pool);
};

/**
 * Perform RPC request
 *
 * @param {object} request
 * @param callback
 */
ClientTransport.prototype.doRequest = function(request, callback) {
  var requestId = this.idGenerator.generate(),
    message = [requestId, request.type];
  request.headers.set('requestId', requestId);

  this.pool[requestId] = {
    time: new Date().getTime(),
    type: request.type,
    method: request.method,
    callback: callback
  };
  if (request.headers) {
    message.push(request.headers+'');
  }
  if (request.method) {
    message.push(request.method, request.args);
  }
  this.socket.send(message);
};

module.exports = ClientTransport;