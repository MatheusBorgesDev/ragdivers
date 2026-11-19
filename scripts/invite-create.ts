// Creates an invite and prints its code once. Run it in your own terminal: the code is a credential.
// Usage: pnpm invite:create --label friend-a --role friend
// Production: DATABASE_URL='<pooler url>' pnpm invite:create ... (a variable already set wins over .env.local)
import { parseArgs } from 'node:util'
import { getSql } from '@/server/db/client'
import { createInvite } from '@/server/db/invites'

const { values } = parseArgs({ options: { label: { type: 'string' }, role: { type: 'string' } } })
const label = values.label ?? ''
const role = values.role
if (!/^[a-z0-9-]{3,32}$/.test(label)) {
  console.error('--label must be 3 to 32 lowercase letters, digits or hyphens (an id like friend-a, never a name).')
  process.exit(2)
}
if (role !== 'maintainer' && role !== 'friend') {
  console.error('--role must be maintainer or friend.')
  process.exit(2)
}

const sql = getSql()
try {
  const { code } = await createInvite(sql, { label, role })
  console.log(`Invite for ${label} (${role}): ${code}`)
  console.log('This is the only time the code is shown. The database keeps only its hash.')
} finally {
  await sql.end()
}
