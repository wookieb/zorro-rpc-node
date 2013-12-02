'use strict';
var Serializer = require('./../../lib/Serializer/Serializer');

var object,
    dataFormat = {
        serialize: function() {},
        unserialize: function() {},
        mimeTypes: ['text/html', 'application/json']
    };

exports.setUp = function(done) {
    object = new Serializer();
    done();
};

exports['register data format'] = function(test) {
    object.registerDataFormat(dataFormat);
    test.equal(dataFormat, object.getDataFormatForMimeType('text/html'));
    test.equal(dataFormat, object.getDataFormatForMimeType('application/json'));
    test.equal(undefined, object.defaultDataFormat);
    test.equal(undefined, object.defaultMimeType);
    test.done();
};

exports['set default data format'] = function(test) {
    object.defaultDataFormat = dataFormat;
    test.equal(dataFormat, object.getDataFormatForMimeType('text/html'));
    test.equal(dataFormat, object.getDataFormatForMimeType('application/json'));
    test.equal(dataFormat, object.defaultDataFormat);
    test.equal('text/html', object.defaultMimeType);
    test.done();
};

exports['error if data format is unsupported'] = function(test) {
    test.throws(function() {
        object.getDataFormatForMimeType('application/xml');
    }, Error, 'No data format specified for mimetype "application/xml"');
    test.done();
};
