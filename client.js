var zmq = require('zmq'),
  sock = zmq.socket('dealer');

sock.connect('tcp://0.0.0.0:8000');
sock.setsockopt(zmq.ZMQ_RCVTIMEO, 2000);
sock.setsockopt(zmq.ZMQ_LINGER, 0);



