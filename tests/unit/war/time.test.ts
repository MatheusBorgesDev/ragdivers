import { formatDuration, formatLocal } from '@/server/war/time'

it('formats local time in America/Sao_Paulo', () => {
  expect(formatLocal(new Date('2026-11-20T00:30:00Z'))).toBe('19/11/2026 21:30 (horário de Brasília)')
})

it('formats durations', () => {
  expect(formatDuration((2 * 24 + 3) * 3_600_000)).toBe('2d 3h')
  expect(formatDuration(183 * 60_000)).toBe('3h 3min')
  expect(formatDuration(45 * 60_000)).toBe('45min')
  expect(formatDuration(0)).toBe('encerrada')
})
