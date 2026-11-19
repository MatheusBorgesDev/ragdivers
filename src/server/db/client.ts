import postgres from 'postgres'
import { requireConfig } from '@/server/config'

let sql: postgres.Sql | undefined

/**
 * The server's database connection, shared by every request in this instance. `prepare: false` because production
 * connects through Supabase's pooler in transaction mode, which does not support prepared statements.
 */
export function getSql(): postgres.Sql {
  sql ??= postgres(requireConfig('databaseUrl'), { prepare: false, max: 3, onnotice: () => {} })
  return sql
}
