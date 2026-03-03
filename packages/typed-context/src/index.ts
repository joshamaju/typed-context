import type { Context, Effect, Operation, Provide, Task } from "effection";
import type { ProviderTypeId, RequirementTypeId } from "./internal/core.js";
import * as core from "./internal/core.js";

type RequirementTypeId = typeof RequirementTypeId;

/**
 * @since 0.0.1
 * @category model
 */
export interface Requirement<T> {
  readonly [RequirementTypeId]: {
    readonly _in: (x: T) => void;
    readonly _out: T;
  };
  readonly _: T;
}

type ProviderTypeId = typeof ProviderTypeId;

/**
 * @since 0.0.1
 * @category model
 */
export interface Provider<T> {
  readonly [ProviderTypeId]: {
    readonly _in: (x: T) => void;
    readonly _out: T;
  };
  readonly _In: T;
}

/** @internal */
export type Parts<O> =
  O extends Generator<infer Y, infer R, infer N> ? { Y: Y; R: R; N: N } : never;

/** @internal */
export type ProvidedTypes<P extends Generator<any, any, any>> =
  Extract<Parts<P>["Y"], Provider<any>> extends infer I
    ? I extends Provider<infer A>
      ? A
      : never
    : never;

/** @internal */
export type StripRequirementsProvidedBy<Y, Provided> =
  Y extends Requirement<infer A> ? (A extends Provided ? never : Y) : Y;

type ProviderInner<Y> =
  Extract<Y, Provider<any>> extends infer I
    ? I extends Provider<infer A>
      ? A
      : never
    : never;

/** @internal */
export type Provided<P extends Generator<any, any, any>> = ProviderInner<
  Parts<P>["Y"]
>;

type RequirementInner<Y> =
  Extract<Y, Requirement<any>> extends infer T
    ? T extends Requirement<infer A>
      ? A
      : never
    : never;

type Required<E extends Generator<any, any, any>> = RequirementInner<
  Parts<E>["Y"]
>;

/** @internal */
export type RequireAtLeastOneSatisfied<
  E extends Generator<any, any, any>,
  P extends Generator<any, any, any>,
> = [Extract<Required<E>, Provided<P>>] extends [never] ? never : () => P;

export type TypedContext<T> = Omit<Context<T>, "expect" | "get" | "set"> & {
  set: (value: T) => Generator<Effect<unknown> | Provider<T>, T, unknown>;
  get: () => Generator<
    Effect<unknown> | Requirement<T>,
    T | undefined,
    unknown
  >;
  expect: () => Generator<Effect<unknown> | Requirement<T>, T, unknown>;
};

/**
 * @since 0.0.1
 * @category constructor
 */
export const createContext: <T>(
  name: string,
  defaultValue?: T | undefined,
) => TypedContext<T> = core.createContext;

/**
 * @since 0.0.1
 * @category function
 */
export const spawn: <O extends Generator<any, any, any>>(
  op: () => O,
) => Generator<Parts<O>["Y"], Task<Parts<O>["R"]>, Parts<O>["N"]> = core.spawn;

/**
 * @since 0.0.1
 * @category function
 */
export const resource: <T, O extends Generator<any, any, any>>(
  op: (provide: Provide<T>) => O,
) => Generator<Parts<O>["Y"], T, Parts<O>["N"]> = core.resource;

/**
 * @since 0.0.1
 * @category function
 */
export const run: <O extends Generator<any, any, any>>(
  op: () => O,
) => Task<Parts<O>["R"]> = core.run;

/**
 * @since 0.0.1
 * @category function
 */
export const main: <
  O extends Generator<Effect<unknown> | Provider<any>, any, any>,
>(
  op: (args: string[]) => O,
) => Promise<void> = core.main;

/**
 * @since 0.0.1
 * @category function
 */
export const all: <
  O extends readonly (Generator<any, any, any> | Operation<any>)[] | [],
>(
  ops: O,
) => Generator<
  O[number] extends infer T
    ? T extends Generator<any, any, any>
      ? Parts<T>["Y"]
      : T extends Operation<any>
        ? Effect<unknown>
        : never
    : never,
  {
    -readonly [K in keyof O]: O[K] extends Operation<infer T>
      ? T
      : Parts<O[K]>["R"];
  },
  unknown
> = core.all;

/**
 * Strips providers `Injector<T>` from operation. Use only when you've provided
 * all services.
 *
 * @since 0.0.1
 * @category utility
 */
export const strip: <E extends Generator<any, any, any>>(
  operation: () => E,
) => Generator<
  Effect<unknown> | Exclude<Parts<E>["Y"], Provider<any>>,
  Parts<E>["R"],
  Parts<E>["N"]
> = core.strip;

/**
 * @since 0.0.1
 * @category function
 */
export const provide: <
  O extends Generator<any, any, any>,
  P extends Generator<any, any, any>,
>(
  operation: () => O,
  provider: RequireAtLeastOneSatisfied<O, P>,
) => Generator<
  | Effect<unknown>
  | StripRequirementsProvidedBy<
      Extract<Parts<O>["Y"], Requirement<any>>,
      Provided<P>
    >
  | Extract<Parts<O>["Y"], Provider<any>>
  | Extract<Parts<P>["Y"], Provider<any>>
  | StripRequirementsProvidedBy<Parts<P>["Y"], ProvidedTypes<O>>,
  Parts<O>["R"],
  Parts<O>["N"]
> = core.provide;
