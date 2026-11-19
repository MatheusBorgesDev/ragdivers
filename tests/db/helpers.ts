import postgres from 'postgres'

const LOCAL_SUPABASE_URL = 'postgresql://postgres:postgres@127.0.0.1:55322/postgres'
const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]'])

/** Connects to the local Supabase database. Refuses any other host: these tests write data. */
export function connectLocalDb({ max = 4 }: { max?: number } = {}): postgres.Sql {
  const url = process.env.TEST_DATABASE_URL ?? LOCAL_SUPABASE_URL
  const { hostname } = new URL(url)
  if (!LOCAL_HOSTS.has(hostname)) {
    throw new Error(`Database tests only run against a local database; got host "${hostname}".`)
  }
  return postgres(url, { max, onnotice: () => {} })
}

/** Runs `fn` in a transaction that is always rolled back, so tests leave no data behind. */
export async function inRolledBackTransaction(
  sql: postgres.Sql,
  fn: (tx: postgres.TransactionSql) => Promise<void>,
): Promise<void> {
  await sql.begin(async (tx) => {
    await fn(tx)
    await tx.rollback()
  })
}
