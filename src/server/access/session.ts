import { type Db, type Invite, findActiveInviteByCode } from '@/server/db/invites'

export const INVITE_COOKIE = 'ragdivers_invite'
const MAX_AGE_SECONDS = 180 * 24 * 60 * 60

/** The invite whose code the cookie carries, or null. */
export async function inviteFromCookieValue(value: string | undefined, sql: Db): Promise<Invite | null> {
  return value ? findActiveInviteByCode(sql, value) : null
}

/** The invite of the person making this request (route handlers). */
export async function currentInvite(request: Request, sql: Db): Promise<Invite | null> {
  const cookies = request.headers.get('cookie') ?? ''
  const match = cookies.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${INVITE_COOKIE}=`))
  return inviteFromCookieValue(match ? decodeURIComponent(match.slice(INVITE_COOKIE.length + 1)) : undefined, sql)
}

/** Set-Cookie for an accepted code. Secure everywhere except plain-http localhost, where browsers would drop it. */
export function inviteCookie(normalizedCode: string, requestUrl: string): string {
  const { protocol, hostname } = new URL(requestUrl)
  const local = protocol === 'http:' && ['localhost', '127.0.0.1'].includes(hostname)
  return [
    `${INVITE_COOKIE}=${normalizedCode}`,
    'Path=/',
    `Max-Age=${MAX_AGE_SECONDS}`,
    'HttpOnly',
    'SameSite=Lax',
    ...(local ? [] : ['Secure']),
  ].join('; ')
}
