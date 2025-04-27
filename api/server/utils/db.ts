import postgres from 'postgres';

let instance: postgres.Sql<{}>;

export function useDatabase(): postgres.Sql<{}> {
  if (instance == null) {
    const config = useRuntimeConfig();

    instance = postgres({
      database: config.db.name,
      host: config.db.host,
      port: config.db.port,
      username: config.db.user,
      password: config.db.pass,
    });
  }

  return instance;
}
