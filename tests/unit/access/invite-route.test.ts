import { handleInvite } from '@/server/access/invite-handler'
import type { Invite } from '@/server/db/invites'

const INVITE: Invite = { id: 'i1', label: 'friend-a', role: 'friend', consentedAt: null }
const VALID = 'K7M2Q-9XH4T'
const findInvite = async (code: string) => (code === VALID ? INVITE : null)

const post = (body: string, url = 'https://ragdivers.example/api/invite') =>
  new Request(url, { method: 'POST', body, headers: { 'content-type': 'application/json' } })

it('sets an httpOnly cookie for a valid code', async () => {
  const response = await handleInvite(post(JSON.stringify({ code: VALID })), { findInvite })
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({ role: 'friend', consented: false })
  const cookie = response.headers.get('set-cookie') ?? ''
  expect(cookie).toMatch(/^ragdivers_invite=K7M2Q9XH4T;/)
  expect(cookie).toContain('HttpOnly')
  expect(cookie).toContain('SameSite=Lax')
  expect(cookie).toContain('Secure')
})

it('answers 401 without a cookie for an invalid code', async () => {
  const response = await handleInvite(post(JSON.stringify({ code: 'ZZZZZ-ZZZZZ' })), { findInvite })
  expect(response.status).toBe(401)
  expect(await response.json()).toEqual({ error: 'invalid_code' })
  expect(response.headers.get('set-cookie')).toBeNull()
})

it.each([
  ['not JSON', 'code=K7M2Q-9XH4T'],
  ['over 1 KB', JSON.stringify({ code: VALID, padding: 'x'.repeat(1100) })],
  ['without a code', JSON.stringify({})],
])('answers 400 for a body %s', async (_name, body) => {
  const response = await handleInvite(post(body), { findInvite })
  expect(response.status).toBe(400)
  expect(await response.json()).toEqual({ error: 'invalid_request' })
})

it('drops Secure on plain-http localhost so the cookie works in development', async () => {
  const response = await handleInvite(post(JSON.stringify({ code: VALID }), 'http://localhost:3000/api/invite'), {
    findInvite,
  })
  expect(response.headers.get('set-cookie')).not.toContain('Secure')
})
