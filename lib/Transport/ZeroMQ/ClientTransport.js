'use strict';

var zmq = require('zmq');

var Client = function(socket, serializer) {
    this.socket = socket;
    this.serializer = serializer;
};

Client.prototype.doRequest = function(request, callback) {

};

module.exports = Client;
