'use strict';
var zmq = require('zmq');

var socket = zmq.socket('dealer');
socket.connect('tcp://127.0.0.1:9000');

socket.send(['request', '', 'getUsers']);
socket.on('message', function() {
    console.log('response', Array.prototype.slice.call(arguments, 0).map(function(e) { return e.toString() }));
});
