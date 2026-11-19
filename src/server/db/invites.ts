import type postgres from 'postgres'
import { z } from 'zod'
import { generateCode, hashCode, normalizeCode } from '@/server/access/codes'

export type Db = postgres.Sql | postgres.TransactionSql

export type Invite = { id: string; label: string; role: 'maintainer' | 'friend'; consentedAt: Date | null }

const inviteRow = z.object({
  id: z.string(),
  label: z.string(),
  role: z.enum(['maintainer', 'friend']),
  consented_at: z.date().nullable(),
})

const toInvite = (row: unknown): Invite => {
  const r = inviteRow.parse(row)
  return { id: r.id, label: r.label, role: r.role, consentedAt: r.consented_at }
}

/** Creates an invite and returns its code, which exists only in this return value: the table keeps the hash. */
export async function createInvite(sql: Db, input: { label: string; role: Invite['role'] }): Promise<{ invite: Invite; code: string }> {
  const code = generateCode()
  const hash = hashCode(normalizeCode(code) ?? '')
  const [row] = await sql`
    insert into invites (code_hash, label, role) values (${hash}, ${input.label}, ${input.role})
    returning id, label, role, consented_at
  `
  return { invite: toInvite(row), code }
}

/** The invite a typed code opens, if the code is well formed, known and not revoked. */
export async function findActiveInviteByCode(sql: Db, code: string): Promise<Invite | null> {
  const normalized = normalizeCode(code)
  if (!normalized) return null
  const [row] = await sql`
    select id, label, role, consented_at from invites
    where code_hash = ${hashCode(normalized)} and revoked_at is null
  `
  return row ? toInvite(row) : null
}
