'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Quest, Area, MissionCompletion } from '@/lib/types/database.types'
import { createClient } from '@/lib/supabase/client'
import { questAppearsOnDate } from '@/lib/utils/streak'
import { DIFFICULTY_LABELS } from '@/lib/utils/attributes'
import { DIFFICULTY_XP, DIFFICULTY_GOLD } from '@/lib/utils/xp'

interface Props {
  quests: Quest[]
  areas: Area[]
  completions: MissionCompletion[]
  userId: string
  today: string
}

type ViewMode = 'list' | 'month'

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DAY_NAMES   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

const RECURRENCE_OPTIONS = [
  { key: 'none',    label: '🏆 Una vez'  },
  { key: 'daily',   label: '☀️ Diaria'   },
  { key: 'weekly',  label: '📅 Semanal'  },
  { key: 'monthly', label: '🌙 Mensual'  },
]
const DIFFICULTY_OPTIONS = ['facil','media','dificil','epica']
const PRIORITY_OPTIONS = [
  { key: 'low',    label: 'Ascua menor',      emoji: '🕯️', color: '#7ec8e3' },
  { key: 'medium', label: 'Llama sagrada',    emoji: '🔥', color: '#d4af37' },
  { key: 'high',   label: 'Fuego del Olimpo', emoji: '⚡', color: '#ff6b35' },
]

const EMPTY_CREATE = { name: '', area_id: '', difficulty: 'media', priority: 'medium', recurrence_type: 'none' }

export default function CalendarClient({ quests: initQuests, areas, completions: initComp, userId, today }: Props) {
  const router = useRouter()
  const sb = createClient()

  const todayDate = new Date(today + 'T12:00:00')
  const [view, setView]               = useState<ViewMode>('list')
  const [quests, setQuests]           = useState<Quest[]>(initQuests)
  const [completions, setCompletions] = useState<MissionCompletion[]>(initComp)
  const [completing, setCompleting]   = useState<string|null>(null)
  const [toast, setToast]             = useState('')
  const [selectedDate, setSelectedDate] = useState<string>(today)

  // Create-from-day modal
  const [createDate, setCreateDate]   = useState<string>('')
  const [showCreate, setShowCreate]   = useState(false)
  const [createForm, setCreateForm]   = useState(EMPTY_CREATE)
  const [creating, setCreating]       = useState(false)
  const [createErr, setCreateErr]     = useState('')

  const [monthYear, setMonthYear] = useState({ year: todayDate.getFullYear(), month: todayDate.getMonth() })

  function showToast(m: string) { setToast(m); setTimeout(() => setToast(''), 3000) }

  function openCreateModal(date: string) {
    setCreateDate(date)
    setCreateForm(EMPTY_CREATE)
    setCreateErr('')
    setShowCreate(true)
  }
  const closeCreate = useCallback(() => { setShowCreate(false); setCreating(false); setCreateErr('') }, [])

  async function saveNewQuest() {
    if (!createForm.name.trim()) { setCreateErr('El nombre es obligatorio.'); return }
    if (creating) return
    setCreating(true); setCreateErr('')

    const area = areas.find(a => a.id === createForm.area_id)
    const freqMap: Record<string, string> = { none: 'unica', daily: 'diaria', weekly: 'semanal', monthly: 'mensual' }
    const xp   = DIFFICULTY_XP[createForm.difficulty] ?? 60
    const gold = DIFFICULTY_GOLD[createForm.difficulty] ?? 10

    const payload = {
      user_id: userId,
      name: createForm.name.trim(),
      description: null,
      area_id: createForm.area_id || null,
      category: area?.name?.toLowerCase().replace(/\s/g,'_') ?? 'general',
      difficulty: createForm.difficulty,
      frequency: freqMap[createForm.recurrence_type] ?? 'unica',
      recurrence_type: createForm.recurrence_type,
      recurrence_days: [],
      start_date: createDate,
      end_date: null,
      xp_reward: xp,
      gold_reward: gold,
      attribute_bonus: area?.attribute ?? 'discipline',
      priority: createForm.priority,
    }

    try {
      const { data, error } = await sb.from('quests').insert([payload as never]).select().single()
      if (error) {
        if (error.code === '42P01') setCreateErr('⚠️ Ejecutá las migraciones SQL en Supabase.')
        else setCreateErr(error.message)
        setCreating(false); return
      }
      if (data) setQuests(prev => [data as Quest, ...prev])
      showToast(`📜 Misión creada para ${formatShort(createDate)}`)
      closeCreate()
      router.refresh()
    } catch { setCreateErr('Error de conexión'); setCreating(false) }
  }

  function isCompleted(questId: string, date: string) {
    return completions.some(c => c.quest_id === questId && c.completed_date === date)
  }

  function getAreaIcon(areaId: string | null) {
    if (!areaId) return '📋'
    return areas.find(a => a.id === areaId)?.icon ?? '📋'
  }
  function getAreaName(areaId: string | null) {
    if (!areaId) return null
    return areas.find(a => a.id === areaId)?.name ?? null
  }

  async function completeOnDate(quest: Quest, date: string) {
    const key = `${quest.id}__${date}`
    if (completing === key || isCompleted(quest.id, date)) return
    setCompleting(key)
    try {
      const { data, error } = await sb.from('mission_completions').insert([{
        user_id: userId, quest_id: quest.id, completed_date: date,
        xp_earned: quest.xp_reward, gold_earned: quest.gold_reward,
      }] as never).select().single()
      if (error) {
        if (error.code === '23505') showToast('Ya estaba completada para ese día')
        else if (error.code === '42P01') showToast('⚠️ Ejecutá las migraciones SQL en Supabase')
        else showToast('Error: ' + error.message)
      } else if (data) {
        setCompletions(p => [...p, data as MissionCompletion])
        showToast(`✅ +${quest.xp_reward} XP · +${quest.gold_reward} 💰`)
        router.refresh()
      }
    } catch { showToast('Error de conexión') }
    setCompleting(null)
  }

  async function uncompleteOnDate(quest: Quest, date: string) {
    await sb.from('mission_completions').delete().eq('user_id', userId).eq('quest_id', quest.id).eq('completed_date', date)
    setCompletions(p => p.filter(c => !(c.quest_id === quest.id && c.completed_date === date)))
    showToast('↩️ Desmarcada')
  }

  function getNext14Days(): string[] {
    const days: string[] = []
    for (let i = 0; i < 14; i++) {
      const d = new Date(today + 'T12:00:00')
      d.setDate(d.getDate() + i)
      days.push(d.toISOString().slice(0, 10))
    }
    return days
  }

  function questsForDate(date: string) {
    return quests.filter(q => questAppearsOnDate(q, date))
  }

  function formatDate(dateS: string) {
    const d = new Date(dateS + 'T12:00:00')
    return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Argentina/Buenos_Aires' })
  }
  function formatShort(dateS: string) {
    const d = new Date(dateS + 'T12:00:00')
    return d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'America/Argentina/Buenos_Aires' })
  }

  function QuestDetailRow({ quest, date }: { quest: Quest; date: string }) {
    const done = isCompleted(quest.id, date)
    const cKey = `${quest.id}__${date}`
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <button
          onClick={() => done ? uncompleteOnDate(quest, date) : completeOnDate(quest, date)}
          disabled={completing === cKey}
          title={done ? 'Click para desmarcar' : 'Click para completar'}
          style={{
            width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
            border: `2px solid ${done ? 'var(--success)' : 'rgba(212,175,55,0.45)'}`,
            background: done ? 'var(--success)' : 'transparent',
            cursor: 'pointer', color: done ? '#000' : 'transparent',
            fontSize: '1rem', fontWeight: 'bold', transition: 'var(--transition)',
          }}
          onMouseEnter={e => { if (!done) (e.currentTarget).style.background = 'rgba(212,175,55,0.18)' }}
          onMouseLeave={e => { if (!done) (e.currentTarget).style.background = 'transparent' }}
        >{completing === cKey ? '⏳' : done ? '✓' : ''}</button>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: '0.92rem', color: done ? 'var(--text-secondary)' : 'var(--text-primary)', textDecoration: done ? 'line-through' : 'none', fontWeight: 500 }}>
            {quest.name}
          </span>
          {quest.area_id && (
            <span style={{ marginLeft: '8px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {getAreaIcon(quest.area_id)} {getAreaName(quest.area_id)}
            </span>
          )}
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-gold)', flexShrink: 0 }}>+{quest.xp_reward} XP</span>
      </div>
    )
  }

  // ─────────── VISTA LISTA 14 DÍAS ───────────────────
  function ListView() {
    const days = getNext14Days()
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {days.map(day => {
          const dayQuests = questsForDate(day)
          const isToday   = day === today
          const dayDate   = new Date(day + 'T12:00:00')
          const weekday   = dayDate.toLocaleDateString('es-AR', { weekday: 'short', timeZone: 'America/Argentina/Buenos_Aires' })
          const dayNum    = dayDate.getDate()
          const monthStr  = dayDate.toLocaleDateString('es-AR', { month: 'short', timeZone: 'America/Argentina/Buenos_Aires' })

          return (
            <div key={day} style={{ borderRadius: '12px', border: `1px solid ${isToday ? 'rgba(212,175,55,0.45)' : 'rgba(255,255,255,0.07)'}`, background: isToday ? 'rgba(212,175,55,0.04)' : 'rgba(13,19,43,0.5)', overflow: 'hidden' }}>
              {/* Cabecera del día */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 18px', borderBottom: dayQuests.length > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none', background: isToday ? 'rgba(212,175,55,0.06)' : 'transparent' }}>
                <div style={{ textAlign: 'center', minWidth: '40px' }}>
                  <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.6rem', color: isToday ? 'var(--gold)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{weekday}</div>
                  <div style={{ fontFamily: 'Cinzel, serif', fontSize: '1.5rem', color: isToday ? 'var(--gold-bright)' : 'var(--text-primary)', lineHeight: 1.1, fontWeight: 700 }}>{dayNum}</div>
                  <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.58rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{monthStr}</div>
                </div>
                <div style={{ flex: 1 }}>
                  {isToday && <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.68rem', color: 'var(--gold)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>⚡ HOY</span>}
                  {dayQuests.length > 0 && (
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: isToday ? '4px' : 0 }}>
                      {dayQuests.slice(0, 4).map(q => (
                        <span key={q.id} style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '12px', background: isCompleted(q.id, day) ? 'rgba(0,230,118,0.12)' : 'rgba(255,255,255,0.06)', border: `1px solid ${isCompleted(q.id, day) ? 'rgba(0,230,118,0.3)' : 'rgba(255,255,255,0.10)'}`, color: isCompleted(q.id, day) ? 'var(--success)' : 'var(--text-secondary)' }}>
                          {isCompleted(q.id, day) ? '✓ ' : ''}{q.name}
                        </span>
                      ))}
                      {dayQuests.length > 4 && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', padding: '2px 6px' }}>+{dayQuests.length - 4} más</span>}
                    </div>
                  )}
                  {dayQuests.length === 0 && <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin misiones</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.72rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.04)', padding: '3px 9px', borderRadius: '8px' }}>
                    {dayQuests.filter(q => isCompleted(q.id, day)).length}/{dayQuests.length}
                  </span>
                  <button onClick={() => openCreateModal(day)}
                    title="Crear misión para este día"
                    style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)', color: 'var(--text-gold)', borderRadius: '6px', cursor: 'pointer', padding: '4px 10px', fontSize: '0.8rem', transition: 'var(--transition)', flexShrink: 0 }}
                    onMouseEnter={e => { (e.currentTarget).style.background = 'rgba(212,175,55,0.16)' }}
                    onMouseLeave={e => { (e.currentTarget).style.background = 'rgba(212,175,55,0.08)' }}
                  >+ Misión</button>
                </div>
              </div>

              {/* Misiones del día */}
              {dayQuests.length > 0 && (
                <div style={{ padding: '4px 18px' }}>
                  {dayQuests.map(quest => <QuestDetailRow key={quest.id} quest={quest} date={day} />)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // ─────────── VISTA MENSUAL ───────────────────
  function MonthView() {
    const { year, month } = monthYear
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    function dStr(d: number) { return `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}` }

    const cells: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)

    function prevMonth() { setMonthYear(p => p.month === 0 ? { year: p.year-1, month: 11 } : { ...p, month: p.month-1 }) }
    function nextMonth() { setMonthYear(p => p.month === 11 ? { year: p.year+1, month: 0 } : { ...p, month: p.month+1 }) }

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <button onClick={prevMonth} className="btn-ghost" style={{ padding: '8px 16px' }}>← Anterior</button>
          <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.2rem', color: 'var(--text-gold)' }}>
            {MONTH_NAMES[month]} {year}
          </h3>
          <button onClick={nextMonth} className="btn-ghost" style={{ padding: '8px 16px' }}>Siguiente →</button>
        </div>

        {/* Cabecera días */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px', marginBottom: '3px' }}>
          {DAY_NAMES.map(d => (
            <div key={d} style={{ textAlign: 'center', fontFamily: 'Cinzel, serif', fontSize: '0.62rem', color: 'var(--text-muted)', padding: '6px 0', letterSpacing: '0.04em' }}>{d}</div>
          ))}
        </div>

        {/* Grilla */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
          {cells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} />
            const date = dStr(day)
            const dayQuests  = questsForDate(date)
            const completed  = dayQuests.filter(q => isCompleted(q.id, date))
            const isToday    = date === today
            const isPast     = date < today
            const isSelected = date === selectedDate
            const allDone    = dayQuests.length > 0 && completed.length === dayQuests.length

            return (
              <button key={date} onClick={() => setSelectedDate(date)}
                style={{
                  padding: '6px 3px', borderRadius: '8px', minHeight: '60px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                  cursor: 'pointer', transition: 'all 0.2s',
                  background: isToday ? 'rgba(212,175,55,0.12)' : isSelected ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                  border: `2px solid ${isToday ? 'var(--gold)' : isSelected ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.05)'}`,
                  opacity: isPast && !isToday ? 0.55 : 1,
                }}
                onMouseEnter={e => { (e.currentTarget).style.background = 'rgba(212,175,55,0.06)'; (e.currentTarget).style.borderColor = 'rgba(212,175,55,0.3)' }}
                onMouseLeave={e => { (e.currentTarget).style.background = isToday ? 'rgba(212,175,55,0.12)' : isSelected ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)'; (e.currentTarget).style.borderColor = isToday ? 'var(--gold)' : isSelected ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.05)' }}
              >
                <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.88rem', fontWeight: isToday ? 700 : 400, color: isToday ? 'var(--gold-bright)' : 'var(--text-primary)' }}>
                  {day}
                </span>
                {dayQuests.length > 0 && (
                  <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {dayQuests.slice(0, 5).map((q, i) => (
                      <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: isCompleted(q.id, date) ? 'var(--success)' : 'var(--gold)', opacity: isCompleted(q.id, date) ? 1 : 0.55 }} />
                    ))}
                  </div>
                )}
                {dayQuests.length > 0 && (
                  <span style={{ fontSize: '0.55rem', color: allDone ? 'var(--success)' : 'var(--text-muted)', fontFamily: 'Cinzel, serif' }}>
                    {completed.length}/{dayQuests.length}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Panel del día seleccionado */}
        {selectedDate && (
          <div style={{ marginTop: '16px', padding: '20px', borderRadius: '12px', background: 'rgba(13,19,43,0.7)', border: '1px solid rgba(212,175,55,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <h4 style={{ fontFamily: 'Cinzel, serif', fontSize: '0.95rem', color: 'var(--text-gold)', textTransform: 'capitalize' }}>
                📅 {formatDate(selectedDate)}
              </h4>
              <button onClick={() => openCreateModal(selectedDate)}
                style={{ padding: '6px 14px', borderRadius: '6px', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', color: 'var(--text-gold)', cursor: 'pointer', fontFamily: 'Cinzel, serif', fontSize: '0.72rem', transition: 'var(--transition)' }}
                onMouseEnter={e => (e.currentTarget).style.background = 'rgba(212,175,55,0.2)'}
                onMouseLeave={e => (e.currentTarget).style.background = 'rgba(212,175,55,0.1)'}
              >+ Nueva misión aquí</button>
            </div>
            {questsForDate(selectedDate).length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>Sin misiones para este día. ¡Creá una!</p>
            ) : (
              <div>
                {questsForDate(selectedDate).map(quest => <QuestDetailRow key={quest.id} quest={quest} date={selectedDate} />)}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const totalToday = questsForDate(today).length
  const doneToday  = questsForDate(today).filter(q => isCompleted(q.id, today)).length

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {toast && <div className="toast">{toast}</div>}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.8rem', color: 'var(--text-primary)', letterSpacing: '1px' }}>🗓️ Calendario</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Hoy: {doneToday}/{totalToday} misiones completadas
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => openCreateModal(today)} className="btn-gold">+ Misión hoy</button>
          <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(212,175,55,0.2)' }}>
            <button onClick={() => setView('list')}
              style={{ padding: '8px 16px', fontFamily: 'Cinzel, serif', fontSize: '0.78rem', cursor: 'pointer', border: 'none', transition: 'var(--transition)', background: view === 'list' ? 'rgba(212,175,55,0.20)' : 'transparent', color: view === 'list' ? 'var(--gold-bright)' : 'var(--text-secondary)' }}>
              📋 14 días
            </button>
            <button onClick={() => setView('month')}
              style={{ padding: '8px 16px', fontFamily: 'Cinzel, serif', fontSize: '0.78rem', cursor: 'pointer', border: 'none', transition: 'var(--transition)', background: view === 'month' ? 'rgba(212,175,55,0.20)' : 'transparent', color: view === 'month' ? 'var(--gold-bright)' : 'var(--text-secondary)', borderLeft: '1px solid rgba(212,175,55,0.2)' }}>
              🗓️ Mes
            </button>
          </div>
        </div>
      </div>

      {/* Vista */}
      {view === 'list' ? <ListView /> : <MonthView />}

      {/* ── MODAL: crear misión desde día ── */}
      {showCreate && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) closeCreate() }}>
          <div className="modal-box" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.3rem', color: 'var(--text-gold)' }}>+ Nueva Misión</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px', textTransform: 'capitalize' }}>
                  📅 {formatDate(createDate)}
                </p>
              </div>
              <button onClick={closeCreate}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.6rem', cursor: 'pointer', transition: 'var(--transition)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >✕</button>
            </div>

            <div className="form-group">
              <label>Nombre *</label>
              <input type="text" className="input-parch" value={createForm.name}
                onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ej: Meditar 20 minutos..." maxLength={80} autoFocus />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Santuario / Área</label>
                <select className="select-parch" value={createForm.area_id} onChange={e => setCreateForm(f => ({ ...f, area_id: e.target.value }))}>
                  <option value="">Sin área</option>
                  {areas.map(a => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Dificultad</label>
                <select className="select-parch" value={createForm.difficulty} onChange={e => setCreateForm(f => ({ ...f, difficulty: e.target.value }))}>
                  {DIFFICULTY_OPTIONS.map(k => <option key={k} value={k}>{DIFFICULTY_LABELS[k]}</option>)}
                </select>
              </div>
            </div>

            {/* Prioridad */}
            <div className="form-group" style={{ marginTop: '16px' }}>
              <label>⚡ Fuego del Olimpo <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.75rem' }}>(prioridad)</span></label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {PRIORITY_OPTIONS.map(p => (
                  <button key={p.key} type="button"
                    onClick={() => setCreateForm(f => ({ ...f, priority: p.key }))}
                    style={{ padding: '9px 6px', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', fontFamily: 'Cinzel, serif', fontSize: '0.72rem', letterSpacing: '0.04em', transition: 'var(--transition)', background: createForm.priority === p.key ? `${p.color}20` : 'rgba(255,255,255,0.02)', border: `2px solid ${createForm.priority === p.key ? p.color : 'rgba(255,255,255,0.08)'}`, color: createForm.priority === p.key ? p.color : 'var(--text-secondary)' }}
                  >
                    <div style={{ fontSize: '1.2rem', marginBottom: '3px' }}>{p.emoji}</div>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Frecuencia */}
            <div className="form-group" style={{ marginTop: '16px' }}>
              <label>Frecuencia</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {RECURRENCE_OPTIONS.map(r => (
                  <button key={r.key} type="button" onClick={() => setCreateForm(f => ({ ...f, recurrence_type: r.key }))}
                    className={`freq-chip${createForm.recurrence_type === r.key ? ' active' : ''}`} style={{ fontSize: '0.78rem', padding: '9px 6px' }}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {createErr && (
              <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--danger-bg)', border: '1px solid rgba(255,23,68,0.35)', color: '#ff6b6b', marginBottom: '16px', fontSize: '0.88rem' }}>
                {createErr}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button onClick={saveNewQuest} disabled={creating || !createForm.name.trim()} className="btn-gold" style={{ flex: 1, justifyContent: 'center' }}>
                {creating ? '⏳ Guardando...' : '⚡ Crear Misión'}
              </button>
              <button onClick={closeCreate} className="btn-ghost">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
