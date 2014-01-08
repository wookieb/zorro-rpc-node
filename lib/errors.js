'use strict';

var createErrorType = function(type) {
    var func = function() {
        var error = Error.apply(undefined, arguments);
        error.type = type;
        return error;
    };
    func.isInstanceOf = function(error) {
        return error instanceof Error && error.type === type;
    };
    return func;
};
exports.TimeoutError = createErrorType('TimeoutError');
exports.TransportError = createErrorType('TransportError');
exports.ResponseError = createErrorType('ResponseError');
