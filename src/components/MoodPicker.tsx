import type { CSSProperties } from 'react'
import { MOOD_OPTIONS } from '../lib/moods'

export function MoodPicker({
  value,
  onChange,
  disabled,
}: {
  value: number | null
  onChange: (value: number) => void
  disabled?: boolean
}) {
  return (
    <div role="radiogroup" aria-label="Como foi o seu dia" style={groupStyle}>
      {MOOD_OPTIONS.map(({ value: optionValue, label, Icon }) => {
        const selected = value === optionValue
        return (
          <button
            key={optionValue}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(optionValue)}
            style={optionStyle(selected)}
          >
            <Icon size={22} />
            <span style={{ fontSize: 11, lineHeight: 1.2 }}>{label}</span>
          </button>
        )
      })}
    </div>
  )
}

const groupStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 1fr)',
  gap: 'var(--space-2)',
}

function optionStyle(selected: boolean): CSSProperties {
  return {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 68,
    padding: '10px 2px',
    textAlign: 'center',
    borderRadius: 'var(--radius-control)',
    border: `1px solid ${selected ? 'var(--accent-humor)' : 'var(--border)'}`,
    background: selected ? 'var(--accent-humor-tint)' : 'var(--surface-2)',
    color: selected ? 'var(--accent-humor)' : 'var(--text-secondary)',
    fontWeight: selected ? 600 : 500,
  }
}
