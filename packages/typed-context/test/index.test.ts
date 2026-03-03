import { type Effect } from "effection";
import { describe, expectTypeOf, it } from "vitest";
import {
  createContext,
  provide,
  spawn,
  type Provider,
  type Requirement,
} from "../src/index.js";

describe("typed context", () => {
  it("should include context types", () => {
    const numbers = createContext("numbers", 3);

    const result = function* () {
      return yield* numbers.get();
    };

    expectTypeOf(result()).toEqualTypeOf<
      Generator<
        Effect<unknown> | Requirement<number>,
        number | undefined,
        unknown
      >
    >();
  });

  it("should accumulate context types", () => {
    const numbers = createContext("numbers", 3);
    const strings = createContext("numbers", "3");

    const result = function* () {
      yield* (function* () {
        return yield* strings.get();
      })();

      return yield* numbers.get();
    };

    expectTypeOf(result()).toEqualTypeOf<
      Generator<
        Effect<unknown> | Requirement<number> | Requirement<string>,
        number | undefined,
        unknown
      >
    >();
  });

  it("should accumulate nested context types", () => {
    const numbers = createContext("numbers", 3);
    const strings = createContext("string", "3");
    const array = createContext<string[]>("array");
    const nested = createContext<number[]>("nested");

    function* task() {
      return yield* nested.get();
    }

    const result = function* () {
      yield* (function* () {
        return yield* strings.get();
      })();

      yield* task();

      yield* spawn(function* () {
        return yield* array.get();
      });

      return yield* numbers.get();
    };

    expectTypeOf(result()).toEqualTypeOf<
      Generator<
        | Effect<unknown>
        | Requirement<number>
        | Requirement<string>
        | Requirement<number[]>
        | Requirement<string[]>,
        number | undefined,
        unknown
      >
    >();
  });

  it("should strip types as they are provided", () => {
    const numbers = createContext("numbers", 3);
    const strings = createContext("numbers", "3");

    const task = function* () {
      yield* (function* () {
        return yield* strings.get();
      })();

      return yield* numbers.get();
    };

    const program = provide(task, function* () {
      yield* strings.set("4");
    });

    expectTypeOf(program).toEqualTypeOf<
      Generator<
        Effect<unknown> | Requirement<number> | Provider<string>,
        number | undefined,
        unknown
      >
    >();

    const program2 = provide(
      () => program,
      function* () {
        yield* numbers.set(4);
      },
    );

    expectTypeOf(program2).toEqualTypeOf<
      Generator<
        Effect<unknown> | Provider<number> | Provider<string>,
        number | undefined,
        unknown
      >
    >();
  });
});
