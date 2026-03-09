# effection-typed-context

Type-aware context helpers for [Effection](https://frontside.com/effection).

`effection-typed-context` wraps Effection's context utilities so yielded operations keep track of which context values are required and which providers satisfy them.

## Install

```bash
pnpm add effection-typed-context effection
```

## Usage

`effection-typed-context` supports two integration styles:

1. Import from `effection-typed-context` as a drop-in replacement for the relevant
   Effection APIs.
2. Keep importing from `effection` and add the `effection-typed-context` ambient type
   augmentation.

### Drop-in replacement

Import the typed APIs directly from `effection-typed-context`:

```ts
import { type Effect } from "effection";
import {
  createContext,
  provide,
  run,
  strip,
  type Provider,
  type Requirement,
} from "effection-typed-context";

const APIBaseUrl = createContext<string>("apiBaseUrl");

function* program() {
  return yield* APIBaseUrl.expect();
}

// Before requirements are provided:
// Generator<Effect<unknown> | Requirement<string>, string, unknown>

const providedProgram = provide(program, function* () {
  yield* APIBaseUrl.set("https://example.com");
});

// After requirements are provided:
// Generator<Effect<unknown> | Provider<string>, string, unknown>

const rootProgram = strip(() => providedProgram);

// At the root, strip removes all Provider types once context has been provided:
// Generator<Effect<unknown>, string, unknown>

const value = await run(() => rootProgram);
```

### Effection augmentation

If you want to keep existing imports from `effection`, add the ambient types in
your project:

```ts
/// <reference types="effection-typed-context/types" />
```

This is typically added in a project-level `.d.ts` file such as `env.d.ts`.
After that, the typed signatures are available from `effection` directly:

```ts
import { createContext, run } from "effection";
import { provide } from "effection-typed-context";

const apiBaseUrl = createContext<string>("apiBaseUrl");

function* program() {
  return yield* apiBaseUrl.expect();
}

const value = await run(() =>
  provide(program, function* () {
    yield* apiBaseUrl.set("https://example.com");
  }),
);
```

When you use the module augmentation, `run()` and `main()` accept the typed
operations directly, so you typically do not need `strip()` at the root.

## API

- `createContext(name, defaultValue?)`
- `provide(operation, provider)`
- `spawn(operation)`
- `resource(operation)`
  With Effection alone, this is often written as
  `resource<Type>(function* (provide) {})`.
  With `typed-context`, prefer putting the type on `provide` instead:
  `resource(function* (provide: Provide<Type>) {})`.
- `run(operation)`
- `main(operation)`
- `all(operations)`
- `strip(operation)`
  Removes all `Provider` types from an operation. Use it at the root after all
  required context has been provided. This is mainly useful when importing the
  drop-in API from `effection-typed-context`; with the `effection` module augmentation,
  `run()` and `main()` can consume the typed operation directly.
