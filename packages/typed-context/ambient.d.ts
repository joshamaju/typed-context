export * from "./dist/index.js";

declare module "effection" {
  export function createContext<T>(
    name: string,
    defaultValue?: T | undefined,
  ): import("./dist/index.js").TypedContext<T>;

  export function spawn<O extends Generator<any, any, any>>(
    op: () => O,
  ): Generator<
    import("./dist/index.js").Parts<O>["Y"],
    import("effection").Task<import("./dist/index.js").Parts<O>["R"]>,
    import("./dist/index.js").Parts<O>["N"]
  >;

  export function resource<T, O extends Generator<any, any, any>>(
    op: (provide: import("effection").Provide<T>) => O,
  ): Generator<
    import("./dist/index.js").Parts<O>["Y"],
    T,
    import("./dist/index.js").Parts<O>["N"]
  >;

  export function run<O extends Generator<any, any, any>>(
    op: () => O,
  ): import("effection").Task<import("./dist/index.js").Parts<O>["R"]>;

  export function main<
    O extends Generator<
      | import("effection").Effect<unknown>
      | import("./dist/index.js").Provider<any>,
      any,
      any
    >,
  >(op: (args: string[]) => O): Promise<void>;

  export function all<
    O extends
      | readonly (
          | Generator<any, any, any>
          | import("effection").Operation<any>
        )[]
      | [],
  >(
    ops: O,
  ): Generator<
    O[number] extends infer T
      ? T extends Generator<any, any, any>
        ? import("./dist/index.js").Parts<T>["Y"]
        : T extends import("effection").Operation<any>
          ? import("effection").Effect<unknown>
          : never
      : never,
    {
      -readonly [K in keyof O]: O[K] extends import("effection").Operation<
        infer T
      >
        ? T
        : import("./dist/index.js").Parts<O[K]>["R"];
    },
    unknown
  >;
}
