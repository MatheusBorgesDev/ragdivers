import { z } from 'zod'
import { normalizeCode } from '@/server/access/codes'
import { inviteCookie } from '@/server/access/session'
import type { Invite } from '@/server/db/invites'

const MAX_BODY_BYTES = 1024
const InviteRequest = z.object({ code: z.string().max(64) })

const invalidRequest = () => Response.json({ error: 'invalid_request' }, { status: 400 })

/** POST /api/invite: trades a typed code for the invite cookie. */
export async function handleInvite(
  request: Request,
  deps: { findInvite: (code: string) => Promise<Invite | null> },
): Promise<Response> {
  const text = await request.text()
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) return invalidRequest()
  let body: unknown
  try {
    body = JSON.parse(text)
  } catch {
    return invalidRequest()
  }
  const parsed = InviteRequest.safeParse(body)
  if (!parsed.success) return invalidRequest()

  const normalized = normalizeCode(parsed.data.code)
  const invite = normalized ? await deps.findInvite(parsed.data.code) : null
  if (!invite || !normalized) return Response.json({ error: 'invalid_code' }, { status: 401 })

  return Response.json(
    { role: invite.role, consented: invite.consentedAt !== null },
    { headers: { 'set-cookie': inviteCookie(normalized, request.url) } },
  )
}
