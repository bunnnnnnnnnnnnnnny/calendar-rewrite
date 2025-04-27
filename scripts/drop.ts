import 'dotenv/config';
import postgres from 'postgres';

async function run() {
  const connectionString = process.env['DATABASE_URL'];

  if (connectionString == null) {
    console.error('missing DATABASE_URL var');
    return;
  }

  const sql = postgres(connectionString);

  const result = await sql.begin(async (sql) => [
    await sql`drop table if exists _sqlx_migrations cascade`,
    await sql`drop table if exists events cascade`,
    await sql`drop table if exists event_meta cascade`,
    await sql`drop table if exists recurring_event_meta cascade`,
  ]);

  console.info('result:', result);

  sql.end();
}

run();
