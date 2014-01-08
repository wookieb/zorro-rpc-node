'use strict';

var autodiscover = require('../lib/autodiscover'),
    app = {
        property: 1,
        push_property: 2,
        'one-way_property': 3,
        _property2: 4,
        _push_property2: 5,
        '_one-way_property2': 6,
        method: function() {
            return [this, 'method'];
        },
        push_method: function() {
            return [this, 'push_method'];
        },
        'one-way_method': function() {
            return [this, 'one-way_method'];
        },
        _method2: function() {

        },
        _push_method2: function() {

        },
        '_one-way_method2': function() {

        }
    };


exports['gets only "public" methods'] = function(test) {
    var result = autodiscover(app);
    test.deepEqual(['method', 'push_method', 'one-way_method'], Object.keys(result));

    test.strictEqual('basic', result.method.type);
    test.deepEqual([app, 'method'], result.method.callback());

    test.strictEqual('push', result.push_method.type);
    test.deepEqual([app, 'push_method'], result.push_method.callback());

    test.strictEqual('one-way', result['one-way_method'].type);
    test.deepEqual([app, 'one-way_method'], result['one-way_method'].callback());

    test.done();
};
