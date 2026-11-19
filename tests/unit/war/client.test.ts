import { createWarClient } from '@/server/war/client'
import { fakeFetch, rawWar } from './fixtures'

const CONTACT = 'https://github.com/owner/ragdivers'
const T0 = Date.parse('2026-11-20T00:30:00Z')

function clock() {
  let t = T0
  return { now: () => new Date(t), advance: (ms: number) => (t += ms) }
}

it('sends the identification headers on every request', async () => {
  const fetch = fakeFetch(rawWar())
  await createWarClient({ contact: CONTACT, fetchImpl: fetch.impl }).getWarStatus()
  expect(fetch.calls).toHaveLength(3)
  for (const call of fetch.calls) {
    expect(call.headers.get('X-Super-Client')).toBe('ragdivers')
    expect(call.headers.get('X-Super-Contact')).toBe(CONTACT)
    expect(call.headers.get('Accept-Language')).toBe('en-US')
  }
})

it('fetches once within the ttl and shares one in-flight fetch', async () => {
  const fetch = fakeFetch(rawWar())
  const c = clock()
  const client = createWarClient({ contact: CONTACT, fetchImpl: fetch.impl, now: c.now })
  await Promise.all([client.getWarStatus(), client.getWarStatus()])
  c.advance(30_000)
  await client.getWarStatus()
  expect(fetch.calls).toHaveLength(3)
})

it('refetches after the ttl', async () => {
  const fetch = fakeFetch(rawWar())
  const c = clock()
  const client = createWarClient({ contact: CONTACT, fetchImpl: fetch.impl, now: c.now })
  await client.getWarStatus()
  c.advance(61_000)
  await client.getWarStatus()
  expect(fetch.calls).toHaveLength(6)
})

it('serves the last good status as stale on 429', async () => {
  let limited = false
  const fetch = fakeFetch(rawWar(), () => (limited ? new Response('slow down', { status: 429 }) : undefined))
  const c = clock()
  const client = createWarClient({ contact: CONTACT, fetchImpl: fetch.impl, now: c.now })
  await client.getWarStatus()
  limited = true
  c.advance(120_000)
  const result = await client.getWarStatus()
  expect(result.ok && result.status.stale).toBe(true)
  expect(result.ok && result.status.ageSeconds).toBe(120)
})

it('returns rate_limited when there is nothing to serve', async () => {
  const fetch = fakeFetch(rawWar(), () => new Response('slow down', { status: 429 }))
  expect(await createWarClient({ contact: CONTACT, fetchImpl: fetch.impl }).getWarStatus()).toEqual({
    ok: false,
    error: 'rate_limited',
  })
})

it('stops serving stale data after staleMs', async () => {
  let down = false
  const fetch = fakeFetch(rawWar(), () => (down ? new Response('down', { status: 503 }) : undefined))
  const c = clock()
  const client = createWarClient({ contact: CONTACT, fetchImpl: fetch.impl, now: c.now })
  await client.getWarStatus()
  down = true
  c.advance(11 * 60_000)
  expect(await client.getWarStatus()).toEqual({ ok: false, error: 'unavailable' })
})

it('returns invalid_response when a campaign has no faction', async () => {
  const raw = rawWar({ campaigns: [{ id: 7, planet: {}, type: 0, count: 1 }] })
  const result = await createWarClient({ contact: CONTACT, fetchImpl: fakeFetch(raw).impl }).getWarStatus()
  expect(result).toEqual({ ok: false, error: 'invalid_response' })
})

it('returns unavailable on a network error', async () => {
  const impl = (async () => {
    throw new TypeError('fetch failed')
  }) as typeof fetch
  expect(await createWarClient({ contact: CONTACT, fetchImpl: impl }).getWarStatus()).toEqual({
    ok: false,
    error: 'unavailable',
  })
})

it('returns unavailable on timeout', async () => {
  const impl = ((_input: unknown, init?: RequestInit) =>
    new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(init.signal?.reason))
    })) as typeof fetch
  expect(await createWarClient({ contact: CONTACT, fetchImpl: impl, timeoutMs: 20 }).getWarStatus()).toEqual({
    ok: false,
    error: 'unavailable',
  })
})
