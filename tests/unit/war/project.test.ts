import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseRawWar } from '@/server/war/schemas'
import { projectWarStatus } from '@/server/war/project'
import { planet, rawWar } from './fixtures'

const FETCHED = new Date('2026-11-20T00:30:00Z')

it('computes liberation percent from planet health', () => {
  const status = projectWarStatus(parseRawWar(rawWar()), FETCHED, FETCHED)
  expect(status.fronts[0]?.liberationPercent).toBe(75)
})

it('names the enemy faction of each front, not the attacking Humans', () => {
  expect(projectWarStatus(parseRawWar(rawWar()), FETCHED, FETCHED).fronts[0]?.faction).toBe('Automaton')
})

it('reports a defense instead of liberation on a planet humans hold', () => {
  const defended = planet({
    currentOwner: 'Humans',
    event: { id: 1, eventType: 1, faction: 'Terminids', health: 300_000, maxHealth: 1_200_000, endTime: '2026-11-20T03:30:00Z' },
  })
  const status = projectWarStatus(
    parseRawWar(rawWar({ campaigns: [{ id: 8, planet: defended, type: 0, count: 1, faction: 'Humans' }] })),
    FETCHED,
    FETCHED,
  )
  expect(status.fronts[0]?.liberationPercent).toBeNull()
  expect(status.fronts[0]?.faction).toBe('Terminids')
  expect(status.fronts[0]?.defense).toEqual({
    faction: 'Terminids',
    endsAtLocal: '20/11/2026 00:30 (horário de Brasília)',
    endsIn: '3h 0min',
    healthPercent: 25,
  })
})

it('projects the major order with local expiry and time left', () => {
  const order = projectWarStatus(parseRawWar(rawWar()), FETCHED, FETCHED).majorOrders[0]
  expect(order?.title).toBe('MAJOR ORDER')
  expect(order?.expiresAtLocal).toBe('22/11/2026 00:30 (horário de Brasília)')
  expect(order?.expiresIn).toBe('2d 3h')
})

it('returns no major orders when assignments is empty', () => {
  expect(projectWarStatus(parseRawWar(rawWar({ assignments: [] })), FETCHED, FETCHED).majorOrders).toEqual([])
})

it('reads localized text in en-US', () => {
  const raw = rawWar()
  const assignment = { ...(raw.assignments[0] as object), title: { 'en-US': 'MAJOR ORDER', 'de-DE': 'GROSSER BEFEHL' } }
  const status = projectWarStatus(parseRawWar({ ...raw, assignments: [assignment] }), FETCHED, FETCHED)
  expect(status.majorOrders[0]?.title).toBe('MAJOR ORDER')
})

it('projects the recorded snapshot', () => {
  const dir = join(process.cwd(), 'evals/snapshots/war')
  const latest = readdirSync(dir)
    .filter((name) => /^\d{8}T\d{4}Z\.json$/.test(name))
    .sort()
    .at(-1)
  expect(latest, 'run pnpm war:snapshot first').toBeDefined()
  const snapshot = JSON.parse(readFileSync(join(dir, latest!), 'utf8')) as {
    fetchedAt: string
    war: { factions: string[] }
    assignments: unknown[]
  }
  const fetchedAt = new Date(snapshot.fetchedAt)
  const status = projectWarStatus(parseRawWar(snapshot), fetchedAt, fetchedAt)
  expect(status.sourceId).toBe(`war:${snapshot.fetchedAt}`)
  expect(status.majorOrders).toHaveLength(snapshot.assignments.length)
  for (const front of status.fronts) {
    expect(snapshot.war.factions).toContain(front.faction)
    expect(front.faction).not.toBe('Humans')
  }
})
