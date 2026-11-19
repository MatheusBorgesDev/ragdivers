import { z } from 'zod'

// An empty line in .env.local (`ANTHROPIC_API_KEY=`) means "not set", not "set to nothing".
const optional = <T extends z.ZodType>(type: T) => z.preprocess((value) => (value === '' ? undefined : value), type.optional())

const schema = z.object({
  DATABASE_URL: z.url(),
  // Sent to the community API as X-Super-Contact. It identifies the project by its repository, never a person.
  COMMUNITY_API_CONTACT: z
    .url({ protocol: /^https$/ })
    .refine((value) => !value.includes('@'), 'COMMUNITY_API_CONTACT must be the repository URL, not an e-mail'),
  ANTHROPIC_API_KEY: optional(z.string().min(1)),
  CRON_SECRET: optional(z.string().min(16)),
})

export type ServerConfig = {
  databaseUrl: string
  communityApiContact: string
  anthropicApiKey?: string
  cronSecret?: string
}

/** Reads and validates the server's environment. Throws a message naming every invalid variable. */
export function loadServerConfig(env: Record<string, string | undefined> = process.env): ServerConfig {
  const parsed = schema.safeParse(env)
  if (!parsed.success) {
    const problems = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    throw new Error(`Invalid server configuration (expected the repository URL as contact):\n${problems.join('\n')}`)
  }
  const { DATABASE_URL, COMMUNITY_API_CONTACT, ANTHROPIC_API_KEY, CRON_SECRET } = parsed.data
  return {
    databaseUrl: DATABASE_URL,
    communityApiContact: COMMUNITY_API_CONTACT,
    ...(ANTHROPIC_API_KEY && { anthropicApiKey: ANTHROPIC_API_KEY }),
    ...(CRON_SECRET && { cronSecret: CRON_SECRET }),
  }
}

let cached: ServerConfig | undefined

/** One configuration value that this feature cannot run without. */
export function requireConfig<K extends keyof ServerConfig>(key: K): NonNullable<ServerConfig[K]> {
  cached ??= loadServerConfig()
  const value = cached[key]
  if (value === undefined) throw new Error(`Missing server configuration: ${key}`)
  return value as NonNullable<ServerConfig[K]>
}
