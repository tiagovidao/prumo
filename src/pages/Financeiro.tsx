import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { formatDateOnly, parseDateOnly, startOfMonth, todayDateOnly } from '../lib/dates'
import { categorySpent, formatCurrency, type BudgetCategory, type Expense } from '../lib/finance'
import { ErrorBanner } from '../components/ErrorBanner'
import { CategoryCard } from '../components/CategoryCard'
import { CategoryFormModal, type CategoryFormValues } from '../components/CategoryFormModal'
import { ExpenseFormModal, type ExpenseFormValues } from '../components/ExpenseFormModal'
import { ExpenseItem } from '../components/ExpenseItem'

const GENERIC_LOAD_ERROR = 'Não foi possível carregar seus dados financeiros. Verifique sua conexão e tente novamente.'
const GENERIC_SAVE_CATEGORY_ERROR = 'Não foi possível salvar a categoria. Tente novamente.'
const GENERIC_ARCHIVE_CATEGORY_ERROR = 'Não foi possível arquivar a categoria. Tente novamente.'
const GENERIC_SAVE_EXPENSE_ERROR = 'Não foi possível registrar o gasto. Tente novamente.'
const GENERIC_DELETE_EXPENSE_ERROR = 'Não foi possível excluir o gasto. Tente novamente.'

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function formatExpenseDate(dateStr: string): string {
  return capitalize(parseDateOnly(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }))
}

export function Financeiro() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [listError, setListError] = useState<string | null>(null)

  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null)
  const [savingCategory, setSavingCategory] = useState(false)
  const [categoryFormError, setCategoryFormError] = useState<string | null>(null)
  const [busyCategoryId, setBusyCategoryId] = useState<string | null>(null)

  const [expenseModalOpen, setExpenseModalOpen] = useState(false)
  const [savingExpense, setSavingExpense] = useState(false)
  const [expenseFormError, setExpenseFormError] = useState<string | null>(null)
  const [busyExpenseId, setBusyExpenseId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!user) return

    const monthStartStr = formatDateOnly(startOfMonth())

    const [categoriesRes, expensesRes] = await Promise.all([
      supabase.from('budget_categories').select('*').order('created_at', { ascending: true }),
      supabase
        .from('expenses')
        .select('*')
        .gte('expense_date', monthStartStr)
        .order('expense_date', { ascending: false })
        .order('created_at', { ascending: false }),
    ])

    if (categoriesRes.error || expensesRes.error) {
      setListError(GENERIC_LOAD_ERROR)
      setLoading(false)
      return
    }

    setCategories(categoriesRes.data ?? [])
    setExpenses(expensesRes.data ?? [])
    setListError(null)
    setLoading(false)
  }, [user])

  useEffect(() => {
    loadData()
  }, [loadData])

  // categories guarda todas (inclusive arquivadas) — precisamos delas pra manter o nome nos gastos
  // antigos. As telas de categoria/seletor de gasto só mostram as ativas.
  const activeCategories = categories.filter((category) => !category.archived)

  // Categorias ativas com o gasto do mês já calculado — usado no card e no formulário de gasto.
  const categoriesWithSpent = activeCategories.map((category) => ({
    ...category,
    spent: categorySpent(category.id, expenses),
  }))

  // Soma de todos os gastos do mês, independente da categoria estar arquivada ou não —
  // o dinheiro foi gasto de qualquer forma. O limite, por outro lado, só considera o
  // orçamento configurado hoje (categorias arquivadas não fazem mais parte do orçamento).
  const totalSpent = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
  const totalLimit = categoriesWithSpent.reduce((sum, c) => sum + Number(c.monthly_limit), 0)

  function openCreateCategoryModal() {
    setEditingCategory(null)
    setCategoryFormError(null)
    setCategoryModalOpen(true)
  }

  function openEditCategoryModal(category: BudgetCategory) {
    setEditingCategory(category)
    setCategoryFormError(null)
    setCategoryModalOpen(true)
  }

  async function handleSaveCategory(values: CategoryFormValues) {
    if (!user) return
    setSavingCategory(true)
    setCategoryFormError(null)

    const payload = { name: values.name, monthly_limit: values.monthlyLimit }

    const { error } = editingCategory
      ? await supabase.from('budget_categories').update(payload).eq('id', editingCategory.id)
      : await supabase.from('budget_categories').insert({ ...payload, user_id: user.id })

    setSavingCategory(false)

    if (error) {
      setCategoryFormError(GENERIC_SAVE_CATEGORY_ERROR)
      return
    }

    setCategoryModalOpen(false)
    setEditingCategory(null)
    await loadData()
  }

  async function handleArchiveCategory(category: BudgetCategory) {
    const confirmed = window.confirm(
      `Arquivar "${category.name}"? Ela sai da lista, mas o histórico de gastos continua mostrando o nome dela.`,
    )
    if (!confirmed) return

    setBusyCategoryId(category.id)
    setListError(null)

    const { error } = await supabase.from('budget_categories').update({ archived: true }).eq('id', category.id)

    if (error) {
      setListError(GENERIC_ARCHIVE_CATEGORY_ERROR)
      setBusyCategoryId(null)
      return
    }

    await loadData()
    setBusyCategoryId(null)
  }

  async function handleSaveExpense(values: ExpenseFormValues) {
    if (!user) return
    setSavingExpense(true)
    setExpenseFormError(null)

    const { error } = await supabase.from('expenses').insert({
      user_id: user.id,
      category_id: values.categoryId,
      amount: values.amount,
      description: values.description === '' ? null : values.description,
      expense_date: values.expenseDate,
      reflection_note: values.reflectionNote === '' ? null : values.reflectionNote,
    })

    setSavingExpense(false)

    if (error) {
      setExpenseFormError(GENERIC_SAVE_EXPENSE_ERROR)
      return
    }

    setExpenseModalOpen(false)
    await loadData()
  }

  async function handleDeleteExpense(expense: Expense) {
    const confirmed = window.confirm('Excluir este gasto?')
    if (!confirmed) return

    setBusyExpenseId(expense.id)
    setListError(null)

    const { error } = await supabase.from('expenses').delete().eq('id', expense.id)

    if (error) {
      setListError(GENERIC_DELETE_EXPENSE_ERROR)
      setBusyExpenseId(null)
      return
    }

    await loadData()
    setBusyExpenseId(null)
  }

  function categoryName(categoryId: string | null): string {
    if (!categoryId) return 'Sem categoria'
    return categories.find((c) => c.id === categoryId)?.name ?? 'Categoria excluída'
  }

  const monthLabel = capitalize(todayDateOnly().toLocaleDateString('pt-BR', { month: 'long' }))

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 'var(--space-5) var(--space-4)' }}>
      <Link to="/" style={backLinkStyle}>
        <ArrowLeft size={16} />
        Hoje
      </Link>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-1)',
        }}
      >
        <h1 style={{ fontSize: 22, color: 'var(--accent-financeiro)' }}>Financeiro</h1>
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 'var(--space-5)' }}>
        {categoriesWithSpent.length > 0
          ? `${monthLabel}: ${formatCurrency(totalSpent)} de ${formatCurrency(totalLimit)}`
          : monthLabel}
      </p>

      {listError && <ErrorBanner message={listError} onDismiss={() => setListError(null)} />}

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Carregando…</p>
      ) : (
        <>
          <section style={{ marginBottom: 'var(--space-6)' }}>
            <div style={sectionHeaderStyle}>
              <h2 style={sectionTitleStyle}>Categorias</h2>
              <button onClick={openCreateCategoryModal} style={addButtonStyle}>
                <Plus size={16} />
                Nova
              </button>
            </div>

            {categoriesWithSpent.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                Nenhuma categoria de orçamento ainda. Crie uma para começar a registrar gastos.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {categoriesWithSpent.map((category) => (
                  <CategoryCard
                    key={category.id}
                    name={category.name}
                    spent={category.spent}
                    limit={Number(category.monthly_limit)}
                    onEdit={() => openEditCategoryModal(category)}
                    onArchive={() => handleArchiveCategory(category)}
                    busy={busyCategoryId === category.id}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <div style={sectionHeaderStyle}>
              <h2 style={sectionTitleStyle}>Gastos deste mês</h2>
              <button
                onClick={() => {
                  setExpenseFormError(null)
                  setExpenseModalOpen(true)
                }}
                disabled={categoriesWithSpent.length === 0}
                style={addButtonStyle}
              >
                <Plus size={16} />
                Novo
              </button>
            </div>

            {categoriesWithSpent.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                Crie uma categoria primeiro para poder registrar um gasto.
              </p>
            ) : expenses.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                Nenhum gasto registrado neste mês ainda.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {expenses.map((expense) => (
                  <ExpenseItem
                    key={expense.id}
                    categoryName={categoryName(expense.category_id)}
                    amount={Number(expense.amount)}
                    description={expense.description}
                    dateLabel={formatExpenseDate(expense.expense_date)}
                    reflectionNote={expense.reflection_note}
                    onDelete={() => handleDeleteExpense(expense)}
                    busy={busyExpenseId === expense.id}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {categoryModalOpen && (
        <CategoryFormModal
          initialValues={
            editingCategory
              ? { name: editingCategory.name, monthlyLimit: Number(editingCategory.monthly_limit) }
              : undefined
          }
          onSubmit={handleSaveCategory}
          onClose={() => {
            setCategoryModalOpen(false)
            setEditingCategory(null)
          }}
          submitting={savingCategory}
          submitError={categoryFormError}
        />
      )}

      {expenseModalOpen && (
        <ExpenseFormModal
          categories={categoriesWithSpent.map((c) => ({
            id: c.id,
            name: c.name,
            spent: c.spent,
            monthlyLimit: Number(c.monthly_limit),
          }))}
          onSubmit={handleSaveExpense}
          onClose={() => setExpenseModalOpen(false)}
          submitting={savingExpense}
          submitError={expenseFormError}
        />
      )}
    </div>
  )
}

const backLinkStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  color: 'var(--text-secondary)',
  textDecoration: 'none',
  fontSize: 14,
  marginBottom: 'var(--space-5)',
}

const sectionHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 'var(--space-3)',
}

const sectionTitleStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: 'var(--text-primary)',
  margin: 0,
}

const addButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '8px 12px',
  borderRadius: 'var(--radius-control)',
  border: 'none',
  background: 'var(--accent-financeiro-tint)',
  color: 'var(--accent-financeiro)',
  fontWeight: 500,
  fontSize: 13,
}
