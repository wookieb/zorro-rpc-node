var Client = require('./lib/Client'),
  ZeroMQTransport = require('./lib/Transport/ZeroMQ/ClientTransport'),
  SchemalessSerializer = require('./lib/Serializer/SchemalessSerializer'),
  JsonDataFormat = require('./lib/Serializer/DataFormat/JsonDataFormat');

var serializer = new SchemalessSerializer();
serializer.defaultDataFormat = new JsonDataFormat();

var c = new Client({
  transport: new ZeroMQTransport({
    server: 'tcp://0.0.0.0:8001'
  }),
  serializer: serializer
});

c.call('test', [1], console.log);


