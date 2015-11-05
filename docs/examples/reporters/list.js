var sparse = require("sonparser");
var assert = require("assert");

var listReporter = sparse.Reporters.listReporter;

var listConsoleReporter = listReporter(
  console.log
);
var listShConsoleReporter = listReporter(
  console.log, 1
);

/**
 * Output:
 * this : "not boolean" is not 'boolean'
 */
assert.throws(
  function() {
    return sparse.boolean.parseWithReporter(
      "not boolean",
      listConsoleReporter
    );
  },
  sparse.ConfigParseError
);

/**
 * Output:
 * this.pB : "not boolean" is not 'boolean'
 * this.pP1.pB : "not boolean" is not 'boolean'
 * this.pP1.pA[0] : 0 is not 'boolean'
 * this.pP1.pA[2] : "str" is not 'boolean'
 * this.pP2 : "not object" is not 'object'
 */
assert.throws(
  function() {
    return sparse.hasProperties([
      ["pB", sparse.boolean],
      ["pP1", sparse.hasProperties([
        ["pB", sparse.boolean],
        ["pA", sparse.array(sparse.boolean)],
      ])],
      ["pP2", sparse.hasProperties([
        ["pB", sparse.boolean],
      ])],
    ]).parseWithReporter({
      "pB": "not boolean",
      "pP1": {
        "pB": "not boolean",
        "pA": [0, true, "str"],
      },
      "pP2": "not object",
    }, listConsoleReporter);
  },
  sparse.ConfigParseError
);

/**
 * Output:
 * this.pB : "not boolean" is not 'boolean'
 * this.pP1 : failed to parse elem of 'object'
 * this.pP2 : "not object" is not 'object'
 */
assert.throws(
  function() {
    return sparse.hasProperties([
      ["pB", sparse.boolean],
      ["pP1", sparse.hasProperties([
        ["pB", sparse.boolean],
        ["pA", sparse.array(sparse.boolean)],
      ])],
      ["pP2", sparse.hasProperties([
        ["pB", sparse.boolean],
      ])],
    ]).parseWithReporter({
      "pB": "not boolean",
      "pP1": {
        "pB": "not boolean",
        "pA": [0, true, "str"],
      },
      "pP2": "not object",
    }, listShConsoleReporter);
  },
  sparse.ConfigParseError
);
