import {
  createContext as createContext_,
  spawn as spawn_,
  resource as resource_,
  run as run_,
  main as main_,
  all as all_,
  type Effect,
  type Task,
  type Provide,
  type Operation,
} from "effection";
import type {
  Provider,
  Parts,
  Provided,
  ProvidedTypes,
  Requirement,
  RequireAtLeastOneSatisfied,
  StripRequirementsProvidedBy,
  TypedContext,
} from "../index.js";

export const RequirementTypeId: unique symbol = Symbol.for("Requirement");

export const ProviderTypeId: unique symbol = Symbol.for("Provider");

export function createContext<T>(
  name: string,
  defaultValue?: T,
): TypedContext<T> {
  // @ts-expect-error
  return createContext_(name, defaultValue);
}

export function* spawn<O extends Generator<any, any, any>>(
  op: () => O,
): Generator<Parts<O>["Y"], Task<Parts<O>["R"]>, Parts<O>["N"]> {
  return yield* spawn_(op);
}

export function* resource<T, O extends Generator<any, any, any>>(
  op: (provide: Provide<T>) => O,
): Generator<Parts<O>["Y"], T, Parts<O>["N"]> {
  return yield* resource_(op);
}

export function run<O extends Generator<any, any, any>>(
  op: () => O,
): Task<Parts<O>["R"]> {
  return run_(op);
}

export function main<
  O extends Generator<Effect<unknown> | Provider<any>, any, any>,
>(op: (args: string[]) => O): Promise<void> {
  // @ts-expect-error
  return main_(op);
}

type AllYielded<
  O extends readonly (Generator<any, any, any> | Operation<any>)[] | [],
> = O[number] extends infer T
  ? T extends Generator<any, any, any>
    ? Parts<T>["Y"]
    : T extends Operation<any>
      ? Effect<unknown>
      : never
  : never;

type AllReturned<
  O extends readonly (Generator<any, any, any> | Operation<any>)[] | [],
> = {
  -readonly [K in keyof O]: O[K] extends Operation<infer T>
    ? T
    : Parts<O[K]>["R"];
};

export function* all<
  O extends readonly (Generator<any, any, any> | Operation<any>)[] | [],
>(ops: O): Generator<AllYielded<O>, AllReturned<O>, unknown> {
  return yield* all_(ops) as unknown as Generator<
    AllYielded<O>,
    AllReturned<O>,
    unknown
  >;
}

export function* provide<
  O extends Generator<any, any, any>,
  P extends Generator<any, any, any>,
>(
  operation: () => O,
  provider: RequireAtLeastOneSatisfied<O, P>,
): Generator<
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
> {
  yield* provider();
  return yield* operation();
}

export function strip<E extends Generator<any, any, any>>(
  operation: () => E,
): Generator<
  Effect<unknown> | Exclude<Parts<E>["Y"], Provider<any>>,
  Parts<E>["R"],
  Parts<E>["N"]
> {
  return operation();
}
