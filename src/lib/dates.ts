/**
 * Datas "só dia" (YYYY-MM-DD) sempre no fuso LOCAL do dispositivo.
 *
 * Não usar `toISOString().slice(0, 10)` para isso: ele devolve a data em UTC, que em
 * Brasília (UTC-3) já é o dia seguinte a partir das 21h.
 */

export function formatDateOnly(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** 'YYYY-MM-DD' (coluna `date` do Postgres) → Date à meia-noite local. */
export function parseDateOnly(dateStr: string): Date {
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Timestamp completo com fuso (coluna `timestamptz`, ex.: created_at) → dia local correspondente. */
export function localDayOfTimestamp(timestamp: string): Date {
  const date = new Date(timestamp)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function todayDateOnly(): Date {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now
}

export function startOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}
