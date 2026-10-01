export type BudgetCategory = {
  id: string
  user_id: string
  name: string
  monthly_limit: number
  archived: boolean
  created_at: string
}

export type Expense = {
  id: string
  user_id: string
  category_id: string | null
  amount: number
  description: string | null
  expense_date: string
  reflection_note: string | null
  created_at: string
}

export const DESCRIPTION_MAX_LENGTH = 200
export const REFLECTION_MAX_LENGTH = 500

/** Percentual a partir do qual mostramos o alerta proativo (antes de estourar). */
export const NEAR_LIMIT_THRESHOLD = 90

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value)
}

/** Soma dos gastos de uma categoria dentro de uma lista de despesas já filtrada por período. */
export function categorySpent(categoryId: string, expenses: Pick<Expense, 'category_id' | 'amount'>[]): number {
  return expenses
    .filter((expense) => expense.category_id === categoryId)
    .reduce((sum, expense) => sum + Number(expense.amount), 0)
}

/** % do limite já usado. Categoria sem limite definido (0) não tem percentual — evita divisão por zero. */
export function budgetPercentage(spent: number, limit: number): number {
  if (limit <= 0) return 0
  return Math.round((spent / limit) * 100)
}

/**
 * Converte texto digitado em reais para número, aceitando os dois formatos comuns no Brasil:
 * "1500,00" / "1.500,00" (vírgula decimal, ponto de milhar) e "1500.00" (ponto decimal, sem milhar).
 * Retorna NaN se o texto não for um valor válido — quem chama decide como tratar isso.
 */
export function parseCurrencyInput(raw: string): number {
  const trimmed = raw.trim()
  if (trimmed === '') return NaN

  // Havendo vírgula, ela é o separador decimal; qualquer ponto antes dela é separador de milhar.
  if (trimmed.includes(',')) {
    return Number(trimmed.replace(/\./g, '').replace(',', '.'))
  }

  return Number(trimmed)
}
