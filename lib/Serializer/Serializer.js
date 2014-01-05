'use strict';

var format = require('format');

/**
 * Abstract serializer than need to be extended
 * Defines container for data formats.
 * Serializer will use default mime type (and thereby default data format) for every operation
 * that does not define mime type
 *
 * @constructor
 *
 * @property {DataFormat} defaultDataFormat default data format object
 * @property {string} defaultMimeType default mime type
 */
var Serializer = function() {
    var data = {};
    this._dataFormats = {};

    Object.defineProperty(this, 'defaultDataFormat', {
        set: function(value) {
            this.registerDataFormat(value);
            data.defaultMimeType = value.mimeTypes[0];
        },
        get: function() {
            return this._dataFormats[data.defaultMimeType];
        },
        configurable: false
    });

    Object.defineProperty(this, 'defaultMimeType', {
        get: function() {
            return data.defaultMimeType;
        }
    });
};

/**
 * Register data format that is used to serialize and unserialize data for mimetype
 * associated with it
 *
 * @param {DataFormat} dataFormat
 */
Serializer.prototype.registerDataFormat = function(dataFormat) {
    var mimeTypes = dataFormat.mimeTypes, i;
    for (i = 0; i < mimeTypes.length; i++) {
        this._dataFormats[mimeTypes[i]] = dataFormat;
    }
};

/**
 * Returns data format object that is able to serialize and unserialize data with given mime type
 *
 * @param {String} mimeType
 * @returns {DataFormat}
 */
Serializer.prototype.getDataFormatForMimeType = function(mimeType) {
    mimeType = mimeType || this.defaultMimeType;
    var dataFormat = this._dataFormats[mimeType];
    if (!dataFormat) {
        throw new Error(format('No data format specified for mimetype "%s"', mimeType));
    }
    return dataFormat;
};

module.exports = Serializer;
