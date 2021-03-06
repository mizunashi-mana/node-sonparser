import {ParseErrorStocker} from './parseerr';

import {id} from '../lib/util/ts-util';

/**
 * Result types
 */
export enum ResultType {
  /** Success Type for converting */
  Success,
  /** Failure Type for nothing */
  Failure,
}

/**
 * Result flags
 */
export type ResultFlagType = {
  /**
   * is this parser reporting finally?
   */
  isReport: boolean;
};

export interface BaseObjType {
  flags: ResultFlagType;
}

/**
 * parser's object type on fail
 */
export interface FailObjType extends BaseObjType {
  value:  ParseErrorStocker;
}

/**
 * parser's object type on success
 */
export interface SuccessObjType<S> extends BaseObjType {
  value: S;
}

/**
 * map function of success object
 *
 * @param f map function
 * @param f.s received success value
 * @param v target success object
 * @returns converted success object with given map function
 */
export function mapSuccess<S, T>(f: (s: S) => T, v: SuccessObjType<S>) {
  return {
    value: f(v.value),
    flags: v.flags,
  };
}

/**
 * map function of failure object
 *
 * @param f map function
 * @param f.s received failure value
 * @param v target failure object
 * @returns converted failure object with given map function
 */
export function mapFailure(f: (s: ParseErrorStocker) => ParseErrorStocker, v: FailObjType) {
  return {
    value: f(v.value),
    flags: v.flags,
  };
}

/**
 * Parse result class (like either)
 *
 * @param S parsed value type
 */
export class ParseResult<S> {
  private t: ResultType;
  private lv: FailObjType;
  private rv: SuccessObjType<S>;

  constructor(type: ResultType, fail: FailObjType, success?: SuccessObjType<S>) {
    this.t = type;
    this.lv = fail;
    this.rv = success;
  }

  /**
   * create success result
   *
   * @param value of success
   * @returns success parse result
   */
  public static success<S>(value: SuccessObjType<S>) {
    return new ParseResult<S>(ResultType.Success, undefined, value);
  }

  /**
   * create fail result
   *
   * @param value of fail
   * @returns fail parse result
   */
  public static fail<S>(value: FailObjType) {
    return new ParseResult<S>(ResultType.Failure, value);
  }

  /**
   * create function merging two result value
   *
   * @param f merge function return merge result
   * @param f.arg1 first success result
   * @param f.arg2 second success result
   * @returns safe function merging two result value
   */
  public static bind2<T1, T2, T3>(
    f: (arg1: SuccessObjType<T1>, arg2: SuccessObjType<T2>) => ParseResult<T3>
  ) {
    return (
      res1: ParseResult<T1>,
      res2: ParseResult<T2>
    ) => res1.chain(
      (val1) => res2.chain<T3>((val2) => f(val1, val2))
    );
  }

  /**
   * check this result is success
   *
   * @returns is this success
   */
  public isSuccess(): boolean {
    return this.t === ResultType.Success;
  }

  /**
   * bind result
   *
   * @param f bind function
   * @param f.r this success object
   * @returns fail on fail and bind value on success
   */
  public chain<T>(f: (r: SuccessObjType<S>) => ParseResult<T>) {
    return this.isSuccess()
      ? f(this.rv)
      : ParseResult.fail<T>(this.lv)
      ;
  }

  /**
   * unit result
   *
   * @param t unit value
   * @returns success include unit value
   */
  public of<T>(t: SuccessObjType<T>) {
    return ParseResult.success<T>(t);
  }

  /**
   * fmap result
   *
   * @param f map function
   * @param f.r this success object
   * @returns fail on fail and map value on success
   */
  public lift<T>(f: (r: SuccessObjType<S>) => SuccessObjType<T>) {
    return this.chain((val) => this.of<T>(f(val)));
  }

  /**
   * convert fail to success
   * My sad is not existing pattern match...
   *
   * @param f catch function
   * @param f.l this failure object
   * @returns this value on success and converted success value on fail
   */
  public catch(f: (l: FailObjType) => SuccessObjType<S>) {
    return ParseResult.success<S>(
      this.isSuccess()
      ? this.rv
      : f(this.lv)
    );
  }

  /**
   * no comment
   */
  public caseOf<T>(
    fl: (l: FailObjType) => T,
    fr: (r: SuccessObjType<S>) => T
  ): T {
    return this.isSuccess()
      ? fr(this.rv)
      : fl(this.lv)
      ;
  }

  /**
   * clone this object
   */
  public clone() {
    return this.isSuccess()
      ? ParseResult.success<S>(id(this.rv))
      : ParseResult.fail<S>(id(this.lv))
      ;
  }

　/**
   * type safe get success value
   *
   * @param def default value
   * @returns return this value on success and default value on fail
   */
  public valueSuccess(def: SuccessObjType<S>): SuccessObjType<S> {
    return this.isSuccess()
      ? this.rv
      : def
      ;
  }

  /**
   * type safe get failure value
   *
   * @param def default value
   * @returns return this failure on fail and default value on success
   */
  public valueFailure(def: FailObjType): FailObjType {
    return this.isSuccess()
      ? def
      : this.lv
      ;
  }
}
