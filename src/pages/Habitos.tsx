import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
  calculateConsistency,
  calculateStreak,
  formatDateOnly,
  isDueOn,
  todayDateOnly,
  type Habit,
  type HabitCheckin,
} from '../lib/habitStats'
import { HabitCard } from '../components/HabitCard'
import { HabitFormModal, type HabitFormValues } from '../components/HabitFormModal'

const GENERIC_LOAD_ERROR = 'Não foi possível carregar seus hábitos. Verifique sua conexão e tente novamente.'
const GENERIC_CHECKIN_ERROR = 'Não foi possível registrar o check-in. Tente novamente.'
const GENERIC_ARCHIVE_ERROR = 'Não foi possível arquivar o hábito. Tente novamente.'
const GENERIC_SAVE_ERROR = 'Não foi possível salvar o hábito. Tente novamente.'

export function Habitos() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [habits, setHabits] = useState<Habit[]>([])
  const [checkinsByHabit, setCheckinsByHabit] = useState<Record<string, HabitCheckin[]>>({})
  const [modalOpen, setModalOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [saving, setSaving] = useState(false)
  const [busyHabitId, setBusyHabitId] = useState<string | null>(null)
  const [listError, setListError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const loadHabits = useCallback(async () => {
    if (!user) return

    const { data: habitsData, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .eq('archived', false)
      .order('created_at', { ascending: true })

    if (habitsError) {
      setListError(GENERIC_LOAD_ERROR)
      setLoading(false)
      return
    }

    const habitIds = (habitsData ?? []).map((h) => h.id)

    const { data: checkinsData, error: checkinsError } =
      habitIds.length > 0
        ? await supabase.from('habit_checkins').select('*').in('habit_id', habitIds)
        : { data: [], error: null }

    if (checkinsError) {
      setListError(GENERIC_LOAD_ERROR)
      setLoading(false)
      return
    }

    const grouped: Record<string, HabitCheckin[]> = {}
    for (const checkin of checkinsData ?? []) {
      if (!grouped[checkin.habit_id]) grouped[checkin.habit_id] = []
      grouped[checkin.habit_id].push(checkin)
    }

    setHabits(habitsData ?? [])
    setCheckinsByHabit(grouped)
    setListError(null)
    setLoading(false)
  }, [user])

  useEffect(() => {
    loadHabits()
  }, [loadHabits])

  async function handleToggleCheckin(habit: Habit) {
    if (!user) return
    const today = formatDateOnly(todayDateOnly())
    const existing = checkinsByHabit[habit.id]?.find((c) => c.checkin_date === today)

    setBusyHabitId(habit.id)
    setListError(null)

    const { error: mutationError } = existing
      ? await supabase.from('habit_checkins').delete().eq('id', existing.id)
      : await supabase.from('habit_checkins').insert({
          habit_id: habit.id,
          user_id: user.id,
          checkin_date: today,
        })

    if (mutationError) {
      setListError(GENERIC_CHECKIN_ERROR)
      setBusyHabitId(null)
      return
    }

    await loadHabits()
    setBusyHabitId(null)
  }

  async function handleCreateOrEdit(values: HabitFormValues) {
    if (!user) return
    setSaving(true)
    setFormError(null)

    const payload = {
      name: values.name,
      frequency_type: values.frequencyType,
      frequency_days: values.frequencyType === 'weekly_days' ? values.frequencyDays : null,
    }

    const { error: mutationError } = editingHabit
      ? await supabase.from('habits').update(payload).eq('id', editingHabit.id)
      : await supabase.from('habits').insert({ ...payload, user_id: user.id })

    setSaving(false)

    if (mutationError) {
      setFormError(GENERIC_SAVE_ERROR)
      return
    }

    setModalOpen(false)
    setEditingHabit(null)
    await loadHabits()
  }

  async function handleArchive(habit: Habit) {
    const confirmed = window.confirm(`Arquivar "${habit.name}"? Ele sai da lista, mas o histórico é mantido.`)
    if (!confirmed) return

    setBusyHabitId(habit.id)
    setListError(null)

    const { error: mutationError } = await supabase.from('habits').update({ archived: true }).eq('id', habit.id)

    if (mutationError) {
      setListError(GENERIC_ARCHIVE_ERROR)
      setBusyHabitId(null)
      return
    }

    await loadHabits()
    setBusyHabitId(null)
  }

  function openCreateModal() {
    setEditingHabit(null)
    setFormError(null)
    setModalOpen(true)
  }

  function openEditModal(habit: Habit) {
    setEditingHabit(habit)
    setFormError(null)
    setModalOpen(true)
  }

  const today = todayDateOnly()
  const todayStr = formatDateOnly(today)

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

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-5)',
        }}
      >
        <h1 style={{ fontSize: 22, color: 'var(--accent-habitos)' }}>Hábitos</h1>
        <button onClick={openCreateModal} style={addButtonStyle}>
          <Plus size={16} />
          Novo
        </button>
      </div>

      {listError && (
        <div style={errorBannerStyle}>
          <p style={{ margin: 0, fontSize: 13 }}>{listError}</p>
          <button onClick={() => setListError(null)} aria-label="Fechar aviso" style={iconButtonStyle}>
            <X size={14} />
          </button>
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Carregando…</p>
      ) : habits.length === 0 && !listError ? (
        <p style={{ color: 'var(--text-secondary)' }}>
          Nenhum hábito cadastrado ainda. Toque em "Novo" para criar o primeiro.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {habits.map((habit) => {
            const checkinDates = new Set((checkinsByHabit[habit.id] ?? []).map((c) => c.checkin_date))
            return (
              <HabitCard
                key={habit.id}
                name={habit.name}
                streak={calculateStreak(habit, checkinDates, today)}
                consistency={calculateConsistency(habit, checkinDates, today)}
                dueToday={isDueOn(habit, today)}
                checkedToday={checkinDates.has(todayStr)}
                onToggleCheckin={() => handleToggleCheckin(habit)}
                onEdit={() => openEditModal(habit)}
                onArchive={() => handleArchive(habit)}
                busy={busyHabitId === habit.id}
              />
            )
          })}
        </div>
      )}

      {modalOpen && (
        <HabitFormModal
          initialValues={
            editingHabit
              ? {
                  name: editingHabit.name,
                  frequencyType: editingHabit.frequency_type,
                  frequencyDays: editingHabit.frequency_days ?? [],
                }
              : undefined
          }
          onSubmit={handleCreateOrEdit}
          onClose={() => {
            setModalOpen(false)
            setEditingHabit(null)
          }}
          submitting={saving}
          submitError={formError}
        />
      )}
    </div>
  )
}

const addButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '8px 12px',
  borderRadius: 'var(--radius-control)',
  border: 'none',
  background: 'var(--accent-habitos-tint)',
  color: 'var(--accent-habitos)',
  fontWeight: 500,
  fontSize: 13,
}

const errorBannerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 'var(--space-2)',
  background: 'var(--danger-tint)',
  color: 'var(--danger)',
  borderRadius: 'var(--radius-control)',
  padding: '10px 12px',
  marginBottom: 'var(--space-4)',
}

const iconButtonStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--danger)',
  padding: 4,
  flexShrink: 0,
}
