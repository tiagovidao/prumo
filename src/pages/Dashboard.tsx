import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Flame, Smile, Wallet, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { ModuleCard } from '../components/ModuleCard'

type BudgetCategorySummary = {
  name: string
  limit: number
  spent: number
}

export function Dashboard() {
  const { user, signOut } = useAuth()
  const [loading, setLoading] = useState(true)
  const [habitsTotal, setHabitsTotal] = useState(0)
  const [habitsDoneToday, setHabitsDoneToday] = useState(0)
  const [moodRegisteredToday, setMoodRegisteredToday] = useState(false)
  const [categories, setCategories] = useState<BudgetCategorySummary[]>([])

  useEffect(() => {
    if (!user) return

    let cancelled = false

    async function loadDashboard() {
      const today = new Date().toISOString().slice(0, 10)
      const monthStart = new Date()
      monthStart.setDate(1)
      const monthStartStr = monthStart.toISOString().slice(0, 10)

      const [habitsRes, checkinsRes, moodRes, categoriesRes, expensesRes] = await Promise.all([
        supabase.from('habits').select('id').eq('archived', false),
        supabase.from('habit_checkins').select('habit_id').eq('checkin_date', today),
        supabase.from('mood_entries').select('id').eq('entry_date', today).maybeSingle(),
        supabase.from('budget_categories').select('id, name, monthly_limit'),
        supabase.from('expenses').select('category_id, amount').gte('expense_date', monthStartStr),
      ])

      if (cancelled) return

      const categoriesSummary: BudgetCategorySummary[] = (categoriesRes.data ?? []).map((cat) => {
        const spent = (expensesRes.data ?? [])
          .filter((expense) => expense.category_id === cat.id)
          .reduce((sum, expense) => sum + Number(expense.amount), 0)
        return { name: cat.name, limit: Number(cat.monthly_limit), spent }
      })

      setHabitsTotal(habitsRes.data?.length ?? 0)
      setHabitsDoneToday(checkinsRes.data?.length ?? 0)
      setMoodRegisteredToday(!!moodRes.data)
      setCategories(categoriesSummary)
      setLoading(false)
    }

    loadDashboard()

    return () => {
      cancelled = true
    }
  }, [user])

  const metadata = user?.user_metadata ?? {}
  const displayName: string = metadata.full_name ?? metadata.name ?? user?.email ?? ''
  const avatarUrl: string | undefined = metadata.avatar_url ?? metadata.picture

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 'var(--space-5) var(--space-4)' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-5)',
        }}
      >
        <div>
          <h1 style={{ fontSize: 22 }}>Hoje</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>{displayName}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {avatarUrl && (
            <img
              src={avatarUrl}
              alt=""
              width={32}
              height={32}
              style={{ borderRadius: '50%', objectFit: 'cover' }}
            />
          )}
          <button
            onClick={() => signOut()}
            aria-label="Sair"
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', padding: 8 }}
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Carregando…</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Link to="/habitos" style={{ textDecoration: 'none', color: 'inherit' }}>
            <ModuleCard
              accent="habitos"
              icon={<Flame size={20} />}
              title="Hábitos"
              subtitle={
                habitsTotal === 0
                  ? 'Nenhum hábito cadastrado ainda'
                  : `${habitsDoneToday} de ${habitsTotal} concluídos hoje`
              }
            />
          </Link>

          <Link to="/humor" style={{ textDecoration: 'none', color: 'inherit' }}>
            <ModuleCard
              accent="humor"
              icon={<Smile size={20} />}
              title="Como você está hoje?"
              subtitle={moodRegisteredToday ? 'Já registrado' : 'Ainda não registrado'}
            />
          </Link>

          <Link to="/financeiro" style={{ textDecoration: 'none', color: 'inherit' }}>
            <ModuleCard
              accent="financeiro"
              icon={<Wallet size={20} />}
              title="Financeiro"
              subtitle={categories.length === 0 ? 'Nenhuma categoria de orçamento ainda' : 'Orçamento do mês'}
            >
              {categories.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {categories.map((cat) => {
                    const pct = cat.limit > 0 ? Math.min(100, Math.round((cat.spent / cat.limit) * 100)) : 0
                    const nearLimit = pct >= 90
                    return (
                      <div key={cat.name}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: 13,
                            marginBottom: 4,
                          }}
                        >
                          <span>{cat.name}</span>
                          <span style={{ color: nearLimit ? 'var(--danger)' : 'var(--text-secondary)' }}>
                            {pct}%
                          </span>
                        </div>
                        <div
                          style={{
                            height: 6,
                            background: 'var(--surface-2)',
                            borderRadius: 4,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${pct}%`,
                              height: '100%',
                              background: nearLimit ? 'var(--danger)' : 'var(--accent-financeiro)',
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </ModuleCard>
          </Link>
        </div>
      )}
    </div>
  )
}
