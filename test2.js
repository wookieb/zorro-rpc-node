var zmq = require('zmq'),
  socket = zmq.socket('dealer');

socket.connect('tcp://0.0.0.0:8001');
socket.send(['', 'abc', 1]);