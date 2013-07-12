'use strict';

/**
 * Parse headers string to hash object
 *
 * @param {string} headers
 * @returns {object}
 *
 * @throws Error when one of headers is invalid
 */
exports.parseHeaders = function(headers) {
  var lines = headers.split("\n"),
    i,
    parsedHeaders = {},
    header;
  for (i = 0; i < lines.length; i++) {
    if (lines[i]) {
      header = exports.parseHeader(lines[i]);
      parsedHeaders[header[0]] = header[1];
    }
  }
  return parsedHeaders;
};

exports.parseHeader = function(header) {
  var splitted = header.split(':'),
    headerName, headerValue;
  if (splitted.length !== 2) {
    throw new Error('Invalid header format "'+header+'"');
  }
  headerName = splitted[0];
  headerValue = splitted[1];
  if (!/^[a-z0-9\-_]+\n?$/i.test(headerName)) {
    throw new Error('Invalid header name "'+headerName+'"');
  }

  return [headerName, headerValue];
};