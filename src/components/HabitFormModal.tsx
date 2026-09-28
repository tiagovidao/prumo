import { useEffect, useState, type FormEvent, type CSSProperties } from 'react'
import { X } from 'lucide-react'
import { weekdayLabel, type FrequencyType } from '../lib/habitStats'

export type HabitFormValues = {
  name: string
  frequencyType: FrequencyType
  frequencyDays: number[]
}

export function HabitFormModal({
  initialValues,
  onSubmit,
  onClose,
  submitting,
  submitError,
}: {
  initialValues?: HabitFormValues
  onSubmit: (values: HabitFormValues) => void
  onClose: () => void
  submitting: boolean
  /** Erro vindo da tentativa de salvar no backend (distinto da validação local do formulário). */
  submitError?: string | null
}) {
  const [name, setName] = useState(initialValues?.name ?? '')
  const [frequencyType, setFrequencyType] = useState<FrequencyType>(initialValues?.frequencyType ?? 'daily')
  const [frequencyDays, setFrequencyDays] = useState<number[]>(initialValues?.frequencyDays ?? [])
  const [validationError, setValidationError] = useState<string | null>(null)

  function toggleDay(day: number) {
    setFrequencyDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b),
    )
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setValidationError('Dê um nome ao hábito.')
      return
    }
    if (frequencyType === 'weekly_days' && frequencyDays.length === 0) {
      setValidationError('Escolha pelo menos um dia da semana.')
      return
    }
    setValidationError(null)
    onSubmit({ name: name.trim(), frequencyType, frequencyDays })
  }

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  const displayedError = validationError ?? submitError ?? null

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--space-4)',
          }}
        >
          <h2 style={{ fontSize: 18 }}>{initialValues ? 'Editar hábito' : 'Novo hábito'}</h2>
          <button onClick={onClose} aria-label="Fechar" style={iconButtonStyle}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <input
            type="text"
            placeholder="Nome do hábito"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />

          <div>
            <p style={labelStyle}>Frequência</p>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button
                type="button"
                onClick={() => setFrequencyType('daily')}
                style={toggleButtonStyle(frequencyType === 'daily')}
              >
                Todo dia
              </button>
              <button
                type="button"
                onClick={() => setFrequencyType('weekly_days')}
                style={toggleButtonStyle(frequencyType === 'weekly_days')}
              >
                Dias específicos
              </button>
            </div>
          </div>

          {frequencyType === 'weekly_days' && (
            <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
              {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  style={dayButtonStyle(frequencyDays.includes(day))}
                >
                  {weekdayLabel(day)}
                </button>
              ))}
            </div>
          )}

          {displayedError && <p style={{ color: 'var(--danger)', fontSize: 13, margin: 0 }}>{displayedError}</p>}

          <button type="submit" disabled={submitting} style={primaryButtonStyle(submitting)}>
            {submitting ? 'Salvando…' : initialValues ? 'Salvar alterações' : 'Criar hábito'}
          </button>
        </form>
      </div>
    </div>
  )
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  zIndex: 50,
}

const modalStyle: CSSProperties = {
  width: '100%',
  maxWidth: 480,
  background: 'var(--surface-1)',
  borderRadius: '20px 20px 0 0',
  maxHeight: '90dvh',
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  padding: 'var(--space-5) var(--space-4)',
  paddingBottom: 'calc(var(--space-6) + env(safe-area-inset-bottom, 0px))',
}

const labelStyle: CSSProperties = {
  fontSize: 13,
  color: 'var(--text-secondary)',
  marginBottom: 'var(--space-2)',
}

const inputStyle: CSSProperties = {
  padding: '12px',
  borderRadius: 'var(--radius-control)',
  border: '1px solid var(--border)',
  background: 'var(--surface-2)',
  color: 'var(--text-primary)',
  fontSize: 16,
}

const iconButtonStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--text-secondary)',
  padding: 4,
}

function toggleButtonStyle(active: boolean): CSSProperties {
  return {
    flex: 1,
    padding: '10px',
    borderRadius: 'var(--radius-control)',
    border: `1px solid ${active ? 'var(--accent-habitos)' : 'var(--border)'}`,
    background: active ? 'var(--accent-habitos-tint)' : 'var(--surface-2)',
    color: active ? 'var(--accent-habitos)' : 'var(--text-primary)',
    fontWeight: 500,
    fontSize: 14,
  }
}

function dayButtonStyle(active: boolean): CSSProperties {
  return {
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: `1px solid ${active ? 'var(--accent-habitos)' : 'var(--border)'}`,
    background: active ? 'var(--accent-habitos-tint)' : 'var(--surface-2)',
    color: active ? 'var(--accent-habitos)' : 'var(--text-secondary)',
    fontSize: 13,
    fontWeight: 500,
  }
}

function primaryButtonStyle(disabled: boolean): CSSProperties {
  return {
    padding: '12px',
    borderRadius: 'var(--radius-control)',
    border: 'none',
    background: 'var(--accent-habitos)',
    color: 'var(--bg)',
    fontWeight: 600,
    opacity: disabled ? 0.7 : 1,
    marginTop: 'var(--space-2)',
  }
}
