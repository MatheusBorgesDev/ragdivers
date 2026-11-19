// Records the community API's three responses, exactly as sent, as an eval fixture. Free: three GET requests.
// Usage: pnpm war:snapshot
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { loadServerConfig } from '@/server/config'
import { fetchWarResponses } from '@/server/war/client'
import { parseRawWar } from '@/server/war/schemas'

const { communityApiContact } = loadServerConfig()
const fetchedAt = new Date()
const result = await fetchWarResponses({ contact: communityApiContact })
if (!result.ok) {
  console.error(`Community API failed: ${result.error}`)
  process.exit(1)
}
parseRawWar(result.responses) // refuse to save a snapshot the client could not read

const iso = fetchedAt.toISOString().replace(/\.\d{3}Z$/, 'Z')
const id = iso.replace(/[-:]/g, '').replace(/\d{2}Z$/, 'Z') // 20261119T1530Z
const file = join('evals/snapshots/war', `${id}.json`)
writeFileSync(file, `${JSON.stringify({ fetchedAt: iso, ...result.responses }, null, 2)}\n`)
console.log(`Saved ${file}`)
