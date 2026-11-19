const TIME_ZONE = 'America/Sao_Paulo'

const parts = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** "19/11/2026 21:30 (horário de Brasília)": the form the agent copies into answers, so it never converts time zones. */
export function formatLocal(date: Date): string {
  const p = Object.fromEntries(parts.formatToParts(date).map((part) => [part.type, part.value]))
  return `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute} (horário de Brasília)`
}

/** Time left in the largest two units ("2d 3h", "3h 3min", "45min"); "encerrada" once it is over. */
export function formatDuration(ms: number): string {
  if (ms <= 0) return 'encerrada'
  const totalMinutes = Math.floor(ms / 60_000)
  const days = Math.floor(totalMinutes / 1_440)
  const hours = Math.floor((totalMinutes % 1_440) / 60)
  const minutes = totalMinutes % 60
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}min`
  return `${minutes}min`
}
