import type { CSSProperties } from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { formatCurrency } from '../lib/finance'

export function ExpenseItem({
  categoryName,
  amount,
  description,
  dateLabel,
  reflectionNote,
  onDelete,
  busy,
}: {
  categoryName: string
  amount: number
  description: string | null
  dateLabel: string
  reflectionNote: string | null
  onDelete: () => void
  busy: boolean
}) {
  return (
    <article style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: 'var(--accent-financeiro)', fontWeight: 500 }}>{categoryName}</span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>· {dateLabel}</span>
          </div>
          {description && <p style={{ margin: '4px 0 0', fontSize: 14 }}>{description}</p>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{formatCurrency(amount)}</span>
          <button onClick={onDelete} disabled={busy} aria-label="Excluir gasto" style={deleteButtonStyle}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {reflectionNote && (
        <div style={reflectionStyle}>
          <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 2 }} />
          <span style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{reflectionNote}</span>
        </div>
      )}
    </article>
  )
}

const cardStyle: CSSProperties = {
  background: 'var(--surface-1)',
  borderRadius: 'var(--radius-card)',
  padding: 'var(--space-3) var(--space-4)',
}

const reflectionStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 6,
  marginTop: 'var(--space-2)',
  fontSize: 12,
  color: 'var(--text-secondary)',
  fontStyle: 'italic',
}

const deleteButtonStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--text-muted)',
  padding: 6,
}
