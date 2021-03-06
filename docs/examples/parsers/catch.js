'use strict';

var sparse = require('sonparser');
var assert = require('assert');

assert.strictEqual(
  sparse.boolean.catch(function() {
    throw Error('This function will not be called.');
  }).parse(true),
  true
); // success

/**
 * Catch parser returns last parsed as it is.
 */
assert.throws(
  function() {
    return sparse.boolean.catch(function(msg, exp, act) {
      console.log('Error: ' + msg);
      console.log('Error: Expected ' + exp + ', but actual ' + act + '.');
    }).parse('str');
  },
  sparse.ConfigParseError
); // failure
