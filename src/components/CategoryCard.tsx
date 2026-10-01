import type { CSSProperties } from 'react'
import { Archive, Pencil } from 'lucide-react'
import { budgetPercentage, formatCurrency, NEAR_LIMIT_THRESHOLD } from '../lib/finance'

export function CategoryCard({
  name,
  spent,
  limit,
  onEdit,
  onArchive,
  busy,
}: {
  name: string
  spent: number
  limit: number
  onEdit: () => void
  onArchive: () => void
  busy: boolean
}) {
  const pct = budgetPercentage(spent, limit)
  const nearLimit = pct >= NEAR_LIMIT_THRESHOLD

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 500, fontSize: 15, margin: 0 }}>{name}</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            {formatCurrency(spent)} de {formatCurrency(limit)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button onClick={onEdit} disabled={busy} aria-label="Editar categoria" style={iconButtonStyle}>
            <Pencil size={16} />
          </button>
          <button onClick={onArchive} disabled={busy} aria-label="Arquivar categoria" style={iconButtonStyle}>
            <Archive size={16} />
          </button>
        </div>
      </div>

      <div style={{ marginTop: 'var(--space-3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
          <span style={{ color: nearLimit ? 'var(--danger)' : 'var(--text-secondary)' }}>
            {nearLimit ? 'Perto do limite' : ' '}
          </span>
          <span style={{ color: nearLimit ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: 500 }}>{pct}%</span>
        </div>
        <div style={trackStyle}>
          <div
            style={{
              width: `${Math.min(100, pct)}%`,
              height: '100%',
              background: nearLimit ? 'var(--danger)' : 'var(--accent-financeiro)',
              borderRadius: 4,
            }}
          />
        </div>
      </div>
    </div>
  )
}

const cardStyle: CSSProperties = {
  background: 'var(--surface-1)',
  borderRadius: 'var(--radius-card)',
  padding: 'var(--space-3) var(--space-4)',
}

const trackStyle: CSSProperties = {
  height: 6,
  background: 'var(--surface-2)',
  borderRadius: 4,
  overflow: 'hidden',
}

const iconButtonStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--text-secondary)',
  padding: 8,
}
