var Server = require('./lib/Server'),
  Transport = require('./lib/Transport/ZeroMQ/ServerTransport'),
  SchemalessSerializer = require('./lib/Serializer/SchemalessSerializer'),
  JsonDataFormat = require('./lib/Serializer/DataFormat/JsonDataFormat'),
  MethodTypes = require('./lib/MethodTypes');

var serializer = new SchemalessSerializer();
serializer.defaultDataFormat = new JsonDataFormat();

var server = new Server({
  transport: new Transport('tcp://0.0.0.0:8001'),
  serializer: serializer
});

server.registerMethod('test', MethodTypes.BASIC, function(arg, callback) {
  "use strict";
  callback(null, 'hello '+arg);
});

server.run();