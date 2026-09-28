import { useCallback, useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { formatDateOnly, parseDateOnly, todayDateOnly } from '../lib/dates'
import { NOTE_MAX_LENGTH, moodOption, type MoodEntry } from '../lib/moods'
import { ErrorBanner } from '../components/ErrorBanner'
import { MoodPicker } from '../components/MoodPicker'

const HISTORY_DAYS = 30
const STRIP_DAYS = 14
const AVERAGE_DAYS = 7

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function formatEntryDate(dateStr: string): string {
  return capitalize(parseDateOnly(dateStr).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }))
}

export function Humor() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState<MoodEntry[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [selectedMood, setSelectedMood] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [formReady, setFormReady] = useState(false)

  const today = todayDateOnly()
  const todayStr = formatDateOnly(today)

  const loadEntries = useCallback(async () => {
    if (!user) return

    const start = todayDateOnly()
    start.setDate(start.getDate() - (HISTORY_DAYS - 1))

    const { data, error } = await supabase
      .from('mood_entries')
      .select('*')
      .gte('entry_date', formatDateOnly(start))
      .order('entry_date', { ascending: false })

    if (error) {
      setLoadError('Não foi possível carregar seus registros. Verifique a conexão e tente novamente.')
      setLoading(false)
      return
    }

    setLoadError(null)
    setEntries(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  // Preenche o formulário com o registro de hoje (se existir) apenas na primeira carga,
  // para não sobrescrever o que a pessoa está digitando depois de salvar.
  useEffect(() => {
    if (loading || formReady) return
    const todayEntry = entries.find((entry) => entry.entry_date === todayStr)
    if (todayEntry) {
      setSelectedMood(todayEntry.mood_scale)
      setNote(todayEntry.note ?? '')
    }
    setFormReady(true)
  }, [loading, formReady, entries, todayStr])

  const hasTodayEntry = entries.some((entry) => entry.entry_date === todayStr)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return

    if (selectedMood === null) {
      setSaveError('Escolha como foi o seu dia antes de salvar.')
      return
    }

    setSaving(true)
    setSaveError(null)
    setJustSaved(false)

    const trimmedNote = note.trim()

    // upsert em (user_id, entry_date): salvar de novo no mesmo dia atualiza o registro em vez de duplicar.
    const { error } = await supabase.from('mood_entries').upsert(
      {
        user_id: user.id,
        entry_date: formatDateOnly(todayDateOnly()),
        mood_scale: selectedMood,
        note: trimmedNote === '' ? null : trimmedNote,
      },
      { onConflict: 'user_id,entry_date' },
    )

    setSaving(false)

    if (error) {
      setSaveError('Não foi possível salvar o registro. Tente novamente.')
      return
    }

    setJustSaved(true)
    await loadEntries()
  }

  function handleMoodChange(value: number) {
    setSelectedMood(value)
    setJustSaved(false)
    setSaveError(null)
  }

  function handleNoteChange(value: string) {
    setNote(value)
    setJustSaved(false)
  }

  const entryByDate = new Map(entries.map((entry) => [entry.entry_date, entry]))

  const stripDays = Array.from({ length: STRIP_DAYS }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (STRIP_DAYS - 1 - index))
    return { date, entry: entryByDate.get(formatDateOnly(date)) }
  })

  const averageStart = new Date(today)
  averageStart.setDate(today.getDate() - (AVERAGE_DAYS - 1))
  const recentScores = entries.filter((entry) => entry.entry_date >= formatDateOnly(averageStart)).map((entry) => entry.mood_scale)
  const average = recentScores.length > 0 ? recentScores.reduce((sum, value) => sum + value, 0) / recentScores.length : null

  const longDate = capitalize(today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }))

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 'var(--space-5) var(--space-4)' }}>
      <Link
        to="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          color: 'var(--text-secondary)',
          textDecoration: 'none',
          fontSize: 14,
          marginBottom: 'var(--space-5)',
        }}
      >
        <ArrowLeft size={16} />
        Hoje
      </Link>

      <h1 style={{ fontSize: 22, color: 'var(--accent-humor)', marginBottom: 'var(--space-1)' }}>Diário emocional</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 'var(--space-5)' }}>{longDate}</p>

      {loadError && <ErrorBanner message={loadError} onDismiss={() => setLoadError(null)} />}

      <form onSubmit={handleSubmit} style={cardStyle}>
        <p style={{ fontWeight: 500, marginBottom: 'var(--space-3)' }}>
          {hasTodayEntry ? 'Seu registro de hoje' : 'Como foi o seu dia?'}
        </p>

        <MoodPicker value={selectedMood} onChange={handleMoodChange} disabled={saving || loading} />

        <textarea
          value={note}
          onChange={(e) => handleNoteChange(e.target.value)}
          maxLength={NOTE_MAX_LENGTH}
          placeholder="O que você sentiu hoje? (opcional)"
          rows={4}
          disabled={saving || loading}
          style={textareaStyle}
        />
        <p style={counterStyle}>
          {note.length}/{NOTE_MAX_LENGTH}
        </p>

        {saveError && <ErrorBanner message={saveError} onDismiss={() => setSaveError(null)} />}
        {justSaved && (
          <p role="status" style={{ color: 'var(--accent-humor)', fontSize: 14, marginBottom: 'var(--space-3)' }}>
            Registro salvo.
          </p>
        )}

        <button type="submit" disabled={saving || loading} style={submitButtonStyle(saving || loading)}>
          {saving ? 'Salvando…' : hasTodayEntry ? 'Atualizar registro' : 'Salvar registro'}
        </button>
      </form>

      {!loading && (
        <>
          <section style={{ marginTop: 'var(--space-6)' }}>
            <div style={sectionHeaderStyle}>
              <h2 style={sectionTitleStyle}>Últimos {STRIP_DAYS} dias</h2>
              {average !== null && (
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Média de {AVERAGE_DAYS} dias: {average.toFixed(1).replace('.', ',')}
                </span>
              )}
            </div>
            <div style={stripStyle}>
              {stripDays.map(({ date, entry }) => {
                const label = date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
                return (
                  <div key={formatDateOnly(date)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div
                      role="img"
                      aria-label={entry ? `${label}: ${moodOption(entry.mood_scale).label}` : `${label}: sem registro`}
                      style={barStyle(entry?.mood_scale ?? null)}
                    />
                    <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{date.getDate()}</span>
                  </div>
                )
              })}
            </div>
          </section>

          <section style={{ marginTop: 'var(--space-6)' }}>
            <h2 style={{ ...sectionTitleStyle, marginBottom: 'var(--space-3)' }}>Histórico</h2>
            {entries.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                Seus registros aparecem aqui. Faça o primeiro acima.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {entries.map((entry) => {
                  const { label, Icon } = moodOption(entry.mood_scale)
                  return (
                    <article key={entry.id} style={entryStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{formatEntryDate(entry.entry_date)}</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--accent-humor)' }}>
                          <Icon size={16} />
                          {label}
                        </span>
                      </div>
                      {entry.note && <p style={noteStyle}>{entry.note}</p>}
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </>
      )}

      {loading && <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-5)' }}>Carregando…</p>}
    </div>
  )
}

const cardStyle: CSSProperties = {
  background: 'var(--surface-1)',
  borderRadius: 'var(--radius-card)',
  padding: 'var(--space-4)',
}

const textareaStyle: CSSProperties = {
  width: '100%',
  marginTop: 'var(--space-4)',
  padding: '12px',
  borderRadius: 'var(--radius-control)',
  border: '1px solid var(--border)',
  background: 'var(--surface-2)',
  color: 'var(--text-primary)',
  fontSize: 16,
  lineHeight: 1.4,
  resize: 'vertical',
  minHeight: 100,
}

const counterStyle: CSSProperties = {
  textAlign: 'right',
  fontSize: 12,
  color: 'var(--text-secondary)',
  margin: '4px 0 var(--space-3)',
}

function submitButtonStyle(disabled: boolean): CSSProperties {
  return {
    width: '100%',
    padding: '12px',
    borderRadius: 'var(--radius-control)',
    border: 'none',
    background: 'var(--accent-humor)',
    color: 'var(--bg)',
    fontWeight: 600,
    opacity: disabled ? 0.7 : 1,
  }
}

const sectionHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  marginBottom: 'var(--space-3)',
}

const sectionTitleStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: 'var(--text-primary)',
  margin: 0,
}

const stripStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-end',
  gap: 4,
  height: 104,
  background: 'var(--surface-1)',
  borderRadius: 'var(--radius-card)',
  padding: 'var(--space-3)',
}

function barStyle(scale: number | null): CSSProperties {
  if (scale === null) {
    return { width: '100%', maxWidth: 14, height: 4, borderRadius: 3, background: 'var(--border)' }
  }
  return {
    width: '100%',
    maxWidth: 14,
    height: 8 + scale * 8,
    borderRadius: 3,
    background: 'var(--accent-humor)',
    opacity: 0.4 + scale * 0.12,
  }
}

const entryStyle: CSSProperties = {
  background: 'var(--surface-1)',
  borderRadius: 'var(--radius-card)',
  padding: 'var(--space-3) var(--space-4)',
}

// A interface global desativa a seleção de texto; as notas do diário continuam copiáveis.
const noteStyle: CSSProperties = {
  margin: 'var(--space-2) 0 0',
  fontSize: 14,
  lineHeight: 1.45,
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
  userSelect: 'text',
  WebkitUserSelect: 'text',
}
