import { loadServerConfig } from '@/server/config'

const DATABASE_URL = 'postgresql://x@127.0.0.1:54322/postgres'

it('rejects an e-mail as the community API contact', () => {
  expect(() => loadServerConfig({ DATABASE_URL, COMMUNITY_API_CONTACT: 'someone@example.com' })).toThrow(
    /repository URL/,
  )
})

it('accepts the repository URL', () => {
  expect(
    loadServerConfig({ DATABASE_URL, COMMUNITY_API_CONTACT: 'https://github.com/owner/ragdivers' })
      .communityApiContact,
  ).toBe('https://github.com/owner/ragdivers')
})

it('treats an empty optional variable as absent', () => {
  const config = loadServerConfig({
    DATABASE_URL,
    COMMUNITY_API_CONTACT: 'https://github.com/owner/ragdivers',
    ANTHROPIC_API_KEY: '',
    CRON_SECRET: '',
  })
  expect(config.anthropicApiKey).toBeUndefined()
  expect(config.cronSecret).toBeUndefined()
})
