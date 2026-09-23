import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

type Accent = 'habitos' | 'humor' | 'financeiro'

export function ModulePlaceholder({ title, accent }: { title: string; accent: Accent }) {
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
      <h1 style={{ fontSize: 22, marginBottom: 'var(--space-2)', color: `var(--accent-${accent})` }}>{title}</h1>
      <p style={{ color: 'var(--text-secondary)' }}>Este módulo ainda está em construção — chega na próxima etapa.</p>
    </div>
  )
}
