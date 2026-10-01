import { useEffect, useState, type FormEvent, type CSSProperties } from 'react'
import { X } from 'lucide-react'
import { parseCurrencyInput } from '../lib/finance'

export type CategoryFormValues = {
  name: string
  monthlyLimit: number
}

export function CategoryFormModal({
  initialValues,
  onSubmit,
  onClose,
  submitting,
  submitError,
}: {
  initialValues?: CategoryFormValues
  onSubmit: (values: CategoryFormValues) => void
  onClose: () => void
  submitting: boolean
  /** Erro vindo da tentativa de salvar no backend (distinto da validação local do formulário). */
  submitError?: string | null
}) {
  const [name, setName] = useState(initialValues?.name ?? '')
  const [monthlyLimit, setMonthlyLimit] = useState(
    initialValues ? String(initialValues.monthlyLimit).replace('.', ',') : '',
  )
  const [validationError, setValidationError] = useState<string | null>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (!name.trim()) {
      setValidationError('Dê um nome à categoria.')
      return
    }

    const limitValue = parseCurrencyInput(monthlyLimit)
    if (!monthlyLimit.trim() || Number.isNaN(limitValue) || limitValue <= 0) {
      setValidationError('Informe um limite mensal maior que zero.')
      return
    }

    setValidationError(null)
    onSubmit({ name: name.trim(), monthlyLimit: limitValue })
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
          <h2 style={{ fontSize: 18 }}>{initialValues ? 'Editar categoria' : 'Nova categoria'}</h2>
          <button onClick={onClose} aria-label="Fechar" style={iconButtonStyle}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <input
            type="text"
            placeholder="Nome da categoria"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />

          <div>
            <p style={labelStyle}>Limite mensal</p>
            <div style={{ position: 'relative' }}>
              <span style={currencyPrefixStyle}>R$</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                style={{ ...inputStyle, paddingLeft: 36 }}
              />
            </div>
          </div>

          {displayedError && <p style={{ color: 'var(--danger)', fontSize: 13, margin: 0 }}>{displayedError}</p>}

          <button type="submit" disabled={submitting} style={primaryButtonStyle(submitting)}>
            {submitting ? 'Salvando…' : initialValues ? 'Salvar alterações' : 'Criar categoria'}
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
  width: '100%',
  padding: '12px',
  borderRadius: 'var(--radius-control)',
  border: '1px solid var(--border)',
  background: 'var(--surface-2)',
  color: 'var(--text-primary)',
  fontSize: 16,
}

const currencyPrefixStyle: CSSProperties = {
  position: 'absolute',
  left: 12,
  top: '50%',
  transform: 'translateY(-50%)',
  color: 'var(--text-secondary)',
  fontSize: 16,
  pointerEvents: 'none',
}

const iconButtonStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--text-secondary)',
  padding: 4,
}

function primaryButtonStyle(disabled: boolean): CSSProperties {
  return {
    padding: '12px',
    borderRadius: 'var(--radius-control)',
    border: 'none',
    background: 'var(--accent-financeiro)',
    color: 'var(--bg)',
    fontWeight: 600,
    opacity: disabled ? 0.7 : 1,
    marginTop: 'var(--space-2)',
  }
}
