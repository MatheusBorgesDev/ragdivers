import type { RawWar } from './schemas'
import { formatDuration, formatLocal } from './time'

export type MajorOrder = {
  id: number
  title: string
  briefing: string
  description: string
  expiresAt: string
  expiresAtLocal: string
  expiresIn: string
  progress: number[]
  tasks: { type: number; values: number[]; valueTypes: number[] }[]
}

export type Front = {
  planet: string
  sector: string
  faction: string
  liberationPercent: number | null
  defense: { faction: string; endsAtLocal: string; endsIn: string; healthPercent: number } | null
}

export type WarStatus = {
  sourceId: string
  fetchedAt: string
  fetchedAtLocal: string
  stale: boolean
  ageSeconds: number
  majorOrders: MajorOrder[]
  fronts: Front[]
}

const HUMANS = 'Humans'
const round1 = (value: number) => Math.round(value * 10) / 10

/**
 * The war as the model reads it: every number it may quote is computed here, so the model only copies values.
 * Liberation of an enemy-held planet is the share of its health already taken (formula to confirm in game).
 */
export function projectWarStatus(raw: RawWar, fetchedAt: Date, now: Date): WarStatus {
  const fetchedIso = fetchedAt.toISOString().replace('.000Z', 'Z')
  return {
    sourceId: `war:${fetchedIso}`,
    fetchedAt: fetchedIso,
    fetchedAtLocal: formatLocal(fetchedAt),
    stale: false,
    ageSeconds: Math.round((now.getTime() - fetchedAt.getTime()) / 1000),
    majorOrders: raw.assignments.map((a) => {
      const expires = new Date(a.expiration)
      return {
        id: a.id,
        title: a.title ?? '',
        briefing: a.briefing ?? '',
        description: a.description ?? '',
        expiresAt: a.expiration,
        expiresAtLocal: formatLocal(expires),
        expiresIn: formatDuration(expires.getTime() - now.getTime()),
        progress: a.progress,
        tasks: a.tasks.map((t) => ({ type: t.type, values: t.values, valueTypes: t.valueTypes })),
      }
    }),
    // The campaign's own `faction` is the attacker (always Humans in real responses): the enemy is whoever holds the
    // planet, or, on a planet humans hold, whoever runs the attack event.
    fronts: raw.campaigns.map(({ planet }) => {
      const event = planet.event
      const enemy = planet.currentOwner === HUMANS && event ? event.faction : planet.currentOwner
      return {
        planet: planet.name,
        sector: planet.sector,
        faction: enemy,
        liberationPercent: planet.currentOwner === HUMANS ? null : round1(100 * (1 - planet.health / planet.maxHealth)),
        defense: event
          ? {
              faction: event.faction,
              endsAtLocal: formatLocal(new Date(event.endTime)),
              endsIn: formatDuration(new Date(event.endTime).getTime() - now.getTime()),
              healthPercent: round1((100 * event.health) / event.maxHealth),
            }
          : null,
      }
    }),
  }
}
