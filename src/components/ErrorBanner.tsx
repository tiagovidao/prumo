import type { CSSProperties } from 'react'
import { X } from 'lucide-react'

export function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div role="alert" style={bannerStyle}>
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onDismiss} aria-label="Dispensar aviso" style={dismissButtonStyle}>
        <X size={16} />
      </button>
    </div>
  )
}

const bannerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 'var(--space-2)',
  background: 'var(--danger-tint)',
  color: 'var(--danger)',
  borderRadius: 'var(--radius-control)',
  padding: 'var(--space-3)',
  fontSize: 14,
  marginBottom: 'var(--space-4)',
}

const dismissButtonStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'inherit',
  padding: 0,
  flexShrink: 0,
}
