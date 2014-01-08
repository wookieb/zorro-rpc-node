'use strict';

var format = require('format');

var methodTypes = {
        BASIC: 'basic',
        ONE_WAY: 'one-way',
        PUSH: 'push'
    },
    messageTypes = require('./messageTypes'),
    listOfMethodTypes = Object.keys(methodTypes).map(function(key) {
        return methodTypes[key];
    }),
    mapMessageTypeToMethodType = {};

mapMessageTypeToMethodType[messageTypes.REQUEST] = methodTypes.BASIC;
mapMessageTypeToMethodType[messageTypes.ONE_WAY] = methodTypes.ONE_WAY;
mapMessageTypeToMethodType[messageTypes.PUSH] = methodTypes.PUSH;

module.exports = methodTypes;

methodTypes.exists = function(methodType) {
    return listOfMethodTypes.indexOf(methodType) !== -1;
};

methodTypes.getMethodTypeForRequestType = function(requestType) {
    if (!messageTypes.isAllowedForRequest(requestType)) {
        var msg = format('Request type "%s" is not allowed for request', requestType);
        throw new Error(msg);
    }
    return mapMessageTypeToMethodType[requestType];
};
