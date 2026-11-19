import { createInvite, findActiveInviteByCode } from '@/server/db/invites'
import { connectLocalDb, inRolledBackTransaction } from './helpers'

const sql = connectLocalDb()
afterAll(() => sql.end())

it('stores only the hash of the code', async () => {
  await inRolledBackTransaction(sql, async (tx) => {
    const { invite, code } = await createInvite(tx, { label: 'friend-a', role: 'friend' })
    const [row] = await tx`select * from invites where id = ${invite.id}`
    const compact = code.replace('-', '')
    for (const value of Object.values(row ?? {})) {
      expect(String(value)).not.toContain(compact)
      expect(String(value)).not.toContain(code)
    }
    expect(invite).toMatchObject({ label: 'friend-a', role: 'friend', consentedAt: null })
  })
})

it('finds the invite with lowercase and a missing hyphen', async () => {
  await inRolledBackTransaction(sql, async (tx) => {
    const { invite, code } = await createInvite(tx, { label: 'friend-b', role: 'friend' })
    expect(await findActiveInviteByCode(tx, code.toLowerCase().replace('-', ''))).toEqual(invite)
  })
})

it('ignores a revoked invite', async () => {
  await inRolledBackTransaction(sql, async (tx) => {
    const { invite, code } = await createInvite(tx, { label: 'friend-c', role: 'friend' })
    await tx`update invites set revoked_at = now() where id = ${invite.id}`
    expect(await findActiveInviteByCode(tx, code)).toBeNull()
  })
})

it('returns null for something that is not a code', async () => {
  expect(await findActiveInviteByCode(sql, 'not a code')).toBeNull()
})
