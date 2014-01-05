'use strict';

var methodTypes = require('./methodTypes');

var getMethodType = function(methodName) {
    var type = methodName.split('_', 1)[0];
    if (methodTypes.exists(type)) {
        return type;
    }
    return 'basic';
};

module.exports = function(object) {
    var methods = {};

    for (var methodName in object) {
        var method = object[methodName],
            type;

        if (typeof method !== 'function') {
            continue;
        }

        if (methodName.substr(0, 1) === '_') {
            continue;
        }

        type = getMethodType(methodName);
        methods[methodName] = {
            type: type,
            callback: method.bind(object)
        };
    }
    return methods;
};
