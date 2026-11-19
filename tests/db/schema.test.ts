import type postgres from 'postgres'
import { connectLocalDb, inRolledBackTransaction } from './helpers'

const sql = connectLocalDb()
afterAll(() => sql.end())

/** Runs one insert inside a savepoint (so the transaction survives the error) and returns the Postgres error code. */
async function insertError(
  tx: postgres.TransactionSql,
  row: { code_hash: string; label: string; role: string },
): Promise<string | undefined> {
  try {
    await tx.savepoint((sp) => sp`insert into invites ${sp(row, 'code_hash', 'label', 'role')}`)
  } catch (error) {
    return (error as { code?: string }).code
  }
  return undefined
}

it('keeps invite code hashes unique', async () => {
  await inRolledBackTransaction(sql, async (tx) => {
    expect(await insertError(tx, { code_hash: 'h1', label: 'friend-a', role: 'friend' })).toBeUndefined()
    expect(await insertError(tx, { code_hash: 'h1', label: 'friend-b', role: 'friend' })).toBe('23505')
  })
})

it('rejects an unknown role and a label with spaces', async () => {
  await inRolledBackTransaction(sql, async (tx) => {
    expect(await insertError(tx, { code_hash: 'h2', label: 'friend-a', role: 'admin' })).toBe('23514')
    expect(await insertError(tx, { code_hash: 'h3', label: 'Ana Maria', role: 'friend' })).toBe('23514')
  })
})
