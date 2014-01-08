'use strict';
var JSONDataFormat = require('./../../../lib/Serializer/DataFormat/JsonDataFormat'),
    seq = require('seq');

var object;

exports.setUp = function(done) {
    object = new JSONDataFormat();
    done();
};

exports['mimetypes'] = function(test) {
    test.deepEqual(['application/json'], object.mimeTypes);
    test.done();
};

exports.serialize = {
    'common types': function(test) {
        test.expect(7);
        var serialize = object.serialize.bind(object);
        seq()
            .par('number', serialize, 1, seq)
            .par('string', serialize, 'test', seq)
            .par('boolean_true', serialize, true, seq)
            .par('boolean_false', serialize, false, seq)
            .par('undefined', serialize, undefined, seq)
            .par('array', serialize, [1, 2, 3], seq)
            .par('object', serialize, {key: 'value'}, seq)
            .seq(function() {
                test.strictEqual('1', this.vars.number);
                test.strictEqual('"test"', this.vars.string);
                test.strictEqual('true', this.vars.boolean_true);
                test.strictEqual('false', this.vars.boolean_false);
                test.strictEqual('undefined', this.vars.undefined);
                test.strictEqual('[1,2,3]', this.vars.array);
                test.strictEqual('{"key":"value"}', this.vars.object);
                test.done();
            })
            .catch(test.ifError.bind(test));
    },
    'error': function(test) {
        test.expect(3);
        var error = new Error('Some error');
        object.serialize(error, function(err, result) {
            test.ifError(err);
            var unserialized = JSON.parse(result);
            test.strictEqual(error.message, unserialized.message);
            test.deepEqual(error.stack, unserialized.stack);
            test.done();
        });
    },
    'catching serialization errors': function(test) {
        test.expect(4);
        var data = {key: undefined};
        data.key = data;
        object.serialize(data, function(error, result) {
            test.notStrictEqual(undefined, error);
            test.strictEqual('Converting circular structure to JSON', error.message);
            test.ok(error instanceof TypeError);
            test.strictEqual(undefined, result);
            test.done();
        });
    }
};

exports.unserialize = {
    'common types': function(test) {
        test.expect(7);
        var unserialize = object.unserialize.bind(object);
        seq()
            .par('number', unserialize, '1', seq)
            .par('string', unserialize, '"test"', seq)
            .par('boolean_true', unserialize, 'true', seq)
            .par('boolean_false', unserialize, 'false', seq)
            .par('undefined', unserialize, 'undefined', seq)
            .par('array', unserialize, '[1,2,3]', seq)
            .par('object', unserialize, '{"key":"value"}', seq)
            .seq(function() {
                test.strictEqual(1, this.vars.number);
                test.strictEqual('test', this.vars.string);
                test.strictEqual(true, this.vars.boolean_true);
                test.strictEqual(false, this.vars.boolean_false);
                test.strictEqual(undefined, this.vars.undefined);
                test.deepEqual([1, 2, 3], this.vars.array);
                test.deepEqual({key: 'value'}, this.vars.object);
                test.done();
            })
            .catch(test.ifError.bind(test));
    },
    'catching deserialization error': function(test) {
        test.expect(4);
        object.unserialize('"test"df', function(error, result) {
            test.notStrictEqual(undefined, error);
            test.strictEqual(error.message, 'Unexpected token d');
            test.ok(error instanceof SyntaxError);
            test.strictEqual(result);
            test.done();
        });
    }
};
