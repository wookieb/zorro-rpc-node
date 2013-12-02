'use strict';

var parseHeaders, parseHeader,
    headerRegexp = /^([a-zA-Z0-9\-]+):\s*(.*)\n?$/; // OCTET | *(TEXT | token | separators | quoted-string)
/**
 * Parse headers string to hash object
 *
 * @param {string} headers
 * @returns {object}
 *
 * @throws Error when one of headers is invalid
 */
exports.parseHeaders = parseHeaders = function(headers) {
    return headers
        .split("\n")
        .map(function(line) {
            return line.trim();
        })
        .filter(function(line) {
            return line.length > 0;
        })
        .map(parseHeader)
        .reduce(function(initial, header) {
            if (header) {
                initial[header[0]] = header[1];
            }
            return initial;
        }, {});
};

/**
 * Parse single header line
 *
 * @param {string} header
 * @returns {Array} tuple of name and value of header
 */
exports.parseHeader = parseHeader = function(header) {
    var matches = header.match(headerRegexp);
    if (matches) {
        return matches.slice(1, 3);
    }
};
