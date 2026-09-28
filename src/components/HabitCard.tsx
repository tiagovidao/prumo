import type { CSSProperties } from 'react'
import { Flame, Pencil, Archive, Check } from 'lucide-react'

export function HabitCard({
  name,
  streak,
  consistency,
  dueToday,
  checkedToday,
  onToggleCheckin,
  onEdit,
  onArchive,
  busy,
}: {
  name: string
  streak: number
  consistency: number
  dueToday: boolean
  checkedToday: boolean
  onToggleCheckin: () => void
  onEdit: () => void
  onArchive: () => void
  busy: boolean
}) {
  return (
    <div style={cardStyle}>
      <button
        onClick={onToggleCheckin}
        disabled={!dueToday || busy}
        aria-label={checkedToday ? 'Desmarcar hoje' : 'Marcar como feito hoje'}
        style={checkboxStyle(checkedToday, dueToday)}
      >
        {checkedToday && <Check size={18} />}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 500, fontSize: 15, margin: 0 }}>{name}</p>
        <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 4, flexWrap: 'wrap' }}>
          <span style={metaStyle}>
            <Flame size={13} style={{ color: 'var(--accent-habitos)' }} />
            {streak} {streak === 1 ? 'dia' : 'dias'}
          </span>
          <span style={metaStyle}>{consistency}% consistência</span>
          {!dueToday && <span style={metaStyle}>Não é hoje</span>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        <button onClick={onEdit} aria-label="Editar hábito" style={iconButtonStyle}>
          <Pencil size={16} />
        </button>
        <button onClick={onArchive} aria-label="Arquivar hábito" style={iconButtonStyle}>
          <Archive size={16} />
        </button>
      </div>
    </div>
  )
}

const cardStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-3)',
  background: 'var(--surface-1)',
  borderRadius: 'var(--radius-card)',
  padding: 'var(--space-3) var(--space-4)',
}

const metaStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 12,
  color: 'var(--text-secondary)',
}

const iconButtonStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--text-secondary)',
  padding: 8,
}

function checkboxStyle(checked: boolean, dueToday: boolean): CSSProperties {
  return {
    width: 32,
    height: 32,
    borderRadius: '50%',
    flexShrink: 0,
    border: `2px solid ${checked ? 'var(--accent-habitos)' : 'var(--border)'}`,
    background: checked ? 'var(--accent-habitos)' : 'transparent',
    color: 'var(--bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: dueToday ? 1 : 0.4,
    cursor: dueToday ? 'pointer' : 'default',
  }
}
