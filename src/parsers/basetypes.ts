import {
  Parser,
  makeFailure as makeFailureP,
  makeSuccess as makeSuccessP,
  mapParseResult,
  MapperParseResult,
} from '../common';

import {
  ParseResult,
  SuccessObjType,
  mapFailure,
  mapSuccess,
} from '../parseresult/result';

import {
  ParseErrorStocker,
} from '../parseresult/parseerr';

import {
  descFromExpectedParser,
} from './baseparsers';

import {
  exists,
} from '../lib/util/ts-util';

/**
 * Wrapper for type parsers
 *
 * @param f type parse function
 * @param f.mkS make success function
 * @param f.mkS.convObj success value of result
 * @param f.mkF make fail function
 * @param expected expected type or types
 * @returns a type parser with custom parsing
 */
function buildTypeParser<T>(
  f: (
    mkS: (convObj: T) => ParseResult<T>,
    mkF: () => ParseResult<T>
  ) => MapperParseResult<Object, T>,
  expected: string | string[]
): Parser<Object, T> {
  const innerParser = new Parser(mapParseResult<Object, T>(f));
  return descFromExpectedParser(expected, innerParser);
}

/**
 * A builder of number type parser
 *
 * @returns number type parser
 */
export function isNumber() {
  return buildTypeParser<number>((makeSuccess, makeFailure) => {
    return (obj) => typeof obj === 'number'
      ? makeSuccess(obj)
      : makeFailure()
      ;
  }, 'number');
}

/**
 * A builder of string type parser
 *
 * @returns string type parser
 */
export function isString() {
  return buildTypeParser<string>((makeSuccess, makeFailure) => {
    return (obj) => typeof obj === 'string'
      ? makeSuccess(obj)
      : makeFailure()
      ;
  }, 'string');
}

/**
 * A builder of boolean type parser
 *
 * @returns boolean type parser
 */
export function isBoolean() {
  return buildTypeParser<boolean>((makeSuccess, makeFailure) => {
    return (obj) => typeof obj === 'boolean'
      ? makeSuccess(obj)
      : makeFailure()
      ;
  }, 'boolean');
}

/**
 * create error node of array from index
 *
 * @param i index of array
 * @param fl error value in array
 * @returns error node of array
 */
function buildErrorChild(i: number, fl: ParseErrorStocker) {
  return <[string, ParseErrorStocker]>[`[${i}]`, fl];
}

/**
 * A concat function of array parse results
 *
 * @param ArrayResultConcat.res1 previous returned last function
 * @param ArrayResultConcat.res2 current parsed result
 * @param ArrayResultConcat.index current index
 */
type ArrayResultConcat<T> = (
  res1: ParseResult<T[]>,
  res2: ParseResult<T>,
  index: number
) => ParseResult<T[]>;

/**
 * A builder of concat function of array parse results
 *
 * @param sObj target success object
 * @returns concat function of array parse results
 */
function prconcat<T>(
  sObj: SuccessObjType<Object>
): ArrayResultConcat<T> {
  return (
    res1: ParseResult<T[]>,
    res2: ParseResult<T>,
    index: number
  ) => res1.caseOf(
    (l1) => res2.caseOf(
      (l2) => ParseResult.fail<T[]>(
        mapFailure((s) => s.addChild(buildErrorChild(index, l2.value)), l1)
      ),
      (r2) => ParseResult.fail<T[]>(l1)
    ),
    (r1) => res2.caseOf(
      (l2) => makeFailureP<Object, T[]>(
        sObj,
        "failed to parse elem of 'array'",
        'array',
        [buildErrorChild(index, l2.value)]
      ),
      (r2) => makeSuccessP(sObj, r1.value.concat([r2.value]))
    )
  );
}

/**
 * wrapper of mapSuccess
 *
 * @param sObj source success object
 * @param obj success value
 * @returns a success object with given value
 */
function makeSuccessObject<T, U>(sObj: SuccessObjType<T>, obj: U) {
  return mapSuccess((s) => obj, sObj);
}

/**
 * A type parse function of array object
 *
 * @param arr target object with type safe
 * @param parser a parser for parsing each elements of array
 * @param sObj target success object
 * @returns result of array
 */
function parseArrayObj<T>(
  arr: Object[],
  parser: Parser<Object, T>,
  sObj: SuccessObjType<Object>
): ParseResult<T[]> {
  const results: ParseResult<T>[] = [];
  for (const obj of arr) {
    const convObj = parser.parse(
      makeSuccessObject(sObj, obj)
    );
    if (!convObj.isSuccess() && !sObj.flags.isReport) {
      break;
    }
    results.push(convObj);
  }
  if (results.length !== arr.length) {
    return makeFailureP<Object, T[]>(sObj, "failed to parse elem of 'array'", 'array');
  }
  return results.reduce(
    prconcat<T>(sObj),
    makeSuccessP(sObj, <T[]>[])
  );
}

/**
 * A builder of array type parser
 *
 * @param parser for parsing elements
 * @returns array type parser
 */
export function isArray<T>(parser: Parser<Object, T>) {
  return new Parser<Object, T[]>((obj) => {
    const value = obj.value;
    return value instanceof Array
      ? parseArrayObj(value, parser, obj)
      : makeFailureP<Object, T[]>(obj, `${JSON.stringify(obj.value)} is not 'array'`, 'array')
      ;
  });
}

/**
 * A builder of object type parser
 *
 * Object do not include Array
 *
 * @returns object type parser
 */
export function isObject() {
  return buildTypeParser<Object>((makeSuccess, makeFailure) => {
    return (obj) => typeof obj === 'object' && !(obj instanceof Array)
      ? makeSuccess(obj)
      : makeFailure()
      ;
  }, 'object');
}

/**
 * A builder of nothing type parser; nothing is not exist value (null and undefined)
 *
 * @param value success value
 * @returns nothing type parser returned default value on success
 */
export function isNothing<T>(value: T) {
  return buildTypeParser<T>((makeSuccess, makeFailure) => {
    return (obj) => exists(obj)
      ? makeFailure()
      : makeSuccess(value)
      ;
  }, ['undefined', 'null']);
}
