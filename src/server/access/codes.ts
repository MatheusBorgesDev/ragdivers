import { createHash, randomInt } from 'node:crypto'

// Invite codes are the only credential (there is no login), so they must be unguessable: 10 random Crockford
// base32 characters = 50 bits. Only the SHA-256 of the code is stored. Same scheme as the MCP Barber Shop.
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const LENGTH = 10
const LOOKALIKES: Record<string, string> = { O: '0', I: '1', L: '1' }

/** A new code, formatted for people as XXXXX-XXXXX. */
export function generateCode(): string {
  const chars = Array.from({ length: LENGTH }, () => ALPHABET[randomInt(ALPHABET.length)])
  return `${chars.slice(0, 5).join('')}-${chars.slice(5).join('')}`
}

/** The canonical form of a typed code, or null when it cannot be a code. */
export function normalizeCode(input: string): string | null {
  const compact = input
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .replace(/[OIL]/g, (char) => LOOKALIKES[char] ?? char)
  if (compact.length !== LENGTH) return null
  return [...compact].every((char) => ALPHABET.includes(char)) ? compact : null
}

export function hashCode(normalized: string): string {
  return createHash('sha256').update(normalized).digest('hex')
}
