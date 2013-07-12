'use strict';
var Client,
  Headers = require('./Headers'),
  MessageTypes = require('./MessageTypes'),
  xtend = require('xtend'),
  Seq = require('seq'),
  createRequest,
  doRequest;
/**
 * Creates request for transport layer
 * Request arguments are serialized
 *
 * @param {Object} options request options
 * @param {function} callback
 */
createRequest = function(type, method, args, headers, callback) {
  var request = {
      type: type
    },
    newHeaders = JSON.parse(JSON.stringify(this.defaultHeaders.getAll()));
  if (headers) {
    for (var i in headers) {
      newHeaders[i] = headers[i];
    }
  }
  request.headers = new Headers(newHeaders);

  if (request.type !== MessageTypes.PING) {
    request.method = method;
    this.serializer.serializeArguments(method, args, request.headers.get('Content-Type'),
      function(error, args) {
        request.args = args;
        callback(null, request);
      });
  } else {
    process.nextTick(function() {
      callback(null, request);
    });
  }
};
/**
 * Do request of specified type
 *
 * @param {number} type request type
 * @param {string} method method name to call (undefined for PING request)
 * @param {array} args arguments for method
 * @param {object} headers hash of request headers
 * @param {function} callback
 */
doRequest = function(type, method, args, headers, callback) {
  var self = this;
  if (typeof headers === 'function') {
    callback = headers;
    headers = {};
  }
  if (typeof args === 'function') {
    callback = args;
    args = [];
  }

  Seq()
    .seq(this._createRequest, type, method, args, headers, Seq)
    .seq(function(request) {
      self.transport.doRequest(request, this);
    })
    .seq(function(response) {
      if (response.type === MessageTypes.PONG || response.TYPE === MessageTypes.ONE_WAY_CALL_ACK) {
        this();
      } else {
        self.serializer.unserializeResult(method, response.result, response.headers.get('Content-type'), this);
      }
    })
    .seq(function(result) {
      callback(null, result);
    })
    .catch(callback);
};

/**
 * Zorro RPC Client
 *
 * @param {Object} options
 * @constructor ZorroRpc
 */
Client = function(options) {
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

  this._createRequest = createRequest.bind(this);
};

Client.prototype = {
  constructor: Client,
  call: function(method, args, headers, callback) {
    doRequest.call(this, MessageTypes.REQUEST, method, args, headers, callback);
  },
  oneWayCall: function(method, args, headers, callback) {
    doRequest.call(this, MessageTypes.ONE_WAY_CALL, method, args, headers, callback);
  },
  push: function(method, args, headers, callback) {
    doRequest.call(this, MessageTypes.PUSH, method, args, headers, callback);
  },
  ping: function(callback) {
    var timeBegin = new Date().getTime();
    doRequest.call(this, MessageTypes.PING, '', undefined, undefined, function(error) {
      if (error) {
        callback(error);
        return;
      }
      callback(null, new Date().getTime()-timeBegin);
    });
  }
};

module.exports = Client;

