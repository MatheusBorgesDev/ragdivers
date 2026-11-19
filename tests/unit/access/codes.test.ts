import { generateCode, hashCode, normalizeCode } from '@/server/access/codes'

it('generates 10 Crockford base32 characters in two groups', () => {
  expect(generateCode()).toMatch(/^[0-9A-HJKMNP-TV-Z]{5}-[0-9A-HJKMNP-TV-Z]{5}$/)
})

it('does not repeat codes', () => {
  expect(new Set(Array.from({ length: 1000 }, generateCode)).size).toBe(1000)
})

it('accepts lower case, spaces and a missing dash', () => {
  expect(normalizeCode('k7m2q-9xh4t')).toBe('K7M2Q9XH4T')
  expect(normalizeCode(' K7M2Q 9XH4T ')).toBe('K7M2Q9XH4T')
})

it('reads the letters O, I and L as the digits they look like', () => {
  expect(normalizeCode('OOIIL-00111')).toBe('0011100111')
})

it.each(['K7M2Q-9XH4', 'K7M2Q-9XH4TT', 'K7M2Q-9XH4U', 'K7M2Q-9XH4!', ''])('rejects %j', (input) => {
  expect(normalizeCode(input)).toBeNull()
})

it('hashes the normalized code with SHA-256', () => {
  // echo -n K7M2Q9XH4T | sha256sum
  expect(hashCode('K7M2Q9XH4T')).toBe('bea55e799a5bbfaceb774b9213227ebf71de7fb255c6d89160ce1f8fe7debf72')
})
