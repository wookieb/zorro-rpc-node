'use strict';

var SchemalessSerializer = require('./../../lib/Serializer/SchemalessSerializer'),
    Serializer = require('./../../lib/Serializer/Serializer'),
    JsonDataFormat = require('./../../lib/Serializer/DataFormat/JsonDataFormat');

var object,
    METHOD = 'testMethod',
    exampleData = {
        firstValue: 1,
        secondValue: 'yolo'
    },
    exampleArguments = [
        1,
        "test",
        {value1: 1, value2: 'some string'}
    ],
    exampleError = new Error('Accurate kilogram error');

exports.setUp = function(done) {
    object = new SchemalessSerializer();
    object.defaultDataFormat = new JsonDataFormat();
    done();
};

exports['extends Serializer'] = function(test) {
    test.ok(object instanceof Serializer);
    test.done();
};

exports['serialize result'] = {
    'success': function(test) {
        test.expect(1);
        object.serializeResult(METHOD, exampleData, function(error, result) {
            test.equal(JSON.stringify(exampleData), result);
            test.done();
        });
    },
    'error when data format is unsupported': function(test) {
        test.expect(1);
        object.serializeResult(METHOD, exampleData, 'application/xml', function(error, result) {
            test.equal('No data format specified for mimetype "application/xml"', error.message);
            test.done();
        });
    }
};

exports['unserialize result'] = {
    'success': function(test) {
        test.expect(1);
        object.unserializeResult(METHOD, JSON.stringify(exampleData), function(error, result) {
            test.deepEqual(exampleData, result);
            test.done();
        });
    },
    'error when data format is unsupported': function(test) {
        test.expect(1);
        object.unserializeResult(METHOD, JSON.stringify(exampleData), 'application/xml', function(error, result) {
            test.equal('No data format specified for mimetype "application/xml"', error.message);
            test.done();
        });
    }
};

exports['serialize error'] = {
    'success': function(test) {
        test.expect(1);
        object.serializeError(METHOD, exampleError, function(error, result) {
            test.equal(JSON.stringify(exampleError), result);
            test.done();
        });
    },
    'error when data format is unsupported': function(test) {
        test.expect(1);
        object.serializeError(METHOD, exampleError, 'application/xml', function(error, result) {
            test.equal('No data format specified for mimetype "application/xml"', error.message);
            test.done();
        });
    }
};


exports['unserialize error'] = {
    'success': function(test) {
        test.expect(1);
        object.unserializeError(METHOD, JSON.stringify(exampleError), function(error, result) {
            test.deepEqual(exampleError, result);
            test.done();
        });
    },
    'error when data format is unsupported': function(test) {
        test.expect(1);
        object.unserializeError(METHOD, exampleError, 'application/xml', function(error, result) {
            test.equal('No data format specified for mimetype "application/xml"', error.message);
            test.done();
        });
    }
};

exports['serialize arguments'] = {
    'success': function(test) {
        test.expect(1);
        object.serializeArguments(METHOD, exampleArguments, function(error, result) {
            test.deepEqual(exampleArguments.map(JSON.stringify), result);
            test.done();
        });
    },
    'error when data format is unsupported': function(test) {
        test.expect(1);
        object.serializeArguments(METHOD, exampleArguments, 'application/xml', function(error, result) {
            test.equal('No data format specified for mimetype "application/xml"', error.message);
            test.done();
        });
    }
};

exports['unserialize arguments'] = {
    'success': function(test) {
        test.expect(1);
        object.unserializeArguments(METHOD, exampleArguments.map(JSON.stringify), function(error, result) {
            test.deepEqual(exampleArguments, result);
            test.done();
        });
    },
    'error when data format is unsupported': function(test) {
        test.expect(1);
        object.unserializeArguments(METHOD, exampleArguments.map(JSON.stringify), 'application/xml', function(error, result) {
            test.equal('No data format specified for mimetype "application/xml"', error.message);
            test.done();
        });
    }
};

// TODO example with different mimeType than default one
