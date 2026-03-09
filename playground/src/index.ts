import { createContext, main, sleep, type Operation } from "effection";
import { provide } from "typed-context";

type IConfig = {
  getConfig: () => Operation<{ connection: string; logLevel: string }>;
};

const Config = createContext<IConfig>("Config");

const program = function* () {
  const database = yield* Database.expect();
  const { result } = yield* database.query("SELECT * FROM users");
  return result;
};

function* makeLogger() {
  const config = yield* Config.expect();
  yield* sleep(3000);
  return {
    log: function* (message: string) {
      const { logLevel } = yield* config.getConfig();
      console.log(`[${logLevel}] ${message}`);
    },
  };
}

type Operated<T> = T extends Generator<infer Y, infer R, infer N> ? R : never;

const Logger =
  createContext<Operated<ReturnType<typeof makeLogger>>>("MyLoggerService");

function* makeDatabase() {
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

const DatabaseLive = function* () {
  return yield* Database.set(yield* makeDatabase());
};

const AppConfigLive = function () {
  return provide(LoggerLive, ConfigLive);
};

const MainLive = function () {
  return provide(DatabaseLive, AppConfigLive);
};

await main(function* () {
  const app = provide(program, function* () {
    yield* MainLive();
  });

  yield* app;
});
