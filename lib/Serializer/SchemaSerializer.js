'use strict';

var Serializer = require('./Serializer'),
  util = require('util');

var SchemaSerializer = function(schema) {
  this.schema = schema;
  Serializer.call(this);
};
util.inherits(SchemaSerializer, Serializer);

SchemaSerializer.prototype.serializeArguments = function(method, args, mimeType, callback) {

};

SchemaSerializer.prototype.unserializeArguments = function(method, args, mimeType, callback) {

};

SchemaSerializer.prototype.serializeResult = function(method, result, mimeType, callback) {

};

SchemaSerializer.prototype.unserializeResult = function(method, result, mimeType, callback) {

};