import { useState, useEffect, useId, type FormEvent, type CSSProperties } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { formatDateOnly, startOfMonth, todayDateOnly } from '../lib/dates'
import {
  budgetPercentage,
  parseCurrencyInput,
  DESCRIPTION_MAX_LENGTH,
  NEAR_LIMIT_THRESHOLD,
  REFLECTION_MAX_LENGTH,
} from '../lib/finance'

export type ExpenseFormValues = {
  categoryId: string
  amount: number
  description: string
  expenseDate: string
  reflectionNote: string
}

type CategoryOption = {
  id: string
  name: string
  spent: number
  monthlyLimit: number
}

export function ExpenseFormModal({
  categories,
  onSubmit,
  onClose,
  submitting,
  submitError,
}: {
  categories: CategoryOption[]
  onSubmit: (values: ExpenseFormValues) => void
  onClose: () => void
  submitting: boolean
  submitError?: string | null
}) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [expenseDate, setExpenseDate] = useState(formatDateOnly(todayDateOnly()))
  const [reflectionNote, setReflectionNote] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const categoryLabelId = useId()

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  const selectedCategory = categories.find((c) => c.id === categoryId)
  const amountValue = parseCurrencyInput(amount)
  const hasValidAmount = amount.trim() !== '' && !Number.isNaN(amountValue) && amountValue > 0

  const currentPct = selectedCategory ? budgetPercentage(selectedCategory.spent, selectedCategory.monthlyLimit) : 0
  const projectedSpent = selectedCategory && hasValidAmount ? selectedCategory.spent + amountValue : (selectedCategory?.spent ?? 0)
  const projectedPct = selectedCategory ? budgetPercentage(projectedSpent, selectedCategory.monthlyLimit) : 0
  const willExceed = !!selectedCategory && selectedCategory.monthlyLimit > 0 && projectedSpent > selectedCategory.monthlyLimit
  // Alerta proativo: categoria já perto do limite mesmo antes de contar este gasto.
  const alreadyNearLimit = !willExceed && currentPct >= NEAR_LIMIT_THRESHOLD

  function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (!categoryId) {
      setValidationError('Escolha uma categoria.')
      return
    }
    if (!hasValidAmount) {
      setValidationError('Informe um valor maior que zero.')
      return
    }
    if (willExceed && !reflectionNote.trim()) {
      setValidationError('Conte rapidamente o motivo desse gasto para continuar.')
      return
    }

    setValidationError(null)
    onSubmit({
      categoryId,
      amount: amountValue,
      description: description.trim(),
      expenseDate,
      reflectionNote: willExceed ? reflectionNote.trim() : '',
    })
  }

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
          <h2 style={{ fontSize: 18 }}>Novo gasto</h2>
          <button onClick={onClose} aria-label="Fechar" style={iconButtonStyle}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div>
            <p id={categoryLabelId} style={labelStyle}>
              Categoria
            </p>
            <div
              role="radiogroup"
              aria-labelledby={categoryLabelId}
              style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}
            >
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  role="radio"
                  aria-checked={categoryId === category.id}
                  onClick={() => setCategoryId(category.id)}
                  style={categoryButtonStyle(categoryId === category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p style={labelStyle}>Valor</p>
            <div style={{ position: 'relative' }}>
              <span style={currencyPrefixStyle}>R$</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ ...inputStyle, paddingLeft: 36 }}
              />
            </div>
          </div>

          <input
            type="text"
            placeholder="Descrição (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={DESCRIPTION_MAX_LENGTH}
            style={inputStyle}
          />

          <div>
            <p style={labelStyle}>Data</p>
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              min={formatDateOnly(startOfMonth())}
              max={formatDateOnly(todayDateOnly())}
              style={inputStyle}
            />
          </div>

          {alreadyNearLimit && (
            <div style={warningBannerStyle}>
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                Você já usou {currentPct}% do orçamento de {selectedCategory?.name} neste mês.
              </span>
            </div>
          )}

          {willExceed && (
            <div>
              <div style={{ ...warningBannerStyle, marginBottom: 'var(--space-2)' }}>
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                  Esse gasto ultrapassa o orçamento de {selectedCategory?.name} neste mês (ficará em {projectedPct}%).
                </span>
              </div>
              <p style={labelStyle}>O que motivou esse gasto?</p>
              <textarea
                value={reflectionNote}
                onChange={(e) => setReflectionNote(e.target.value)}
                maxLength={REFLECTION_MAX_LENGTH}
                placeholder="Um breve motivo ajuda a entender o padrão depois"
                rows={3}
                style={textareaStyle}
              />
            </div>
          )}

          {displayedError && <p style={{ color: 'var(--danger)', fontSize: 13, margin: 0 }}>{displayedError}</p>}

          <button type="submit" disabled={submitting} style={primaryButtonStyle(submitting)}>
            {submitting ? 'Salvando…' : 'Registrar gasto'}
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

const textareaStyle: CSSProperties = {
  width: '100%',
  padding: '12px',
  borderRadius: 'var(--radius-control)',
  border: '1px solid var(--border)',
  background: 'var(--surface-2)',
  color: 'var(--text-primary)',
  fontSize: 16,
  lineHeight: 1.4,
  resize: 'vertical',
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

const warningBannerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 'var(--space-2)',
  background: 'var(--danger-tint)',
  color: 'var(--danger)',
  borderRadius: 'var(--radius-control)',
  padding: 'var(--space-3)',
  fontSize: 13,
}

const iconButtonStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--text-secondary)',
  padding: 4,
}

function categoryButtonStyle(active: boolean): CSSProperties {
  return {
    padding: '8px 14px',
    borderRadius: 'var(--radius-control)',
    border: `1px solid ${active ? 'var(--accent-financeiro)' : 'var(--border)'}`,
    background: active ? 'var(--accent-financeiro-tint)' : 'var(--surface-2)',
    color: active ? 'var(--accent-financeiro)' : 'var(--text-primary)',
    fontWeight: 500,
    fontSize: 14,
  }
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
