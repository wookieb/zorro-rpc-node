'use strict';

var JsonDataFormat = require('../lib/Serializer/DataFormat/JsonDataFormat'),
    SchemalessSerializer = require('../lib/Serializer/SchemalessSerializer'),
    Client = require('../lib/Client'),
    Headers = require('../lib/Headers'),
    messageTypes = require('../lib/messageTypes'),
    sinon = require('sinon'),
    errors = require('../lib/errors');

var object,
    serializer,
    transport;

var METHOD = 'some-method',
    ARGS = ['test', 1, true, false, null, {object: 'value'}],
    ARGS_SERIALIZED = ARGS.map(function(value) {
        return JSON.stringify(value);
    });

exports.setUp = function(done) {
    serializer = new SchemalessSerializer(new JsonDataFormat);
    transport = {
        use: function(test, request, response, error) {
            this.doRequest = function(currentRequest, callback) {
                test.strictEqual(request.type, currentRequest.type);
                if (request.type !== messageTypes.PING) {
                    test.strictEqual(request.method, currentRequest.method);
                    test.deepEqual(ARGS_SERIALIZED, currentRequest.args);

                    process.nextTick(function() {
                        callback(error, response);
                    });
                } else {
                    setTimeout(function() {
                        callback(error, response);
                    }, 5);
                }
            };
        },
        doRequest: function(request, callback) {
        }
    };

    object = new Client({
        serializer: serializer,
        transport: transport
    });

    done();
}
;

exports.basic = {
    'with result': function(test) {
        transport.use(test, {
            type: messageTypes.REQUEST,
            args: ARGS_SERIALIZED,
            method: METHOD,
            headers: new Headers()
        }, {
            type: messageTypes.RESPONSE,
            result: '"test"',
            headers: new Headers()
        });

        object.basic(METHOD, ARGS, function(error, result) {
            test.ifError(error);
            test.strictEqual('test', result);
            test.done();
        });
    },
    'empty result': function(test) {
        transport.use(test, {
            type: messageTypes.REQUEST,
            args: ARGS_SERIALIZED,
            method: METHOD,
            headers: new Headers()
        }, {
            type: messageTypes.RESPONSE,
            result: 'undefined',
            headers: new Headers()
        });

        object.basic(METHOD, ARGS, function(error, result) {
            test.ifError(error);
            test.strictEqual(undefined, result);
            test.done();
        });
    },
    'error': function(test) {
        var exampleError = new Error('Message');

        transport.use(test, {
            type: messageTypes.REQUEST,
            args: ARGS_SERIALIZED,
            method: METHOD,
            headers: new Headers()
        }, {
            type: messageTypes.ERROR,
            result: JSON.stringify(exampleError),
            headers: new Headers()
        });

        object.basic(METHOD, ARGS, function(error, result) {
            test.strictEqual(undefined, result);
            test.notStrictEqual(undefined, error);
            test.ok(errors.ResponseError.isInstanceOf(error));
            test.deepEqual(exampleError, error.error);
            test.done();
        });
    },
    'timeout': function(test) {
        transport.use(test, {
            type: messageTypes.REQUEST,
            args: ARGS_SERIALIZED,
            method: METHOD,
            headers: new Headers()
        }, undefined, new errors.TimeoutError('Some timeout'));

        object.basic(METHOD, ARGS, function(error, result) {
            test.notEqual(undefined, error);
            test.strictEqual('Some timeout', error.message);
            test.ok(errors.TimeoutError.isInstanceOf(error));
            test.strictEqual(undefined, result);
            test.done();
        });
    },
    'default headers': function(test) {
        object.defaultHeaders = new Headers({
            'Some-Extra-Header': 'Scooter!',
            'AnotherOne': 'Maria!'
        });

        transport.use(test, {
            type: messageTypes.REQUEST,
            args: ARGS_SERIALIZED,
            method: METHOD,
            headers: new Headers({
                'Some-Extra-Header': 'Scooter!',
                'AnotherOne': 'Maria!'
            })
        }, {
            type: messageTypes.RESPONSE,
            result: JSON.stringify(true),
            headers: new Headers()
        });

        object.basic(METHOD, ARGS, function(error, result) {
            test.ifError(error);
            test.strictEqual(true, result);
            test.done();
        });
    },
    'invalid response type': function(test) {
        transport.use(test, {
            type: messageTypes.REQUEST,
            args: ARGS_SERIALIZED,
            method: METHOD,
            headers: new Headers()
        }, {
            type: messageTypes.PUSH_ACK,
            result: JSON.stringify(true),
            headers: new Headers()
        });

        object.basic(METHOD, ARGS, function(error, result) {
            test.notEqual(undefined, error);
            test.strictEqual('Invalid response type "push-ack" for request type "request"', error.message);
            test.strictEqual(undefined, result);
            test.done();
        });
    },
    'changing headers (by headers object)': function(test) {
        transport.use(test, {
            type: messageTypes.REQUEST,
            args: ARGS_SERIALIZED,
            method: METHOD,
            headers: new Headers({
                'SomeHeader': 'andValue',
                'Extra-Header': 'test'
            })
        }, {
            type: messageTypes.RESPONSE,
            result: JSON.stringify(true),
            headers: new Headers()
        });

        var headers = new Headers({
            'SomeHeader': 'andValue',
            'Extra-Header': 'test'
        });
        object.basic(METHOD, ARGS, headers, function(error, result) {
            test.ifError(error);
            test.strictEqual(true, result);
            test.done();
        });
    },
    'changing headers (by hash object)': function(test) {
        transport.use(test, {
            type: messageTypes.REQUEST,
            args: ARGS_SERIALIZED,
            method: METHOD,
            headers: new Headers({
                'SomeHeader': 'andValue',
                'Extra-Header': 'test'
            })
        }, {
            type: messageTypes.RESPONSE,
            result: JSON.stringify(true),
            headers: new Headers()
        });

        var headers = {
            'SomeHeader': 'andValue',
            'Extra-Header': 'test'
        };
        object.basic(METHOD, ARGS, headers, function(error, result) {
            test.ifError(error);
            test.strictEqual(true, result);
            test.done();
        });
    },
    'changing default headers': function(test) {
        object.defaultHeaders = new Headers({
            'Content-Type': 'text/html'
        });

        transport.use(test, {
            type: messageTypes.REQUEST,
            args: ARGS_SERIALIZED,
            method: METHOD,
            headers: new Headers({
                'Content-Type': 'application/json'
            })
        }, {
            type: messageTypes.RESPONSE,
            result: JSON.stringify(true),
            headers: new Headers()
        });

        var headers = {
            'Content-Type': 'application/json'
        };
        object.basic(METHOD, ARGS, headers, function(error, result) {
            test.ifError(error);
            test.strictEqual(true, result);
            test.done();
        });
    }
};


exports.push = {
    'with result': function(test) {
        transport.use(test, {
            type: messageTypes.PUSH,
            args: ARGS_SERIALIZED,
            method: METHOD,
            headers: new Headers()
        }, {
            type: messageTypes.PUSH_ACK,
            result: '"test"',
            headers: new Headers()
        });

        object.push(METHOD, ARGS, function(error, result) {
            test.ifError(error);
            test.strictEqual('test', result);
            test.done();
        });
    },
    'empty result': function(test) {
        transport.use(test, {
            type: messageTypes.PUSH,
            args: ARGS_SERIALIZED,
            method: METHOD,
            headers: new Headers()
        }, {
            type: messageTypes.PUSH_ACK,
            result: 'undefined',
            headers: new Headers()
        });

        object.push(METHOD, ARGS, function(error, result) {
            test.ifError(error);
            test.strictEqual(undefined, result);
            test.done();
        });
    },
    'error': function(test) {
        var exampleError = new Error('Message');

        transport.use(test, {
            type: messageTypes.PUSH,
            args: ARGS_SERIALIZED,
            method: METHOD,
            headers: new Headers()
        }, {
            type: messageTypes.ERROR,
            result: JSON.stringify(exampleError),
            headers: new Headers()
        });

        object.push(METHOD, ARGS, function(error, result) {
            test.strictEqual(undefined, result);
            test.notStrictEqual(undefined, error);
            test.ok(errors.ResponseError.isInstanceOf(error));
            test.deepEqual(exampleError, error.error);
            test.done();
        });
    },
    'timeout': function(test) {
        transport.use(test, {
            type: messageTypes.PUSH,
            args: ARGS_SERIALIZED,
            method: METHOD,
            headers: new Headers()
        }, undefined, new errors.TimeoutError('Some timeout'));

        object.push(METHOD, ARGS, function(error, result) {
            test.notEqual(undefined, error);
            test.strictEqual('Some timeout', error.message);
            test.ok(errors.TimeoutError.isInstanceOf(error));
            test.strictEqual(undefined, result);
            test.done();
        });
    },
    'default headers': function(test) {
        object.defaultHeaders = new Headers({
            'Some-Extra-Header': 'Scooter!',
            'AnotherOne': 'Maria!'
        });

        transport.use(test, {
            type: messageTypes.PUSH,
            args: ARGS_SERIALIZED,
            method: METHOD,
            headers: new Headers({
                'Some-Extra-Header': 'Scooter!',
                'AnotherOne': 'Maria!'
            })
        }, {
            type: messageTypes.PUSH_ACK,
            result: JSON.stringify(true),
            headers: new Headers()
        });

        object.push(METHOD, ARGS, function(error, result) {
            test.ifError(error);
            test.strictEqual(true, result);
            test.done();
        });
    },
    'invalid response type': function(test) {
        transport.use(test, {
            type: messageTypes.PUSH,
            args: ARGS_SERIALIZED,
            method: METHOD,
            headers: new Headers()
        }, {
            type: messageTypes.RESPONSE,
            result: JSON.stringify(true),
            headers: new Headers()
        });

        object.push(METHOD, ARGS, function(error, result) {
            test.notEqual(undefined, error);
            test.strictEqual('Invalid response type "response" for request type "push"', error.message);
            test.strictEqual(undefined, result);
            test.done();
        });
    },
    'changing headers (by headers object)': function(test) {
        transport.use(test, {
            type: messageTypes.PUSH,
            args: ARGS_SERIALIZED,
            method: METHOD,
            headers: new Headers({
                'SomeHeader': 'andValue',
                'Extra-Header': 'test'
            })
        }, {
            type: messageTypes.PUSH_ACK,
            result: JSON.stringify(true),
            headers: new Headers()
        });

        var headers = new Headers({
            'SomeHeader': 'andValue',
            'Extra-Header': 'test'
        });
        object.push(METHOD, ARGS, headers, function(error, result) {
            test.ifError(error);
            test.strictEqual(true, result);
            test.done();
        });
    },
    'changing headers (by hash object)': function(test) {
        transport.use(test, {
            type: messageTypes.PUSH,
            args: ARGS_SERIALIZED,
            method: METHOD,
            headers: new Headers({
                'SomeHeader': 'andValue',
                'Extra-Header': 'test'
            })
        }, {
            type: messageTypes.PUSH_ACK,
            result: JSON.stringify(true),
            headers: new Headers()
        });

        var headers = {
            'SomeHeader': 'andValue',
            'Extra-Header': 'test'
        };
        object.push(METHOD, ARGS, headers, function(error, result) {
            test.ifError(error);
            test.strictEqual(true, result);
            test.done();
        });
    },
    'changing default headers': function(test) {
        object.defaultHeaders = new Headers({
            'Content-Type': 'text/html'
        });

        transport.use(test, {
            type: messageTypes.PUSH,
            args: ARGS_SERIALIZED,
            method: METHOD,
            headers: new Headers({
                'Content-Type': 'application/json'
            })
        }, {
            type: messageTypes.PUSH_ACK,
            result: JSON.stringify(true),
            headers: new Headers()
        });

        var headers = {
            'Content-Type': 'application/json'
        };
        object.push(METHOD, ARGS, headers, function(error, result) {
            test.ifError(error);
            test.strictEqual(true, result);
            test.done();
        });
    }
};


exports['one-way'] = {
    'with result': function(test) {
        transport.use(test, {
            type: messageTypes.ONE_WAY,
            args: ARGS_SERIALIZED,
            method: METHOD,
            headers: new Headers()
        }, {
            type: messageTypes.ONE_WAY_ACK,
            result: '"test"',
            headers: new Headers()
        });

        object.oneWay(METHOD, ARGS, function(error, result) {
            test.ifError(error);
            test.strictEqual(undefined, result);
            test.done();
        });
    },
    'empty result': function(test) {
        transport.use(test, {
            type: messageTypes.ONE_WAY,
            args: ARGS_SERIALIZED,
            method: METHOD,
            headers: new Headers()
        }, {
            type: messageTypes.ONE_WAY_ACK,
            headers: new Headers()
        });

        object.oneWay(METHOD, ARGS, function(error, result) {
            test.ifError(error);
            test.strictEqual(undefined, result);
            test.done();
        });
    },
    'error': function(test) {
        var exampleError = new Error('Message');

        transport.use(test, {
            type: messageTypes.ONE_WAY,
            args: ARGS_SERIALIZED,
            method: METHOD,
            headers: new Headers()
        }, {
            type: messageTypes.ERROR,
            result: JSON.stringify(exampleError),
            headers: new Headers()
        });

        object.oneWay(METHOD, ARGS, function(error, result) {
            test.strictEqual(undefined, result);
            test.notStrictEqual(undefined, error);
            test.ok(errors.ResponseError.isInstanceOf(error));
            test.deepEqual(exampleError, error.error);
            test.done();
        });
    },
    'timeout': function(test) {
        transport.use(test, {
            type: messageTypes.ONE_WAY,
            args: ARGS_SERIALIZED,
            method: METHOD,
            headers: new Headers()
        }, undefined, new errors.TimeoutError('Some timeout'));

        object.oneWay(METHOD, ARGS, function(error, result) {
            test.notEqual(undefined, error);
            test.strictEqual('Some timeout', error.message);
            test.ok(errors.TimeoutError.isInstanceOf(error));
            test.strictEqual(undefined, result);
            test.done();
        });
    },
    'default headers': function(test) {
        object.defaultHeaders = new Headers({
            'Some-Extra-Header': 'Scooter!',
            'AnotherOne': 'Maria!'
        });

        transport.use(test, {
            type: messageTypes.ONE_WAY,
            args: ARGS_SERIALIZED,
            method: METHOD,
            headers: new Headers({
                'Some-Extra-Header': 'Scooter!',
                'AnotherOne': 'Maria!'
            })
        }, {
            type: messageTypes.ONE_WAY_ACK,
            headers: new Headers()
        });

        object.oneWay(METHOD, ARGS, function(error, result) {
            test.ifError(error);
            test.strictEqual(undefined, result);
            test.done();
        });
    },
    'invalid response type': function(test) {
        transport.use(test, {
            type: messageTypes.ONE_WAY,
            args: ARGS_SERIALIZED,
            method: METHOD,
            headers: new Headers()
        }, {
            type: messageTypes.PUSH_ACK,
            headers: new Headers()
        });

        object.oneWay(METHOD, ARGS, function(error, result) {
            test.notEqual(undefined, error);
            test.strictEqual('Invalid response type "push-ack" for request type "one-way"', error.message);
            test.strictEqual(undefined, result);
            test.done();
        });
    },
    'changing headers (by headers object)': function(test) {
        transport.use(test, {
            type: messageTypes.ONE_WAY,
            args: ARGS_SERIALIZED,
            method: METHOD,
            headers: new Headers({
                'SomeHeader': 'andValue',
                'Extra-Header': 'test'
            })
        }, {
            type: messageTypes.ONE_WAY_ACK,
            headers: new Headers()
        });

        var headers = new Headers({
            'SomeHeader': 'andValue',
            'Extra-Header': 'test'
        });
        object.oneWay(METHOD, ARGS, headers, function(error, result) {
            test.ifError(error);
            test.strictEqual(undefined, result);
            test.done();
        });
    },
    'changing headers (by hash object)': function(test) {
        transport.use(test, {
            type: messageTypes.ONE_WAY,
            args: ARGS_SERIALIZED,
            method: METHOD,
            headers: new Headers({
                'SomeHeader': 'andValue',
                'Extra-Header': 'test'
            })
        }, {
            type: messageTypes.ONE_WAY_ACK,
            headers: new Headers()
        });

        var headers = {
            'SomeHeader': 'andValue',
            'Extra-Header': 'test'
        };
        object.oneWay(METHOD, ARGS, headers, function(error, result) {
            test.ifError(error);
            test.strictEqual(undefined, result);
            test.done();
        });
    },
    'changing default headers': function(test) {
        object.defaultHeaders = new Headers({
            'Content-Type': 'text/html'
        });

        transport.use(test, {
            type: messageTypes.ONE_WAY,
            args: ARGS_SERIALIZED,
            method: METHOD,
            headers: new Headers({
                'Content-Type': 'application/json'
            })
        }, {
            type: messageTypes.ONE_WAY_ACK,
            result: JSON.stringify(true),
            headers: new Headers()
        });

        var headers = {
            'Content-Type': 'application/json'
        };
        object.oneWay(METHOD, ARGS, headers, function(error, result) {
            test.ifError(error);
            test.strictEqual(undefined, result);
            test.done();
        });
    }
};


exports.ping = {
    'with correct response': function(test) {
        transport.use(test, {
            type: messageTypes.PING,
            headers: new Headers()
        }, {
            type: messageTypes.PONG,
            headers: new Headers()
        });

        object.ping(function(error, result) {
            test.ifError(error);
            test.ok(parseInt(result, 10) > 0);
            test.done();
        });
    },
    'error': function(test) {
        var exampleError = new Error('Message');

        transport.use(test, {
            type: messageTypes.PING,
            headers: new Headers()
        }, {
            type: messageTypes.ERROR,
            result: JSON.stringify(exampleError),
            headers: new Headers()
        });

        object.ping(function(error, result) {
            test.strictEqual(undefined, result);
            test.notStrictEqual(undefined, error);
            test.ok(errors.ResponseError.isInstanceOf(error));
            test.deepEqual(exampleError, error.error);
            test.done();
        });
    },
    'timeout': function(test) {
        transport.use(test, {
            type: messageTypes.PING,
            headers: new Headers()
        }, undefined, new errors.TimeoutError('Some timeout'));

        object.ping(function(error, result) {
            test.notEqual(undefined, error);
            test.strictEqual('Some timeout', error.message);
            test.ok(errors.TimeoutError.isInstanceOf(error));
            test.strictEqual(undefined, result);
            test.done();
        });
    },
    'default headers': function(test) {
        object.defaultHeaders = new Headers({
            'Some-Extra-Header': 'Scooter!',
            'AnotherOne': 'Maria!'
        });

        transport.use(test, {
            type: messageTypes.PING,
            headers: new Headers({
                'Some-Extra-Header': 'Scooter!',
                'AnotherOne': 'Maria!'
            })
        }, {
            type: messageTypes.PONG,
            headers: new Headers()
        });

        object.ping(function(error, result) {
            test.ifError(error);
            test.ok(parseInt(result, 10) > 0);
            test.done();
        });
    },
    'invalid response type': function(test) {
        transport.use(test, {
            type: messageTypes.PING,
            headers: new Headers()
        }, {
            type: messageTypes.PUSH_ACK,
            headers: new Headers()
        });

        object.ping(function(error, result) {
            test.notEqual(undefined, error);
            test.strictEqual('Invalid response type "push-ack" for request type "ping"', error.message);
            test.strictEqual(undefined, result);
            test.done();
        });
    },
    'changing headers (by headers object)': function(test) {
        transport.use(test, {
            type: messageTypes.PING,
            headers: new Headers({
                'SomeHeader': 'andValue',
                'Extra-Header': 'test'
            })
        }, {
            type: messageTypes.PONG,
            headers: new Headers()
        });

        var headers = new Headers({
            'SomeHeader': 'andValue',
            'Extra-Header': 'test'
        });
        object.ping(headers, function(error, result) {
            test.ifError(error);
            test.ok(parseInt(result, 10) > 0);
            test.done();
        });
    },
    'changing headers (by hash object)': function(test) {
        transport.use(test, {
            type: messageTypes.PING,
            headers: new Headers({
                'SomeHeader': 'andValue',
                'Extra-Header': 'test'
            })
        }, {
            type: messageTypes.PONG,
            headers: new Headers()
        });

        var headers = {
            'SomeHeader': 'andValue',
            'Extra-Header': 'test'
        };
        object.ping(headers, function(error, result) {
            test.ifError(error);
            test.ok(parseInt(result, 10) > 0);
            test.done();
        });
    },
    'changing default headers': function(test) {
        object.defaultHeaders = new Headers({
            'Content-Type': 'text/html'
        });

        transport.use(test, {
            type: messageTypes.PING,
            headers: new Headers({
                'Content-Type': 'application/json'
            })
        }, {
            type: messageTypes.PONG,
            headers: new Headers()
        });

        var headers = {
            'Content-Type': 'application/json'
        };
        object.ping(headers, function(error, result) {
            test.ifError(error);
            test.ok(parseInt(result, 10) > 0);
            test.done();
        });
    }
};
