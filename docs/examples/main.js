'use strict';

var sparse = require('sonparser');
var assert = require('assert');

var nestConsoleReporter = sparse.reporters.nestReporter(console.log);

/**
 * check boolean
 */
var booleanParser = sparse.boolean;

var resultCheckBoolean = booleanParser.parse(true);

assert.strictEqual(
  resultCheckBoolean,
  true
);

assert.throws(
  function() {
    return booleanParser.parse('not boolean!');
  },
  sparse.ConfigParseError
);

// if you don't want to use try-catch
var resultCheckBooleanSafetySuccess = booleanParser.parseWithResult(false);

assert.strictEqual(
  resultCheckBooleanSafetySuccess.status,
  true
);
assert.strictEqual(
  resultCheckBooleanSafetySuccess.ok,
  false
);

var resultCheckBooleanSafetyFailure = booleanParser.parseWithResult('not boolean!');

assert.strictEqual(
  resultCheckBooleanSafetyFailure.status,
  false
);

// you can see more human readable message by using reporters
/**
 * Output:
 * this : "not boolean!" is not 'boolean'
 */
try {
  booleanParser.parseWithResult('not boolean!', nestConsoleReporter);
} catch (e) {

  // catch Error
}

/**
 * check and convert my object
 */
var myObjectParser = sparse.hasProperties([
  ['private', sparse.boolean.option(false)],
  ['name', sparse.string],
  ['version', sparse.string],
  ['description', sparse.string],
  ['keywords', sparse.array(sparse.string).option([])],
  ['scripts', sparse.object],
  ['repository', sparse.hasProperties([
    ['type', sparse.string],
    ['url', sparse.string],
  ]).option({
    type: 'git',
    url: '',
  })],
]);

var resultCheckMyObject = myObjectParser.parse({
  name: 'example-sonparser',
  version: '0.0.0',
  description: 'An example of sonparser',
  keywords: [
    'example',
    'more', 'complexible',
  ],
  scripts: {
    test: 'echo "not implements!" && exit 1',
  },
});

assert.deepEqual(
  resultCheckMyObject,
  {
    private: false,
    name: 'example-sonparser',
    version: '0.0.0',
    description: 'An example of sonparser',
    keywords: [
      'example',
      'more', 'complexible',
    ],
    scripts: {
      test: 'echo "not implements!" && exit 1',
    },
    repository: {
      type: 'git',
      url: '',
    },
  }
);

assert.throws(
  function() {
    return myObjectParser.parse('not my object!');
  },
  sparse.ConfigParseError
);

// you can see more human readable message by using reporters
/**
 * Output:
 * this : failed to parse elem of 'object'
 * ├── .private : "not boolean!" is not 'boolean'
 * ├── .version : 0 is not 'string'
 * ├─┬ .keywords : failed to parse elem of 'array'
 * │ └── [1] : true is not 'string'
 * ├── .scripts : undefined is not 'object'
 * └─┬ .repository : failed to parse elem of 'object'
 *   └── .type : 0 is not 'string'
 */
try {
  myObjectParser.parseWithResult({
    private: 'not boolean!',
    name: 'example-sonparser',
    version: 0,
    description: 'An example of sonparser',
    keywords: [
      'example',
      true,
    ],
    repository: {
      type: 0,
      url: '',
    },
  }).report(nestConsoleReporter)
    .except(); // throw Error
} catch (e) {

  // catch Error
}
