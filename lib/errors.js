'use strict';

var createErrorType = function(type) {
    return function() {
        var error = Error.apply(undefined, arguments);
        error.type = type;
        return error;
    }
};
exports.TimeoutError = createErrorType('TimeoutError');
exports.TransportError = createErrorType('TransportError');
