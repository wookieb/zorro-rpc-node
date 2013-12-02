'use strict';
var messageTypes = {
        REQUEST: 'request',
        RESPONSE: 'response',
        PING: 'ping',
        PONG: 'pong',
        ONE_WAY_CALL: 'one-way-call',
        ONE_WAY_CALL_ACK: 'one-way-call-ack',
        ERROR: 'error',
        PUSH: 'push',
        PUSH_ACK: 'push-ack'
    },
    responseTypesWithResult = [messageTypes.RESPONSE, messageTypes.PUSH_ACK, messageTypes.ERROR],
    map = {};

map[messageTypes.REQUEST] = [messageTypes.RESPONSE, messageTypes.ERROR];
map[messageTypes.PING] = [messageTypes.PONG, messageTypes.ERROR];
map[messageTypes.ONE_WAY_CALL] = [messageTypes.ONE_WAY_CALL_ACK, messageTypes.ERROR];
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
        throw new Error('Given request type "'+requestType+'" does not exists or is not allowed to use in request');
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
        throw new Error('Given response type "'+responseType+'" does not exists or is not allowed to use in response ');
    }
    return responseTypesWithResult.indexOf(responseType) !== -1;
};