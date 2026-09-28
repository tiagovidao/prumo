export type FrequencyType = 'daily' | 'weekly_days'

export type Habit = {
  id: string
  user_id: string
  name: string
  frequency_type: FrequencyType
  frequency_days: number[] | null
  archived: boolean
  created_at: string
}

export type HabitCheckin = {
  id: string
  habit_id: string
  user_id: string
  checkin_date: string
  created_at: string
}

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function weekdayLabel(day: number): string {
  return WEEKDAY_LABELS[day]
}

/** Um hábito "daily" vale todo dia; um "weekly_days" só nos dias da semana configurados (0=Dom...6=Sáb). */
export function isDueOn(habit: Pick<Habit, 'frequency_type' | 'frequency_days'>, date: Date): boolean {
  if (habit.frequency_type === 'daily') return true
  return habit.frequency_days?.includes(date.getDay()) ?? false
}

export function formatDateOnly(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseDateOnly(dateStr: string): Date {
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayDateOnly(): Date {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now
}

/**
 * Sequência atual de dias cumpridos, contando de trás para frente a partir de hoje.
 * Se hoje ainda é um dia devido e não foi marcado, isso não quebra a sequência —
 * a contagem simplesmente começa em ontem (o dia de hoje ainda "não fechou").
 */
export function calculateStreak(
  habit: Pick<Habit, 'frequency_type' | 'frequency_days' | 'created_at'>,
  checkinDates: Set<string>,
  today: Date = todayDateOnly(),
): number {
  const createdAt = parseDateOnly(habit.created_at)
  const cursor = new Date(today)

  if (isDueOn(habit, cursor) && !checkinDates.has(formatDateOnly(cursor))) {
    cursor.setDate(cursor.getDate() - 1)
  }

  let streak = 0
  while (cursor >= createdAt) {
    if (isDueOn(habit, cursor)) {
      if (checkinDates.has(formatDateOnly(cursor))) {
        streak++
      } else {
        break
      }
    }
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

/** % de dias devidos que foram cumpridos, desde a criação do hábito até hoje. */
export function calculateConsistency(
  habit: Pick<Habit, 'frequency_type' | 'frequency_days' | 'created_at'>,
  checkinDates: Set<string>,
  today: Date = todayDateOnly(),
): number {
  const createdAt = parseDateOnly(habit.created_at)
  const cursor = new Date(createdAt)

  let expected = 0
  let done = 0

  while (cursor <= today) {
    if (isDueOn(habit, cursor)) {
      expected++
      if (checkinDates.has(formatDateOnly(cursor))) done++
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  if (expected === 0) return 0
  return Math.round((done / expected) * 100)
}
