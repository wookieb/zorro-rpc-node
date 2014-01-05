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
            callback,
            type = getMethodType(methodName);

        if (typeof method === 'function') {
            callback = method;
        }
        methods[methodName] = {
            type: type,
            callback: callback
        };
    }
    return methods;
};
