'use strict';
var Server = require('./lib/Server'),
    ZeroMQServerTransport = require('./lib/Transport/ZeroMQ/ServerTransport'),
    SchemalessSerializer = require('./lib/Serializer/SchemalessSerializer'),
    JsonDataFormat = require('./lib/Serializer/DataFormat/JsonDataFormat');

var serializer = new SchemalessSerializer(new JsonDataFormat);
var transport = ZeroMQServerTransport.create('tcp://*:9000', serializer);

var server = new Server({
    transport: transport
});

server.registerMethod('getUsers', function(callback) {
    callback(null, [1, 2, 3]);
});

server.run();

