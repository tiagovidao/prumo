import { useState, type FormEvent, type CSSProperties } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function Login() {
  const { session, loading, signInWithGoogle, signInWithPassword, signUpWithPassword } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null)

  if (!loading && session) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setConfirmMessage(null)
    setSubmitting(true)

    const result =
      mode === 'signin' ? await signInWithPassword(email, password) : await signUpWithPassword(email, password)

    setSubmitting(false)

    if (result.error) {
      setError(result.error)
    } else if (mode === 'signup') {
      setConfirmMessage('Conta criada. Verifique seu e-mail para confirmar o cadastro.')
    }
  }

  return (
    <div
      style={{
        minHeight: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-5)',
      }}
    >
      <div style={{ width: '100%', maxWidth: 360 }}>
        <h1 style={{ fontSize: 28, marginBottom: 'var(--space-1)' }}>Prumo</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
          Hábitos, humor e finanças em um só lugar.
        </p>

        <button onClick={() => signInWithGoogle()} style={secondaryButtonStyle}>
          Continuar com Google
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            margin: 'var(--space-4) 0',
            color: 'var(--text-muted)',
            fontSize: 13,
          }}
        >
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          ou
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={inputStyle}
          />

          {error && <p style={{ color: 'var(--danger)', fontSize: 13, margin: 0 }}>{error}</p>}
          {confirmMessage && (
            <p style={{ color: 'var(--accent-financeiro)', fontSize: 13, margin: 0 }}>{confirmMessage}</p>
          )}

          <button type="submit" disabled={submitting} style={primaryButtonStyle(submitting)}>
            {mode === 'signin' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin')
            setError(null)
            setConfirmMessage(null)
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            marginTop: 'var(--space-4)',
            fontSize: 13,
            padding: 0,
          }}
        >
          {mode === 'signin' ? 'Não tem conta? Criar uma' : 'Já tem conta? Entrar'}
        </button>
      </div>
    </div>
  )
}

const inputStyle: CSSProperties = {
  padding: '12px',
  borderRadius: 'var(--radius-control)',
  border: '1px solid var(--border)',
  background: 'var(--surface-1)',
  color: 'var(--text-primary)',
}

const secondaryButtonStyle: CSSProperties = {
  width: '100%',
  padding: '12px',
  borderRadius: 'var(--radius-control)',
  border: '1px solid var(--border)',
  background: 'var(--surface-1)',
  color: 'var(--text-primary)',
  fontWeight: 500,
}

function primaryButtonStyle(disabled: boolean): CSSProperties {
  return {
    padding: '12px',
    borderRadius: 'var(--radius-control)',
    border: 'none',
    background: 'var(--text-primary)',
    color: 'var(--bg)',
    fontWeight: 600,
    opacity: disabled ? 0.7 : 1,
  }
}
