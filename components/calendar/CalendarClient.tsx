'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Quest, Area, MissionCompletion } from '@/lib/types/database.types'
import { createClient } from '@/lib/supabase/client'
import { questAppearsOnDate } from '@/lib/utils/streak'

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

function dateStr(y: number, m: number, d: number) {
  return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
}

export default function CalendarClient({ quests, areas, completions: initComp, userId, today }: Props) {
  const router = useRouter()
  const sb = createClient()

  const todayDate = new Date(today + 'T12:00:00')
  const [view, setView]             = useState<ViewMode>('list')
  const [completions, setCompletions] = useState<MissionCompletion[]>(initComp)
  const [completing, setCompleting] = useState<string|null>(null) // 'questId__date'
  const [toast, setToast]           = useState('')
  const [selectedDate, setSelectedDate] = useState<string>(today) // para modal en vista mensual

  // Mes actual para la vista mensual
  const [monthYear, setMonthYear]   = useState({ year: todayDate.getFullYear(), month: todayDate.getMonth() })

  function showToast(m: string) { setToast(m); setTimeout(() => setToast(''), 3000) }

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

  // Generar los próximos 14 días para la vista de lista
  function getNext14Days(): string[] {
    const days: string[] = []
    for (let i = 0; i < 14; i++) {
      const d = new Date(today + 'T12:00:00')
      d.setDate(d.getDate() + i)
      days.push(d.toISOString().slice(0, 10))
    }
    return days
  }

  // Misiones que aparecen en una fecha específica
  function questsForDate(date: string) {
    return quests.filter(q => questAppearsOnDate(q, date))
  }

  // Formatear fecha legible
  function formatDate(dateS: string, short?: boolean) {
    const d = new Date(dateS + 'T12:00:00')
    if (short) return d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'America/Argentina/Buenos_Aires' })
    return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Argentina/Buenos_Aires' })
  }

  // ─────────────── VISTA LISTA 14 DÍAS ───────────────────
  function ListView() {
    const days = getNext14Days()
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {days.map(day => {
          const dayQuests = questsForDate(day)
          const isToday   = day === today
          const dayDate   = new Date(day + 'T12:00:00')
          const weekday   = dayDate.toLocaleDateString('es-AR', { weekday: 'short', timeZone: 'America/Argentina/Buenos_Aires' })
          const dayNum    = dayDate.getDate()
          const monthStr  = dayDate.toLocaleDateString('es-AR', { month: 'short', timeZone: 'America/Argentina/Buenos_Aires' })

          if (dayQuests.length === 0 && !isToday) return null

          return (
            <div key={day} style={{
              borderRadius: '12px',
              border: `1px solid ${isToday ? 'rgba(212,175,55,0.45)' : 'rgba(255,255,255,0.07)'}`,
              background: isToday ? 'rgba(212,175,55,0.04)' : 'rgba(13,19,43,0.5)',
              overflow: 'hidden',
            }}>
              {/* Cabecera del día */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px', borderBottom: dayQuests.length > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none', background: isToday ? 'rgba(212,175,55,0.06)' : 'transparent' }}>
                <div style={{ textAlign: 'center', minWidth: '42px' }}>
                  <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.65rem', color: isToday ? 'var(--gold)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{weekday}</div>
                  <div style={{ fontFamily: 'Cinzel, serif', fontSize: '1.6rem', color: isToday ? 'var(--gold-bright)' : 'var(--text-primary)', lineHeight: 1.1, fontWeight: 700 }}>{dayNum}</div>
                  <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{monthStr}</div>
                </div>
                <div style={{ flex: 1 }}>
                  {isToday && <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.72rem', color: 'var(--gold)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>⚡ HOY</span>}
                  {dayQuests.length === 0 && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin misiones programadas</span>}
                  {dayQuests.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: isToday ? '4px' : 0 }}>
                      {dayQuests.slice(0, 4).map(q => (
                        <span key={q.id} style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', background: isCompleted(q.id, day) ? 'rgba(0,230,118,0.12)' : 'rgba(255,255,255,0.06)', border: `1px solid ${isCompleted(q.id, day) ? 'rgba(0,230,118,0.3)' : 'rgba(255,255,255,0.10)'}`, color: isCompleted(q.id, day) ? 'var(--success)' : 'var(--text-secondary)' }}>
                          {isCompleted(q.id, day) ? '✓ ' : ''}{q.name}
                        </span>
                      ))}
                      {dayQuests.length > 4 && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '2px 6px' }}>+{dayQuests.length - 4} más</span>}
                    </div>
                  )}
                </div>
                <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.04)', padding: '4px 10px', borderRadius: '8px' }}>
                  {dayQuests.filter(q => isCompleted(q.id, day)).length}/{dayQuests.length}
                </div>
              </div>

              {/* Misiones del día */}
              {dayQuests.length > 0 && (
                <div style={{ padding: '8px 20px' }}>
                  {dayQuests.map(quest => {
                    const done = isCompleted(quest.id, day)
                    const cKey = `${quest.id}__${day}`
                    return (
                      <div key={quest.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <button
                          onClick={() => done ? uncompleteOnDate(quest, day) : completeOnDate(quest, day)}
                          disabled={completing === cKey}
                          title={done ? 'Click para desmarcar' : 'Click para completar'}
                          style={{
                            width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                            border: `2px solid ${done ? 'var(--success)' : 'rgba(212,175,55,0.45)'}`,
                            background: done ? 'var(--success)' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: done ? 'var(--bg-dark)' : 'transparent',
                            fontSize: '1rem', fontWeight: 'bold', transition: 'var(--transition)',
                          }}
                          onMouseEnter={e => { if (!done) { (e.currentTarget).style.background = 'rgba(212,175,55,0.18)'; (e.currentTarget).style.borderColor = 'var(--gold)' } }}
                          onMouseLeave={e => { if (!done) { (e.currentTarget).style.background = 'transparent'; (e.currentTarget).style.borderColor = 'rgba(212,175,55,0.45)' } }}
                        >
                          {completing === cKey ? '⏳' : done ? '✓' : ''}
                        </button>

                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.95rem', color: done ? 'var(--text-secondary)' : 'var(--text-primary)', textDecoration: done ? 'line-through' : 'none', fontWeight: 500 }}>
                            {quest.name}
                          </div>
                          {(quest.area_id || quest.recurrence_type !== 'none') && (
                            <div style={{ display: 'flex', gap: '10px', marginTop: '3px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                              {quest.area_id && <span>{getAreaIcon(quest.area_id)} {getAreaName(quest.area_id)}</span>}
                              {quest.recurrence_type !== 'none' && <span style={{ color: 'var(--text-muted)' }}>
                                {quest.recurrence_type === 'daily' ? '☀️ Diaria' : quest.recurrence_type === 'weekly' ? '📅 Semanal' : '🌙 Mensual'}
                              </span>}
                            </div>
                          )}
                        </div>

                        <div style={{ fontSize: '0.82rem', color: 'var(--text-gold)', flexShrink: 0 }}>
                          +{quest.xp_reward} XP
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // ─────────────── VISTA MENSUAL ───────────────────
  function MonthView() {
    const { year, month } = monthYear
    const firstDay = new Date(year, month, 1).getDay() // 0=Dom
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const cells: (string | null)[] = []
    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(dateStr(year, month, d))

    function prevMonth() { setMonthYear(p => p.month === 0 ? { year: p.year-1, month: 11 } : { ...p, month: p.month-1 }) }
    function nextMonth() { setMonthYear(p => p.month === 11 ? { year: p.year+1, month: 0 } : { ...p, month: p.month+1 }) }

    return (
      <div>
        {/* Controles */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button onClick={prevMonth} className="btn-ghost" style={{ padding: '8px 16px' }}>← Anterior</button>
          <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.2rem', color: 'var(--text-gold)' }}>
            {MONTH_NAMES[month]} {year}
          </h3>
          <button onClick={nextMonth} className="btn-ghost" style={{ padding: '8px 16px' }}>Siguiente →</button>
        </div>

        {/* Cabecera días */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
          {DAY_NAMES.map(d => (
            <div key={d} style={{ textAlign: 'center', fontFamily: 'Cinzel, serif', fontSize: '0.65rem', color: 'var(--text-muted)', padding: '6px 0', letterSpacing: '0.05em' }}>{d}</div>
          ))}
        </div>

        {/* Grilla de días */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {cells.map((date, idx) => {
            if (!date) return <div key={`empty-${idx}`} />
            const dayQuests = questsForDate(date)
            const completed = dayQuests.filter(q => isCompleted(q.id, date))
            const isToday = date === today
            const isPast  = date < today
            const isSelected = date === selectedDate

            return (
              <button key={date} onClick={() => setSelectedDate(date)}
                style={{
                  padding: '8px 4px', borderRadius: '8px', minHeight: '64px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                  cursor: 'pointer', transition: 'all 0.2s',
                  background: isToday ? 'rgba(212,175,55,0.12)' : isSelected ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                  border: `2px solid ${isToday ? 'var(--gold)' : isSelected ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.05)'}`,
                  opacity: isPast && !isToday ? 0.6 : 1,
                }}
                onMouseEnter={e => { (e.currentTarget).style.background = 'rgba(212,175,55,0.06)'; (e.currentTarget).style.borderColor = 'rgba(212,175,55,0.3)' }}
                onMouseLeave={e => { (e.currentTarget).style.background = isToday ? 'rgba(212,175,55,0.12)' : isSelected ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)'; (e.currentTarget).style.borderColor = isToday ? 'var(--gold)' : isSelected ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.05)' }}
              >
                <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.9rem', fontWeight: isToday ? 700 : 400, color: isToday ? 'var(--gold-bright)' : 'var(--text-primary)' }}>
                  {parseInt(date.slice(8))}
                </span>
                {dayQuests.length > 0 && (
                  <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {dayQuests.slice(0, 5).map((q, i) => (
                      <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: isCompleted(q.id, date) ? 'var(--success)' : 'var(--gold)', opacity: isCompleted(q.id, date) ? 1 : 0.6 }} />
                    ))}
                  </div>
                )}
                {dayQuests.length > 0 && (
                  <span style={{ fontSize: '0.58rem', color: completed.length === dayQuests.length ? 'var(--success)' : 'var(--text-muted)', fontFamily: 'Cinzel, serif' }}>
                    {completed.length}/{dayQuests.length}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Panel lateral: detalle del día seleccionado */}
        {selectedDate && (
          <div style={{ marginTop: '20px', padding: '20px', borderRadius: '12px', background: 'rgba(13,19,43,0.7)', border: '1px solid rgba(212,175,55,0.2)' }}>
            <h4 style={{ fontFamily: 'Cinzel, serif', fontSize: '1rem', color: 'var(--text-gold)', marginBottom: '14px', textTransform: 'capitalize' }}>
              📅 {formatDate(selectedDate)}
            </h4>
            {questsForDate(selectedDate).length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>Sin misiones para este día.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {questsForDate(selectedDate).map(quest => {
                  const done = isCompleted(quest.id, selectedDate)
                  const cKey = `${quest.id}__${selectedDate}`
                  return (
                    <div key={quest.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button
                        onClick={() => done ? uncompleteOnDate(quest, selectedDate) : completeOnDate(quest, selectedDate)}
                        disabled={completing === cKey}
                        style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0, border: `2px solid ${done ? 'var(--success)' : 'rgba(212,175,55,0.45)'}`, background: done ? 'var(--success)' : 'transparent', cursor: 'pointer', color: done ? '#000' : 'transparent', fontSize: '0.9rem', fontWeight: 'bold', transition: 'var(--transition)' }}
                        onMouseEnter={e => { if (!done) { (e.currentTarget).style.background = 'rgba(212,175,55,0.18)' } }}
                        onMouseLeave={e => { if (!done) { (e.currentTarget).style.background = 'transparent' } }}
                      >{completing === cKey ? '⏳' : done ? '✓' : ''}</button>
                      <div style={{ flex: 1, fontSize: '0.92rem', color: done ? 'var(--text-secondary)' : 'var(--text-primary)', textDecoration: done ? 'line-through' : 'none' }}>
                        {quest.name}
                        {quest.area_id && <span style={{ marginLeft: '8px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{getAreaIcon(quest.area_id)} {getAreaName(quest.area_id)}</span>}
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-gold)', flexShrink: 0 }}>+{quest.xp_reward} XP</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const next14 = getNext14Days()
  const totalToday = questsForDate(today).length
  const doneToday  = questsForDate(today).filter(q => isCompleted(q.id, today)).length

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {toast && <div className="toast">{toast}</div>}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.8rem', color: 'var(--text-primary)', letterSpacing: '1px' }}>
            🗓️ Calendario
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Hoy: {doneToday}/{totalToday} misiones completadas
          </p>
        </div>

        {/* Toggle de vista */}
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

      {/* Vista */}
      {view === 'list' ? <ListView /> : <MonthView />}
    </div>
  )
}
