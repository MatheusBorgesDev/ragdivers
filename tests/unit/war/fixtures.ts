/** Minimal raw responses shaped like the community API's (only the fields the client reads, plus a few extras). */
export function planet(overrides: Record<string, unknown> = {}) {
  return {
    index: 1,
    name: 'Malevelon Creek',
    sector: 'Severin',
    health: 250_000,
    maxHealth: 1_000_000,
    currentOwner: 'Automaton',
    event: null,
    unknownField: 'ignored',
    ...overrides,
  }
}

export function rawWar(overrides: { assignments?: unknown[]; campaigns?: unknown[] } = {}) {
  return {
    war: { now: '2026-11-20T00:30:00Z', factions: ['Humans', 'Terminids', 'Automaton', 'Illuminate'] },
    assignments: overrides.assignments ?? [
      {
        id: 101,
        title: 'MAJOR ORDER',
        briefing: 'The Automatons are advancing.',
        description: 'Liberate Malevelon Creek.',
        progress: [0],
        tasks: [{ type: 11, values: [1, 1, 1], valueTypes: [3, 11, 12] }],
        expiration: '2026-11-22T03:30:00Z',
        flags: 1,
      },
    ],
    // Real responses (snapshot of 2026-11-19) carry the attacker, 'Humans', as the campaign faction.
    campaigns: overrides.campaigns ?? [{ id: 7, planet: planet(), type: 0, count: 3, faction: 'Humans' }],
  }
}

/** A fake fetch that serves the three endpoints from `raw` and counts calls. */
export function fakeFetch(raw: ReturnType<typeof rawWar>, respond?: (path: string) => Response | undefined) {
  const calls: { url: string; headers: Headers }[] = []
  const impl = async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input)
    calls.push({ url, headers: new Headers(init?.headers) })
    const path = new URL(url).pathname
    const custom = respond?.(path)
    if (custom) return custom
    const body = path.endsWith('/war') ? raw.war : path.endsWith('/assignments') ? raw.assignments : raw.campaigns
    return Response.json(body)
  }
  return { impl: impl as typeof fetch, calls }
}
