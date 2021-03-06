/// <reference path="ftypes.d.ts" />
/// <reference path="../typings/es6-promise/es6-promise.d.ts" />
/// <reference path="../typings/node/node.d.ts" />

declare module 'sonparser' {
  import * as events from 'events';

  /**
   * Error class of ConfigParser
   */
  export class ConfigParseError extends Error {
    /**
     * @param msg error message
     */
    public new (msg?: string): ConfigParseError;
  }

  export interface ConfigParserMonoid<T, U> extends ftypes.Monoid<U> {}
  export interface ConfigParserFunctor<T, U> extends ftypes.Functor<U> {}
  export interface ConfigParserApplicative<T, U> extends ftypes.Applicative<U> {}
  export interface ConfigParserMonad<T, U> extends ftypes.Monad<U> {}
  export interface ConfigParserMonadPlus<T, U> extends ftypes.MonadPlus<U> {}

  /**
   * Parse result class (like either)
   *
   * @param S parsed value type
   */
  export interface ParseResult<S> {
    /**
     * check this result is success
     *
     * @returns is this success
     */
    isSuccess(): boolean;
  }

  /**
   * ConfigParserResult class including some helper methods
   *
   * @param T result type
   */
  export class ConfigParserResult<T> implements ftypes.Functor<T>, ftypes.Applicative<T>, ftypes.Monad<T> {
    /**
     * check this result is success
     *
     * @returns is this success
     */
    public isSuccess(): boolean;
    /**
     * an alias of [[isSuccess]]
     *
     * @returns is this success
     */
    public status: boolean;
    /**
     * report on failure using given reporter
     *
     * @param reporter a reporter (default: nest console reporter)
     * @returns this object as it is
     */
    public report(reporter?: ReporterType): ConfigParserResult<T>;
    /**
     * except success method,
     * return converted object on success and throw error
     *
     * @param msg failure message (default: config parser error message)
     * @returns success value
     */
    public except(msg?: string): T;
    /**
     * an alias of [[except]]
     * if fail, throw default error
     *
     * @returns success value
     */
    public ok: T;
    /**
     * convert result to success value
     *
     * @param val default value
     * @returns success value on success and default value on failure
     */
    public toSuccess(val: T): T;
    /**
     * convert result to error
     *
     * @param err default value
     * @returns error on failure and default value on success
     */
    public toError(err: Error): Error;
    /**
     * convert result to other by casing
     *
     * @param onSuccess convert success value function
     * @param onSuccess.obj success result value
     * @param onFailure convert error function
     * @param onFailure.err convert error
     * @returns convert success on success and error on failure
     */
    public caseOf<R>(onSuccess: (obj: T) => R, onFailure: (err: ConfigParseError) => R): R;
    /**
     * convert result to promise
     *
     * @returns a promise return converted value
     */
    public toPromise(): Promise<T>;
    /**
     * Fantasy area
     */
    public map<R>(fn: (obj: T) => R): ConfigParserResult<R>;
    public fmap: <R>(fn: (obj: T) => R) => ConfigParserResult<R>;
    public lift: <R>(fn: (obj: T) => R) => ConfigParserResult<R>;
    public of<R>(val: R): ConfigParserResult<R>;
    public unit: <R>(val: R) => ConfigParserResult<R>;
    public ap<R>(u: ConfigParserResult<(t: T) => R>): ConfigParserResult<R>;
    public bind<R>(f: (t: T) => ConfigParserResult<R>): ConfigParserResult<R>;
    public chain: <R>(f: (t: T) => ConfigParserResult<R>) => ConfigParserResult<R>;
  }

  /**
   * ConfigParser class including some helper methods
   *
   * @param T in object type
   * @param U out object type
   */
  export class ConfigParser<T, U> implements
  ConfigParserMonoid<T, U>, ConfigParserFunctor<T, U>,
  ConfigParserApplicative<T, U>, ConfigParserMonad<T, U>,
  ConfigParserMonadPlus<T, U> {
    /**
     * build a or parser of this
     *
     * @param parser second parser
     * @returns a or parser of this parser and arg parser
     */
    public or(parser: ConfigParser<T, U>): ConfigParser<T, U>;
    /**
     * build a and parser of this
     *
     * @param parser second parser
     * @returns a and parser of this parser and arg parser
     */
    public and<R>(parser: ConfigParser<U, R>): ConfigParser<T, R>;
    /**
     * build a map parser of this
     *
     * @param fn map function
     * @param fn.obj target converted object
     * @returns a map parser of this with arg function
     */
    public map<R>(fn: (obj: U) => R): ConfigParser<T, R>;
    /**
     * build a description parser of this
     *
     * @param msg description
     * @param exp expected type
     * @returns a description parser of this
     */
    public desc(msg: string, exp?: string): ConfigParser<T, U>;
    /**
     * build a description parser of this from only expected
     *
     * @param exp expected type or types
     * @returns a description parser of this from expected
     */
    public descFromExpected(exp: (string | string[])): ConfigParser<T, U>;
    /**
     * build a receive parser of this
     *
     * @param onSuccess receiver on success
     * @param onSuccess.obj receive success object
     * @param onFail receiver on fail
     * @param onFail.msg receive message
     * @param onFail.exp expected type
     * @param onFail.act actual type
     * @returns a receive parser of this
     */
    public then(
      onSuccess: (obj: U) => any, onFail?: (msg: string, exp?: string, act?: string) => any
    ): ConfigParser<T, U>;
    /**
     * build a catch parser of this
     *
     * @param onFail receiver on fail
     * @param onFail.msg receive message
     * @param onFail.exp expected type
     * @param onFail.act actual type
     * @returns a catch parser of this
     */
    public catch(onFail: (msg: string, exp?: string, act?: string) => any): ConfigParser<T, U>;
    /**
     * build a default parser of this
     *
     * @param def default value
     * @returns this parsed value on success and default value on fail
     */
    public default(def: U): ConfigParser<T, U>;
    /**
     * build a optional parser of this
     *
     * @param def default value
     * @returns this parsed value on success and default value on fail and this value is nothing
     */
    public option(def: U): ConfigParser<Object, U>;
    /**
     * build a seq parser
     *
     * @param parser second parser
     * @returns a parser returns two length array from first and second parsed value
     */
    public seq2<R>(parser: ConfigParser<T, R>): ConfigParser<T, [U, R]>;
    /**
     * parse object and return parsed value on success and throw error on fail
     *
     * @param obj target object
     * @returns parsed value
     * @throws ConfigParseError failed to parse
     */
    public parse(obj: T): U;
    /**
     * parse object and return parsed value with parse status
     *
     * @param obj target object
     * @returns result object ([[ConfigParserResult]])
     */
    public parseWithResult(obj: T): ConfigParserResult<U>;
    /**
     * parse object and return parsed value on promise
     *
     * @param obj target object
     * @returns a promise returning parsed value on success and error on fail
     */
    public parseAsync(obj: T): Promise<U>;
    /**
     * Fantasy area
     */
    public mempty: ConfigParser<T, U>;
    public empty: ConfigParser<T, U>;
    public mappend: (parser: ConfigParser<T, U>) => ConfigParser<T, U>;
    public append: (parser: ConfigParser<T, U>) => ConfigParser<T, U>;
    public mconcat(ps: ConfigParser<T, U>[]): ConfigParser<T, U>;
    public concat: (ps: ConfigParser<T, U>[]) => ConfigParser<T, U>;
    public fmap: <R>(fn: (obj: U) => R) => ConfigParser<T, R>;
    public lift: <R>(fn: (obj: U) => R) => ConfigParser<T, R>;
    public of<R>(val: R): ConfigParser<U, R>;
    public unit: <R>(val: R) => ConfigParser<U, R>;
    public ap<R>(u: ConfigParser<T, (t: U) => R>): ConfigParser<T, R>;
    public bind<R>(f: (t: U) => ConfigParser<T, R>): ConfigParser<T, R>;
    public chain: <R>(f: (t: U) => ConfigParser<T, R>) => ConfigParser<T, R>;
    public mzero: ConfigParser<T, U>;
    public zero: ConfigParser<T, U>;
    public mplus: (parser: ConfigParser<T, U>) => ConfigParser<T, U>;
    public plus: (parser: ConfigParser<T, U>) => ConfigParser<T, U>;
  }
  /** a parser of base of base for chain root */
  export const base: ConfigParser<Object, Object>;
  /**
   * build a success parser with value
   *
   * @param val success value
   * @returns a parser with success and given value
   */
  export function succeed<T>(val: T): ConfigParser<any, T>;
  /**
   * build a fail parser with fail info
   *
   * @param msg failure message
   * @param expected expected type
   * @returns a parser with fail and fail info
   */
  export function fail<T>(msg?: string, expected?: string): ConfigParser<any, T>;
  /** a type parser for boolean type */
  export const boolean: ConfigParser<Object, boolean>;
  /** a type parser for number type */
  export const number: ConfigParser<Object, number>;
  /** a type parser for string type */
  export const string: ConfigParser<Object, string>;
  /** a type parser for object type */
  export const object: ConfigParser<Object, Object>;
  /**
   * build a type parser for array type
   *
   * @param parser for element parsed
   * @returns a type parser for array type with custom type parser
   */
  export function array<T>(parser: ConfigParser<Object, T>): ConfigParser<Object, T[]>;
  /**
   * build a type parser for specify object type
   *
   * @param props property and custom parser list
   * @returns a type parser for specify object type with custom type parser
   */
  export function hasProperties<T>(props: [string, ConfigParser<Object, any>][]): ConfigParser<Object, T>;
  /**
   * @param T first type
   * @param parser for parsing first element
   * @returns a tuple1 type parser
   */
  export function tuple1<T>(
    parser: ConfigParser<Object, T>
  ): ConfigParser<Object, [T]>;
  /**
   * @param T1 first type
   * @param T2 second type
   * @param parser1 for parsing first element
   * @param parser2 for parsing second element
   * @returns a tuple2 type parser
   */
  export function tuple2<T1, T2>(
    parser1: ConfigParser<Object, T1>,
    parser2: ConfigParser<Object, T2>
  ): ConfigParser<Object, [T1, T2]>;
  /**
   * @param T1 first type
   * @param T2 second type
   * @param T3 third type
   * @param parser1 for parsing first element
   * @param parser2 for parsing second element
   * @param parser3 for parsing third element
   * @returns a tuple3 type parser
   */
  export function tuple3<T1, T2, T3>(
    parser1: ConfigParser<Object, T1>,
    parser2: ConfigParser<Object, T2>,
    parser3: ConfigParser<Object, T3>
  ): ConfigParser<Object, [T1, T2, T3]>;
  /**
   * @param T1 first type
   * @param T2 second type
   * @param T3 third type
   * @param T4 fourth type
   * @param parser1 for parsing first element
   * @param parser2 for parsing second element
   * @param parser3 for parsing third element
   * @param parser4 for parsing fourth element
   * @returns a tuple4 type parser
   */
  export function tuple4<T1, T2, T3, T4>(
    parser1: ConfigParser<Object, T1>,
    parser2: ConfigParser<Object, T2>,
    parser3: ConfigParser<Object, T3>,
    parser4: ConfigParser<Object, T4>
  ): ConfigParser<Object, [T1, T2, T3, T4]>;
  /**
   * @param T1 first type
   * @param T2 second type
   * @param T3 third type
   * @param T4 fourth type
   * @param T5 fifth type
   * @param parser1 for parsing first element
   * @param parser2 for parsing second element
   * @param parser3 for parsing third element
   * @param parser4 for parsing fourth element
   * @param parser5 for parsing fifth element
   * @returns a tuple5 type parser
   */
  export function tuple5<T1, T2, T3, T4, T5>(
    parser1: ConfigParser<Object, T1>,
    parser2: ConfigParser<Object, T2>,
    parser3: ConfigParser<Object, T3>,
    parser4: ConfigParser<Object, T4>,
    parser5: ConfigParser<Object, T5>
  ): ConfigParser<Object, [T1, T2, T3, T4, T5]>;
  /**
   * build a hash type parser
   *
   * @param parser for parsing elements
   * @returns a type parser for hash
   */
  export function hash<T>(parser: ConfigParser<Object, T>): ConfigParser<Object, { [key: string]: T; }>;
  /**
   * build a custom parser with custom parse function
   *
   * @param fn custom parse function
   * @param fn.onSuccess make success function
   * @param fn.onSuccess.obj parsed success value
   * @param fn.onFailure make failure function
   * @param fn.onFailure.msg failure message
   * @param fn.onFailure.exp expected type
   * @param fn.onFailure.act actual object
   * @returns a parser with custom parse function
   */
  export function custom<T, U>(
    fn: (
      onSuccess: (obj: U) => ParseResult<U>,
      onFailure: (msg?: string, exp?: string, act?: string) => ParseResult<U>
    ) => (obj: T) => ParseResult<U>
  ): ConfigParser<T, U>;
  /**
   * parse son file with object parser
   *
   * @param fname target son file name
   * @param parser custom parser using to parse
   * @returns result of parsed
   */
  export function parseFile<T>(fname: string, parser: ConfigParser<Object, T>): T;
  /**
   * parse son file using object parser with status
   *
   * @param fname target son file name
   * @param parser custom parser using to parse
   * @returns result of parsed with status
   */
  export function parseFileWithResult<T>(fname: string, parser: ConfigParser<Object, T>): ConfigParserResult<T>;
  /**
   * parse son file using object parser on promise
   *
   * @param fname target son file name
   * @param parser custom parser using to parse
   * @returns a promise parsing son file using given parser
   */
  export function parseFileAsync<T>(fname: string, parser: ConfigParser<Object, T>): Promise<T>;
  /**
   * reporter type
   *
   * @param ReporterType.msg failure message
   * @param ReporterType.exp expected type
   * @param ReporterType.act actual object
   * @param ReporterType.childs nodes of error
   */
  export type ReporterType = (msg: string, exp: string, act: string, childs: any[]) => void;
  /**
   * any reporters
   */
  export namespace reporters {
    /**
     * custom report function type
     *
     * @param customReportFunc.reportInfo report information
     * @param customReportFunc.reportInfo.message fail message
     * @param customReportFunc.reportInfo.expected expected type
     * @param customReportFunc.reportInfo.actual actual recept object
     * @param customReportFunc.data extra report data
     * @param customReportFunc.data.depth called depth count
     * @param customReportFunc.data.isLeaf the flag of is leaf
     * @param customReportFunc.data.propertyName full propertyname
     */
    export type customReportFunc = (reportInfo: {
        message?: string;
        expected?: string;
        actual?: string;
    }, data?: {
        depth: number;
        isLeaf: boolean;
        propertyName: string;
    }) => void;
    /**
     * A builder of reporter with nested show
     *
     * @param logFunc print function for log
     * @param depth depth count (if not set, all logged)
     * @returns nested show reporter
     */
    export function nestReporter(logFunc: (msg: string) => any, depth?: number): ReporterType;
    /**
     * A builder of reporter with listed show
     *
     * @param logFunc print function for log
     * @param depth depth count (if not set, all logged)
     * @returns listed show reporter
     */
    export function listReporter(logFunc: (msg: string) => any, depth?: number): ReporterType;
    /**
     * A builder of reporter with json show
     *
     * @param logFunc print function for log
     * @param flags reporter options
     * @param flags.isOneLine is report one line (default: false)
     * @param depth depth count (if not set, all logged)
     * @returns json show reporter
     */
    export function jsonReporter(
      logFunc: (msg: string) => any, flags?: {
        isOneLine?: boolean;
      }, depth?: number
    ): ReporterType;
    export function jsonReporter(logFunc: (msg: string) => any, depth?: number): ReporterType;
    /**
     * A builder of customize reporter with given function
     *
     * @param reportFunc custom report function
     * @returns a reporter with given function
     */
    export function customReporter(reportFunc: customReportFunc, emitterObj?: events.EventEmitter): ReporterType;
  }
}
