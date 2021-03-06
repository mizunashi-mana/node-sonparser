import {
  ParseErrorStocker,
  ParseErrorNode,
} from './parseresult/parseerr';

import {
  ParseResult,
  SuccessObjType,
  mapSuccess,
} from './parseresult/result';

import {
  JSONstringify,
} from './lib/util/ts-util';

/**
 * base function type of [[Parser]]
 * @param ParseFunc.obj success object
 */
export type ParseFunc<T, U> = (obj: SuccessObjType<T>) => ParseResult<U>;

/**
 * make Success Object from source success object and converted value
 *
 * @param obj source success object
 * @param convObj converted success value
 * @returns new success object including converted value
 * @param T source object type
 * @param U converted object type
 */
export function makeSuccess<T, U>(obj: SuccessObjType<T>, convObj: U) {
  return ParseResult.success(mapSuccess((v) => convObj, obj));
}

/**
 * make Success Object from source success object and converted value
 *
 * @param obj source success object
 * @param msg failure message
 * @param exp expected type
 * @param childs error childs nodes
 * @returns new success object including converted value
 * @param T source object type
 * @param U converted object type
 */
export function makeFailure<T, U>(
  obj: SuccessObjType<T>, msg?: string, exp?: string, childs?: ParseErrorNode[]
): ParseResult<U>;
export function makeFailure<T, U>(
  obj: SuccessObjType<T>, msg?: string, exp?: string, act?: string, childs?: ParseErrorNode[]
): ParseResult<U>;
export function makeFailure<T, U>(
  obj: SuccessObjType<T>,
  msg?: string,
  exp?: string,
  arg4?: string|ParseErrorNode[],
  arg5?: ParseErrorNode[]
): ParseResult<U> {
  const message = typeof msg === 'string'
    ? msg
    : 'failed to parse'
    ;
  const expected = typeof exp === 'string'
    ? exp
    : 'unknown'
    ;
  const actual = typeof arg4 === 'string'
    ? arg4
    : JSONstringify(obj.value)
    ;
  const childs = typeof arg4 === 'string'
    ? arg5
    : arg4
    ;
  return ParseResult.fail<U>({
    value: new ParseErrorStocker(message, expected, actual, childs),
    flags: obj.flags,
  });
}

/**
 * alias function type of [[ParseFunc]] for [[mapParseResult]]
 * @param MapperParseResult.obj receive success value of result
 */
export type MapperParseResult<T, U> = (obj: T) => ParseResult<U>;

/**
 * wrapper and builder for [[ParseFunc]]
 *
 * @param f receive makeSuccess and makeFailure and create parse function for [[Parser]]
 * @param f.mkS make success function
 * @param f.mkS.obj success value of result
 * @param f.mkF make failure function
 * @param f.mkF.msg failure message
 * @param f.mkF.exp expected type
 * @returns parse function for [[Parser]]
 * @param T source object type
 * @param U converted object type
 */
export function mapParseResult<T, U>(f: (
  mkS: (obj: U) => ParseResult<U>,
  mkF: (msg?: string, exp?: string, act?: string) => ParseResult<U>
) => MapperParseResult<T, U>): ParseFunc<T, U> {
  return (obj) => f(
    (convObj: U) => makeSuccess<T, U>(obj, convObj),
    (msg?: string, exp?: string, act?: string) => makeFailure<T, U>(obj, msg, exp, act)
  )(obj.value);
}

/**
 * Parser class including parse function ([[ParseFunc]])
 *
 * @param T source object type
 * @param U converted object type
 */
export class Parser<T, U> {
  /**
   * having parse function
   */
  private action: ParseFunc<T, U>;

  /**
   * @param fn inner parse function
   */
  constructor(fn: ParseFunc<T, U>) {
    this.action = fn;
  }

  /**
   * parse source object with this parser
   *
   * @param obj source object
   * @returns result of parsing
   */
  public parse(obj: SuccessObjType<T>): ParseResult<U> {
    return this.action(obj);
  }
}
