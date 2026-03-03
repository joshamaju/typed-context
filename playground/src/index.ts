import {
  all,
  createContext,
  main,
  resource,
  sleep,
  type Operation,
  type Provide,
} from "effection";
import { provide, strip } from "typed-context";

const Config = createContext<{
  readonly getConfig: () => Operation<{
    readonly logLevel: string;
    readonly connection: string;
  }>;
}>("Config");

const Runtime = createContext<number>("Runtime");

const program = function* () {
  const database = yield* Database.expect();
  const result = yield* database.query("SELECT * FROM users");
  return "result";
};

function* makeLogger() {
  const config = yield* Config.expect();
  yield* sleep(3000);
  console.log("logger resume");
  return {
    log: function* (message: string) {
      yield* Runtime.expect();
      const { logLevel } = yield* config.getConfig();
      console.log(`[${logLevel}] ${message}`);
    },
  };
}

type Operated<T> = T extends Generator<infer Y, infer R, infer N> ? R : never;

const Logger =
  createContext<Operated<ReturnType<typeof makeLogger>>>("MyLoggerService");

function* makeDatabase() {
  console.log("database here");
  const config = yield* Config.expect();
  const logger = yield* Logger.expect();
  return {
    query: function* (sql: string) {
      yield* logger.log(`Executing query: ${sql}`);
      const { connection } = yield* config.getConfig();
      return { result: `Results from ${connection}` };
    },
  };
}

const Database =
  createContext<Operated<ReturnType<typeof makeDatabase>>>("Database");

function makeConfig() {
  return {
    getConfig: function* () {
      return {
        logLevel: "INFO",
        connection: "mysql://username:password@hostname:port/database_name",
      };
    },
  };
}

const ConfigLive = function () {
  return Config.set(makeConfig());
};

const LoggerLive = function* () {
  return yield* Logger.set(yield* makeLogger());
};

// const LoggerLive = function* () {
//   return yield* Logger.set(
//     yield* provide(makeLogger, function* () {
//       yield* Runtime.set(100);
//       yield* ConfigLive();
//     }),
//   );
// };

const DatabaseLive = function* () {
  return yield* Database.set(yield* makeDatabase());
};

const AppConfigLive = function () {
  return provide(LoggerLive, ConfigLive);
};

// const AppConfigLive = function () {
//   return LoggerLive();
// };

const MainLive = function () {
  return provide(DatabaseLive, AppConfigLive);
};

// const MainLive = function () {
//   return pipe(
//     DatabaseLive,
//     chain(provide(AppConfigLive)),
//     chain(provide(ConfigLive)),
//   )();
// };

await main(function* () {
  const start = performance.now();

  const app = provide(program, function* () {
    yield* sleep(1000);
    yield* Runtime.set(100);
    yield* MainLive();
  });

  //   function slep() {
  //     return resource(function* (provide: Provide<"sleep">) {
  //       yield* sleep(100);
  //       //   yield* program();
  //       yield* provide("sleep" as const);
  //     });
  //   }

  //   const n = yield* all([app, slep()]);

  // const t = yield* run(program)

  //   yield* strip(() => app);

  yield* app;

  const end = performance.now();
  console.log(`finished at ${Number(end - start) / 1e6}`);
});
