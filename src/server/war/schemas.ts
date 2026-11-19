import { z } from 'zod'

// Loose objects: the community API can add fields at any time, so only the fields the app reads are required.
// Text fields arrive as a string with `Accept-Language: en-US`, or as a localized object otherwise.
const localized = z.union([z.string(), z.looseObject({ 'en-US': z.string() })]).transform((value) =>
  typeof value === 'string' ? value : value['en-US'],
)

const event = z.looseObject({
  faction: z.string(),
  health: z.number(),
  maxHealth: z.number().positive(),
  endTime: z.iso.datetime({ offset: true }),
})

const planet = z.looseObject({
  name: localized,
  sector: z.string(),
  health: z.number(),
  maxHealth: z.number().positive(),
  currentOwner: z.string(),
  event: event.nullable().optional(),
})

const assignment = z.looseObject({
  id: z.number(),
  title: localized.nullable().optional(),
  briefing: localized.nullable().optional(),
  description: localized.nullable().optional(),
  progress: z.array(z.number()),
  tasks: z.array(z.looseObject({ type: z.number(), values: z.array(z.number()), valueTypes: z.array(z.number()) })),
  expiration: z.iso.datetime({ offset: true }),
})

const campaign = z.looseObject({ planet, faction: z.string() })

export const RawWarSchema = z.object({
  war: z.looseObject({ factions: z.array(z.string()) }),
  assignments: z.array(assignment),
  campaigns: z.array(campaign),
})

export type RawWar = z.infer<typeof RawWarSchema>

/** Validates the three responses together. Throws a ZodError when the shape changed. */
export function parseRawWar(input: unknown): RawWar {
  return RawWarSchema.parse(input)
}
