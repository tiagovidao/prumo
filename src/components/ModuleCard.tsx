import type { ReactNode } from 'react'

type Accent = 'habitos' | 'humor' | 'financeiro'

export function ModuleCard({
  accent,
  icon,
  title,
  subtitle,
  children,
}: {
  accent: Accent
  icon: ReactNode
  title: string
  subtitle?: string
  children?: ReactNode
}) {
  return (
    <div
      style={{
        background: 'var(--surface-1)',
        borderRadius: 'var(--radius-card)',
        padding: 'var(--space-4) var(--space-5)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          marginBottom: children ? 'var(--space-3)' : 0,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            background: `var(--accent-${accent}-tint)`,
            color: `var(--accent-${accent})`,
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 500, fontSize: 15, margin: 0 }}>{title}</p>
          {subtitle && (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>{subtitle}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}
