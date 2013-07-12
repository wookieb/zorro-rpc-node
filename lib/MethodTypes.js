'use strict';

module.exports = {
  BASIC: 1,
  ONE_WAY: 2,
  PUSH: 3,
  getNameForType: function(type) {
    switch (type) {
      case exports.ONE_WAY:
        return 'one_way';
      case exports.PUSH:
        return 'push';
    }
    return 'basic';
  }
};