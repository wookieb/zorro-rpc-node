'use strict';

module.exports = {
  REQUEST: 1,
  RESPONSE: 2,
  PING: 3,
  PONG: 4,
  ONE_WAY_CALL: 5,
  ONE_WAY_CALL_ACK: 6,
  ERROR: 7,
  PUSH: 8,
  PUSH_ACK: 9,
  exists: function(type) {
    return type >= 1 && type <= 9;
  },
  isAvailableForRequest: function(type) {
    return forRequest.indexOf(type) !== -1;
  },
  isAvailableForResponse: function(type) {
    return forResponse.indexOf(type) !== -1;
  }
};

var forRequest = [
    module.exports.REQUEST,
    module.exports.PING,
    module.exports.ONE_WAY_CALL,
    module.exports.PUSH
  ],
  forResponse = [
    module.exports.RESPONSE,
    module.exports.PONG,
    module.exports.ONE_WAY_CALL_ACK,
    module.exports.ERROR,
    module.exports.PUSH_ACK
  ];