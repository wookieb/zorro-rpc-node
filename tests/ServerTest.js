'use strict';

var JsonDataFormat = require('../lib/Serializer/DataFormat/JsonDataFormat'),
    SchemalessSerializer = require('../lib/Serializer/SchemalessSerializer'),
    Server = require('../lib/Server'),
    Headers = require('../lib/Headers'),
    messageTypes = require('../lib/messageTypes'),
    methodTypes = require('../lib/methodTypes'),
    errors = require('../lib/errors');

var object,
    serializer,
    transport;

var toArgs = Array.prototype.slice.call.bind(Array.prototype.slice),
    ARGS = ['test', 1, true, false, {object: 'value'}],
    ARGS_SERIALIZED = ARGS.map(function(value) {
        return JSON.stringify(value);
    }),
    RESULT = ARGS,
    RESULT_SERIALIZED = JSON.stringify(RESULT);

exports.setUp = function(done) {
    serializer = new SchemalessSerializer(new JsonDataFormat);

    transport = {
        startListen: function(handler) {
            this.handler = handler;
        },
        stopListen: function() {

        },
        on: function() {

        },
        use: function(request, response, test) {
            this.handler(request, function(error, currentResponse) {
                test.ifError(error);
                test.deepEqual(response, currentResponse);
                test.done();
            });
        }
    };

    object = new Server({
        serializer: serializer,
        transport: transport
    });

    object.run();
    done();
};

var useStandardBasic = function(test, request, responseHeaders, testCallback) {
    object.registerMethod('basic', function() {
        var callback = arguments[5],
            currentRequest = arguments[6],
            headers = arguments[7];
        test.deepEqual(toArgs(arguments, 0, 5), ARGS);
        test.ok(callback instanceof Function);
        test.deepEqual(request, currentRequest);
        test.deepEqual(responseHeaders, headers);
        testCallback.apply(this, arguments);
    });
}
exports.methods = {
    registering: function(test) {
        var callbacks = {
            basic: function() {},
            oneWay: function() {},
            push: function() {}
        };

        object.registerMethod('basic', methodTypes.BASIC, callbacks.basic);
        object.registerMethod('basicWithDefaultType', callbacks.basic);
        object.registerMethod('oneWay', methodTypes.ONE_WAY, callbacks.oneWay);
        object.registerMethod('push', methodTypes.PUSH, callbacks.push);

        var expected = {
            basic: {
                type: methodTypes.BASIC,
                callback: callbacks.basic
            },
            basicWithDefaultType: {
                type: methodTypes.BASIC,
                callback: callbacks.basic
            },
            oneWay: {
                type: methodTypes.ONE_WAY,
                callback: callbacks.oneWay
            },
            push: {
                type: methodTypes.PUSH,
                callback: callbacks.push
            }
        };

        test.deepEqual(expected, object.getMethods());
        test.done();
    },
    'bulk registering': function(test) {
        var callbacks = {
            basic: function() {},
            oneWay: function() {},
            push: function() {}
        };

        var expected = {
            basic: {
                type: methodTypes.BASIC,
                callback: callbacks.basic
            },
            basicWithDefaultType: {
                type: methodTypes.BASIC,
                callback: callbacks.basic
            },
            oneWay: {
                type: methodTypes.ONE_WAY,
                callback: callbacks.oneWay
            },
            push: {
                type: methodTypes.PUSH,
                callback: callbacks.push
            }
        };

        object.registerMethods(expected);
        test.deepEqual(expected, object.getMethods());
        test.done();
    }
};


exports['setting forwarded headers'] = function(test) {
    object = new Server({
        transport: transport,
        serializer: serializer,
        forwardedHeaders: ['test']
    });

    test.deepEqual(['request-id', 'test'], object.forwardedHeaders);
    test.done();
};

exports.basic = {
    'error': function(test) {
        test.expect(6);
        var request = {
                type: messageTypes.REQUEST,
                method: 'basic',
                args: ARGS_SERIALIZED,
                headers: new Headers()
            },
            error = new Error('Message'),
            response = {
                type: messageTypes.ERROR,
                headers: new Headers(),
                result: JSON.stringify({
                    stack: [],
                    message: error.message
                })
            };

        useStandardBasic(test, request, response.headers, function() {
            arguments[5](error);
        });

        transport.use(request, response, test);
    },
    'default headers': function(test) {
        test.expect(6);
        object.defaultHeaders = new Headers({
            'default-header': 'value'
        });

        var request = {
                type: messageTypes.REQUEST,
                method: 'basic',
                args: ARGS_SERIALIZED,
                headers: new Headers()
            },
            response = {
                type: messageTypes.RESPONSE,
                headers: object.defaultHeaders,
                result: RESULT_SERIALIZED
            };

        useStandardBasic(test, request, response.headers, function() {
            arguments[5](undefined, RESULT);
        });

        transport.use(request, response, test);
    },
    'forwarding headers': function(test) {
        var request = {
                type: messageTypes.REQUEST,
                method: 'basic',
                args: ARGS_SERIALIZED,
                headers: new Headers({
                    'request-id': 'some-id',
                    'irrelevant-header': 'value'
                })
            },
            response = {
                type: messageTypes.RESPONSE,
                headers: new Headers({
                    'request-id': 'some-id'
                }),
                result: RESULT_SERIALIZED
            };

        useStandardBasic(test, request, response.headers, function() {
            arguments[5](undefined, RESULT);
        });
        transport.use(request, response, test);
    },
    'result': function(test) {
        var request = {
                type: messageTypes.REQUEST,
                method: 'basic',
                args: ARGS_SERIALIZED,
                headers: new Headers()
            },
            response = {
                type: messageTypes.RESPONSE,
                headers: new Headers(),
                result: RESULT_SERIALIZED
            };

        useStandardBasic(test, request, response.headers, function() {
            arguments[5](undefined, RESULT);
        });
        transport.use(request, response, test);
    },
    'empty result': function(test) {
        var request = {
                type: messageTypes.REQUEST,
                method: 'basic',
                args: ARGS_SERIALIZED,
                headers: new Headers()
            },
            response = {
                type: messageTypes.RESPONSE,
                headers: new Headers(),
                result: 'undefined'
            };

        useStandardBasic(test, request, response.headers, function() {
            arguments[5]();
        });
        transport.use(request, response, test);
    }
};

// TODO rest tests
