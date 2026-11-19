import { ZodError } from 'zod'
import { type WarStatus, projectWarStatus } from './project'
import { type RawWar, parseRawWar } from './schemas'

export type WarError = 'unavailable' | 'rate_limited' | 'invalid_response'
export type WarResult = { ok: true; status: WarStatus } | { ok: false; error: WarError }
export type WarClient = { getWarStatus(): Promise<WarResult> }

export type WarFetchOptions = { contact: string; baseUrl?: string; fetchImpl?: typeof fetch; timeoutMs?: number }

export const COMMUNITY_API_URL = 'https://api.helldivers2.dev'
const ENDPOINTS = { war: '/api/v1/war', assignments: '/api/v1/assignments', campaigns: '/api/v1/campaigns' } as const

type Responses = { war: unknown; assignments: unknown; campaigns: unknown }

/** The three raw responses, as the API sent them. Three requests stay under the API's 5 per 10 s. */
export async function fetchWarResponses(
  opts: WarFetchOptions,
): Promise<{ ok: true; responses: Responses } | { ok: false; error: WarError }> {
  const { contact, baseUrl = COMMUNITY_API_URL, fetchImpl = fetch, timeoutMs = 8_000 } = opts
  const headers = {
    'X-Super-Client': 'ragdivers',
    'X-Super-Contact': contact,
    'Accept-Language': 'en-US',
    'User-Agent': `RAGDivers (+${contact})`,
  }
  const signal = AbortSignal.timeout(timeoutMs)
  const entries = Object.entries(ENDPOINTS) as [keyof Responses, string][]
  const results = await Promise.all(
    entries.map(async ([key, path]) => {
      try {
        const response = await fetchImpl(`${baseUrl}${path}`, { headers, signal })
        if (response.status === 429) return { key, error: 'rate_limited' as const }
        if (!response.ok) return { key, error: 'unavailable' as const }
        return { key, body: (await response.json()) as unknown }
      } catch {
        return { key, error: 'unavailable' as const }
      }
    }),
  )
  const responses: Partial<Responses> = {}
  for (const result of results) {
    if ('error' in result && result.error) return { ok: false, error: result.error }
    if ('body' in result) responses[result.key] = result.body
  }
  return { ok: true, responses: responses as Responses }
}

/**
 * The live war, cached per server instance: one fetch per `ttlMs` shared by concurrent callers, and the last good
 * status (marked stale, with its age) for up to `staleMs` when the API fails.
 */
export function createWarClient(
  opts: WarFetchOptions & { now?: () => Date; ttlMs?: number; staleMs?: number },
): WarClient {
  const { now = () => new Date(), ttlMs = 60_000, staleMs = 600_000 } = opts
  let last: { raw: RawWar; fetchedAt: Date } | undefined
  let inflight: Promise<{ ok: true; raw: RawWar; fetchedAt: Date } | { ok: false; error: WarError }> | undefined

  async function refresh() {
    const fetchedAt = now()
    const result = await fetchWarResponses(opts)
    if (!result.ok) return result
    try {
      return { ok: true as const, raw: parseRawWar(result.responses), fetchedAt }
    } catch (error) {
      if (error instanceof ZodError) return { ok: false as const, error: 'invalid_response' as const }
      throw error
    }
  }

  return {
    async getWarStatus() {
      if (last && now().getTime() - last.fetchedAt.getTime() < ttlMs) {
        return { ok: true, status: projectWarStatus(last.raw, last.fetchedAt, now()) }
      }
      inflight ??= refresh().finally(() => {
        inflight = undefined
      })
      const outcome = await inflight
      if (outcome.ok) {
        last = { raw: outcome.raw, fetchedAt: outcome.fetchedAt }
        return { ok: true, status: projectWarStatus(outcome.raw, outcome.fetchedAt, now()) }
      }
      if (last && now().getTime() - last.fetchedAt.getTime() <= staleMs) {
        return { ok: true, status: { ...projectWarStatus(last.raw, last.fetchedAt, now()), stale: true } }
      }
      return { ok: false, error: outcome.error }
    },
  }
}
