import { Cloud, CloudRain, CloudSun, Sparkles, Sun, type LucideIcon } from 'lucide-react'

export type MoodEntry = {
  id: string
  user_id: string
  entry_date: string
  mood_scale: number
  note: string | null
  created_at: string
}

/** Sem limite no banco (coluna text): o teto de tamanho da nota é imposto aqui, no cliente. */
export const NOTE_MAX_LENGTH = 2000

/** Escala 1–5 (constraint `mood_scale between 1 and 5` no banco). Metáfora de clima. */
export const MOOD_OPTIONS: { value: number; label: string; Icon: LucideIcon }[] = [
  { value: 1, label: 'Muito mal', Icon: CloudRain },
  { value: 2, label: 'Mal', Icon: Cloud },
  { value: 3, label: 'Ok', Icon: CloudSun },
  { value: 4, label: 'Bem', Icon: Sun },
  { value: 5, label: 'Muito bem', Icon: Sparkles },
]

export function moodOption(value: number) {
  return MOOD_OPTIONS[value - 1]
}
