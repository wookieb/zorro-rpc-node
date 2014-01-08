'use strict';
var format = require('format');

var messageTypes = {
        REQUEST: 'request',
        RESPONSE: 'response',
        PING: 'ping',
        PONG: 'pong',
        ONE_WAY: 'one-way',
        ONE_WAY_ACK: 'one-way-ack',
        ERROR: 'error',
        PUSH: 'push',
        PUSH_ACK: 'push-ack'
    },
    responseTypesWithResult = [messageTypes.RESPONSE, messageTypes.PUSH_ACK, messageTypes.ERROR],
    map = {};

map[messageTypes.REQUEST] = [messageTypes.RESPONSE, messageTypes.ERROR];
map[messageTypes.PING] = [messageTypes.PONG, messageTypes.ERROR];
map[messageTypes.ONE_WAY] = [messageTypes.ONE_WAY_ACK, messageTypes.ERROR];
map[messageTypes.PUSH] = [messageTypes.PUSH_ACK, messageTypes.ERROR];

var typesForRequest = Object.keys(map),
    typesForResponse = (function() {
        return Object.keys(map)
            .map(function(key) {
                return map[key];
            })
            .reduce(function(initial, values) {
                for (var i in values) {
                    var value = values[i];
                    if (initial.indexOf(value) === -1) {
                        initial.push(value);
                    }
                }
                return initial;
            }, []);
    })(),
    allTypes = typesForRequest.concat(typesForResponse);

var arrayContains = function(value) {
    return this.indexOf(value) !== -1;
};

module.exports = messageTypes;

/**
 * Checks whether message type with given name exists
 *
 * @param {string} messageType
 * @return {boolean}
 */
messageTypes.exists = arrayContains.bind(allTypes);

/**
 * Checks whether message type exists and it's allowed to usage for request
 *
 * @param {string} messageType
 * @return {boolean}
 */
messageTypes.isAllowedForRequest = arrayContains.bind(typesForRequest);

/**
 * Checks whether message type exists and it's allowed to usage for request
 *
 * @param {string} messageType
 * @return {boolean}
 */
messageTypes.isAllowedForResponse = arrayContains.bind(typesForResponse);

/**
 * Returns list of message types that are valid response message types for given request type
 *
 * @param {string} requestType
 * @throws {Error} when given message type is prohibited for request
 * @returns {Array}
 */
messageTypes.getValidResponseTypeForRequestType = function(requestType) {
    if (!messageTypes.isAllowedForRequest(requestType)) {
        var msg = format('Given request type "%s" does not exists or is not allowed to use in request', requestType);
        throw new Error(msg);
    }
    return map[requestType];
};

/**
 * Returns success response message type for given request type
 *
 * @param {string} requestType
 * @throws {Error} when given message type is prohibited for request
 * @returns {string}
 */
messageTypes.getResponseTypeForRequestType = function(requestType) {
    return messageTypes.getValidResponseTypeForRequestType(requestType)[0];
};

messageTypes.isResponseTypeWithResult = function(responseType) {
    if (!messageTypes.isAllowedForResponse(responseType)) {
        var msg = format('Given response type "%s" does not exists or is not allowed to use in response', responseType);
        throw new Error(msg);
    }
    return responseTypesWithResult.indexOf(responseType) !== -1;
};
