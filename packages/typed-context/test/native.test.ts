import { run, sleep, spawn, type Operation } from "effection";
import { describe, expect, it } from "vitest";
import { createContext } from "../src/index.js";

const numbers = createContext("number", 3);

describe("context", () => {
  it("has the initial value available at all times", async () => {
    // @ts-expect-error
    const result = await run(function* () {
      return yield* numbers.get();
    });

    expect(result).toEqual(3);
  });

  it("can be set within a given scope, but reverts after", async () => {
    // @ts-expect-error
    let values = await run(function* () {
      let before = yield* numbers.get();

      // @ts-expect-error
      let within = yield* numbers.with(22, function* () {
        return yield* numbers.get();
      });

      let after = yield* numbers.get();
      return [before, within, after];
    });

    expect(values).toEqual([3, 22, 3]);
  });

  it("is safe to get() when context is not defined", async () => {
    let result = await run(function* () {
      return yield* createContext("missing").get() as Operation<any>;
    });

    expect(result).toBeUndefined();
  });

  it("is an error to expect() when context is missing", async () => {
    // @ts-expect-error
    const result = run(function* () {
      yield* createContext("missing").expect();
    });

    await expect(result).rejects.toHaveProperty("name", "MissingContextError");
  });

  it("inherits values from parent tasks", async () => {
    let context = createContext<string>("just-a-string");

    // @ts-expect-error
    await run(function* () {
      yield* context.set("hello");

      // @ts-expect-error
      let task = yield* spawn(function* () {
        return yield* context.get();
      });

      expect(yield* task).toEqual("hello");
    });
  });

  it("does see values that are set by child tasks", async () => {
    let context = createContext<string>("just-a-string");

    // @ts-expect-error
    await run(function* () {
      yield* context.set("hello");

      // @ts-expect-error
      yield* spawn(function* () {
        yield* context.set("goodbye");
      });

      yield* sleep(1);

      expect(yield* context.get()).toEqual("hello");
    });
  });
});
