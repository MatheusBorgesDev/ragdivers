import { handleInvite } from '@/server/access/invite-handler'
import { getSql } from '@/server/db/client'
import { findActiveInviteByCode } from '@/server/db/invites'

export const runtime = 'nodejs'

export function POST(request: Request): Promise<Response> {
  return handleInvite(request, { findInvite: (code) => findActiveInviteByCode(getSql(), code) })
}
