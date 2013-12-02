'use strict';

var Headers = require('./../lib/Headers');

var object;

exports.setUp = function(done) {
    object = new Headers();
    done();
};

exports['set from constructor'] = function(test) {
    object = new Headers({
        'Content-Type': 'application/html',
        'Accept-version': '1'
    });

    test.equals(object.get('content-type'), 'application/html');
    test.equals(object.get('Content-Type'), 'application/html');
    test.equals(object.get('Accept-Version'), '1');
    test.done();
};

exports['set'] = function(test) {
    object.set('super-extra-header', 'value');
    test.equals(object.get('SuPer-Extra-Header'), 'value');
    test.done();
};

exports['unset'] = function(test) {
    object.set('super-extra-header', 'value');
    object.unset('super-extra-header');
    test.equals()
    test.done();
};

exports['get all'] = function(test) {
    object.set('Content-Type', 'text/html');
    object.set('Accept-Version', '123');
    object.set('Request-Id', '23sdfs');

    test.deepEqual(object.getAll(), {
        'Content-Type': 'text/html',
        'Accept-Version': '123',
        'Request-Id': '23sdfs'
    });
    test.done();
};

exports['toString'] = function(test) {
    object.set('Content-Type', 'text/html');
    object.set('Accept-Version', '123');
    object.set('Request-Id', '23sdfs');

    var expected = 'Content-Type:text/html'+"\n"+
        'Accept-Version:123'+"\n"+
        'Request-Id:23sdfs'+"\n";

    test.equals(object.toString(), expected);
    test.done();
};

exports['clone'] = function(test) {
    object.set('Content-Type', 'text/html');
    object.set('Accept-Version', '123');
    object.set('Request-Id', '23sdfs');

    var clone = object.clone();

    test.deepEqual(object.getAll(), clone.getAll());
    clone.set('Content-Type', 'application/xml');

    test.equals(object.get('Content-type'), 'text/html');
    test.equals(clone.get('Content-type'), 'application/xml');
    test.done();
};
