'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Quest, Hero, Area, MissionCompletion } from '@/lib/types/database.types'
import { createClient } from '@/lib/supabase/client'
import { DIFFICULTY_LABELS, CATEGORY_ATTRIBUTE, getArgentinaDate } from '@/lib/utils/attributes'
import { DIFFICULTY_XP, DIFFICULTY_GOLD, calculateLevel } from '@/lib/utils/xp'
import { ACHIEVEMENTS_CATALOG, AchievementStats } from '@/lib/utils/achievements'
import { questAppearsOnDate } from '@/lib/utils/streak'

interface Props {
  quests: Quest[]
  hero: Hero | null
  areas: Area[]
  todayCompletions: MissionCompletion[]
  userId: string
  today: string
}

const EMPTY_FORM = {
  name: '', description: '', area_id: '', difficulty: 'media',
  recurrence_type: 'daily', recurrence_days: [] as number[],
  start_date: '', end_date: '',
}

const DAYS = [
  { label: 'D', full: 'Domingo',   val: 0 },
  { label: 'L', full: 'Lunes',     val: 1 },
  { label: 'M', full: 'Martes',    val: 2 },
  { label: 'X', full: 'Miércoles', val: 3 },
  { label: 'J', full: 'Jueves',    val: 4 },
  { label: 'V', full: 'Viernes',   val: 5 },
  { label: 'S', full: 'Sábado',    val: 6 },
]

const RECURRENCE_OPTIONS = [
  { key: 'none',    label: '🏆 Una vez'   },
  { key: 'daily',   label: '☀️ Diaria'    },
  { key: 'weekly',  label: '📅 Semanal'   },
  { key: 'monthly', label: '🌙 Mensual'   },
]

const DIFFICULTY_OPTIONS = ['facil','media','dificil','epica']

export default function QuestsClient({ quests: init, hero, areas, todayCompletions: initCompletions, userId, today }: Props) {
  const router = useRouter()
  const sb = createClient()

  const [quests, setQuests]         = useState<Quest[]>(init)
  const [completions, setCompletions] = useState<MissionCompletion[]>(initCompletions)
  const [showModal, setShowModal]   = useState(false)
  const [editing, setEditing]       = useState<Quest | null>(null)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)
  const [saveErr, setSaveErr]       = useState('')
  const [activeArea, setActiveArea] = useState<string>('today') // 'today' | 'all' | area.id
  const [toast, setToast]           = useState('')
  const [completing, setCompleting] = useState<string | null>(null)

  const closeModal = useCallback(() => { setShowModal(false); setSaveErr(''); setSaving(false); setEditing(null) }, [])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [closeModal])

  function showToast(m: string) { setToast(m); setTimeout(() => setToast(''), 3200) }

  function openCreate() {
    setEditing(null)
    setForm({ ...EMPTY_FORM, start_date: today, area_id: activeArea !== 'today' && activeArea !== 'all' ? activeArea : '' })
    setSaveErr('')
    setShowModal(true)
  }

  function openEdit(q: Quest) {
    setEditing(q)
    setForm({
      name: q.name, description: q.description ?? '', area_id: q.area_id ?? '',
      difficulty: q.difficulty, recurrence_type: q.recurrence_type ?? 'daily',
      recurrence_days: (q.recurrence_days as number[]) ?? [],
      start_date: q.start_date ?? today, end_date: q.end_date ?? '',
    })
    setSaveErr('')
    setShowModal(true)
  }

  function toggleDay(val: number) {
    setForm(f => ({
      ...f,
      recurrence_days: f.recurrence_days.includes(val)
        ? f.recurrence_days.filter(d => d !== val)
        : [...f.recurrence_days, val],
    }))
  }

  async function saveQuest() {
    if (!form.name.trim()) { setSaveErr('El nombre es obligatorio.'); return }
    if (saving) return
    setSaving(true); setSaveErr('')

    const area = areas.find(a => a.id === form.area_id)
    const attrBonus = area ? area.attribute : CATEGORY_ATTRIBUTE['general']
    const xp   = DIFFICULTY_XP[form.difficulty] ?? 60
    const gold = DIFFICULTY_GOLD[form.difficulty] ?? 10

    // Mapear recurrence_type a frequency (legacy)
    const freqMap: Record<string, string> = { none: 'unica', daily: 'diaria', weekly: 'semanal', monthly: 'mensual' }

    const payload = {
      name: form.name.trim(),
      description: form.description || null,
      area_id: form.area_id || null,
      category: area?.name?.toLowerCase().replace(/\s/g,'_') ?? 'general',
      difficulty: form.difficulty,
      frequency: freqMap[form.recurrence_type] ?? 'diaria',
      recurrence_type: form.recurrence_type,
      recurrence_days: form.recurrence_type === 'weekly' ? form.recurrence_days : [],
      start_date: form.start_date || today,
      end_date: form.end_date || null,
      xp_reward: xp,
      gold_reward: gold,
      attribute_bonus: attrBonus,
    }

    try {
      if (editing) {
        const { data, error } = await sb.from('quests').update(payload as never).eq('id', editing.id).select().single()
        if (error) { setSaveErr(error.message); setSaving(false); return }
        if (data) setQuests(p => p.map(q => q.id === (data as Quest).id ? data as Quest : q))
        showToast('✏️ Misión actualizada')
      } else {
        const { data, error } = await sb.from('quests').insert([{ user_id: userId, ...payload }] as never).select().single()
        if (error) {
          if (error.code === '42P01') setSaveErr('⚠️ Ejecutá las migraciones SQL en Supabase primero.')
          else setSaveErr(error.message)
          setSaving(false); return
        }
        if (data) setQuests(p => [data as Quest, ...p])
        showToast('📜 ¡Misión creada!')
      }
      setSaving(false); closeModal()
    } catch { setSaveErr('Error de conexión'); setSaving(false) }
  }

  async function deleteQuest(id: string) {
    if (!confirm('¿Eliminar esta misión?')) return
    await sb.from('quests').delete().eq('id', id)
    setQuests(p => p.filter(q => q.id !== id))
    showToast('🗑️ Eliminada')
  }

  async function completeQuest(quest: Quest) {
    if (!hero) { showToast('⚠️ Primero crea tu héroe'); return }
    const alreadyDone = completions.some(c => c.quest_id === quest.id && c.completed_date === today)
    if (alreadyDone) return
    setCompleting(quest.id)

    try {
      const newXp    = hero.xp + quest.xp_reward
      const newGold  = hero.gold + quest.gold_reward
      const newLevel = calculateLevel(newXp)
      const newTotal = hero.total_quests_completed + 1

      // Bonus de atributo
      const ak = quest.attribute_bonus as keyof Pick<Hero,'strength'|'wisdom'|'discipline'|'charisma'|'creativity'>|null
      const attrU: Partial<Hero> = {}
      if (ak && ['strength','wisdom','discipline','charisma','creativity'].includes(ak)) {
        attrU[ak] = (hero[ak] as number) + 1
      }

      // Actualizar héroe
      await sb.from('heroes').update({ xp: newXp, gold: newGold, level: newLevel, total_quests_completed: newTotal, ...attrU } as never).eq('user_id', userId)

      // Insertar en mission_completions
      const { data: compData } = await sb.from('mission_completions').insert([{
        user_id: userId, quest_id: quest.id, completed_date: today,
        xp_earned: quest.xp_reward, gold_earned: quest.gold_reward,
      }] as never).select().single()

      if (compData) setCompletions(p => [...p, compData as MissionCompletion])

      // Para misiones únicas, marcar como completada
      if (quest.recurrence_type === 'none' || quest.frequency === 'unica') {
        await sb.from('quests').update({ is_completed: true } as never).eq('id', quest.id)
        setQuests(p => p.map(q => q.id === quest.id ? { ...q, is_completed: true } : q))
      }

      // Logros
      const stats: AchievementStats = { total_quests_completed: newTotal, streak: hero.streak, level: newLevel, gold: newGold, hero_created: true, chapters_completed: 0 }
      for (const a of ACHIEVEMENTS_CATALOG) {
        if (a.condition(stats)) await sb.from('achievements').upsert([{ user_id: userId, achievement_key: a.key } as never], { onConflict: 'user_id,achievement_key' })
      }

      showToast(newLevel > hero.level ? `⚡ ¡NIVEL ${newLevel}! +${quest.xp_reward} XP` : `✅ +${quest.xp_reward} XP · +${quest.gold_reward} 💰`)
      router.refresh()
    } catch (e) {
      showToast('❌ Error al completar')
    }
    setCompleting(null)
  }

  // ── Filtrar misiones ──
  const todayQuests = quests.filter(q => questAppearsOnDate(q, today))
  const todayDoneIds = new Set(completions.map(c => c.quest_id))

  const pending   = todayQuests.filter(q => !todayDoneIds.has(q.id) && !q.is_completed)
  const doneToday = todayQuests.filter(q => todayDoneIds.has(q.id))

  const filteredAll = activeArea === 'all' ? quests
    : activeArea === 'today' ? todayQuests
    : quests.filter(q => q.area_id === activeArea)

  function getAreaName(areaId: string | null) {
    if (!areaId) return null
    return areas.find(a => a.id === areaId)?.name ?? null
  }
  function getAreaIcon(areaId: string | null) {
    if (!areaId) return '📋'
    return areas.find(a => a.id === areaId)?.icon ?? '📋'
  }

  function QuestRow({ quest }: { quest: Quest }) {
    const done = todayDoneIds.has(quest.id) || quest.is_completed
    return (
      <div className={`quest-card${done ? ' done' : ''}`}>
        {/* Checkbox GRANDE */}
        <button
          onClick={() => !done && completeQuest(quest)}
          disabled={done || completing === quest.id}
          style={{
            width: '52px', height: '52px', borderRadius: '50%', flexShrink: 0,
            border: `3px solid ${done ? 'var(--success)' : 'var(--gold)'}`,
            background: done ? 'var(--success)' : 'var(--bg-deep)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: done ? 'default' : 'pointer', color: done ? 'var(--bg-dark)' : 'transparent',
            fontWeight: 'bold', fontSize: '1.3rem', transition: 'var(--transition)',
            boxShadow: done ? '0 0 14px rgba(0,230,118,0.4)' : '0 0 8px rgba(212,175,55,0.2)',
          }}
          onMouseEnter={e => { if (!done) (e.currentTarget).style.boxShadow = '0 0 20px rgba(212,175,55,0.5)' }}
          onMouseLeave={e => { if (!done) (e.currentTarget).style.boxShadow = '0 0 8px rgba(212,175,55,0.2)' }}
        >
          {completing === quest.id ? '⏳' : done ? '✓' : ''}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <span style={{ fontWeight: 600, fontSize: '1.05rem', color: done ? 'var(--text-secondary)' : 'var(--text-primary)', textDecoration: done ? 'line-through' : 'none' }}>
              {quest.name}
            </span>
            <span className="badge-parch" style={{ fontSize: '0.72rem' }}>{DIFFICULTY_LABELS[quest.difficulty]}</span>
            {quest.recurrence_type !== 'none' && quest.recurrence_type && (
              <span className="badge-parch" style={{ fontSize: '0.72rem' }}>
                {RECURRENCE_OPTIONS.find(r => r.key === quest.recurrence_type)?.label ?? quest.recurrence_type}
              </span>
            )}
          </div>
          {quest.description && <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '6px' }}>{quest.description}</p>}
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-gold)', fontWeight: 600 }}>+{quest.xp_reward} XP</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-gold)', fontWeight: 600 }}>+{quest.gold_reward} 💰</span>
            {quest.area_id && <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{getAreaIcon(quest.area_id)} {getAreaName(quest.area_id)}</span>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          <button onClick={() => openEdit(quest)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px', borderRadius: '6px', fontSize: '1.1rem', transition: 'var(--transition)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >✏️</button>
          <button onClick={() => deleteQuest(quest.id)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px', borderRadius: '6px', fontSize: '1.1rem', transition: 'var(--transition)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >🗑️</button>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {toast && <div className="toast">{toast}</div>}

      {/* ── Header con racha ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.8rem', color: 'var(--text-primary)', letterSpacing: '1px' }}>📜 Misiones</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            {new Date(today + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Argentina/Buenos_Aires' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {hero && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ padding: '8px 14px', borderRadius: '8px', background: 'rgba(255,80,80,0.10)', border: '1px solid rgba(255,80,80,0.25)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem' }}>🔥</div>
                <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.75rem', color: '#ff6b6b', fontWeight: 700 }}>{hero.streak}</div>
                <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.55rem', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>RACHA</div>
              </div>
              <div style={{ padding: '8px 14px', borderRadius: '8px', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem' }}>⚡</div>
                <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.75rem', color: 'var(--gold-bright)', fontWeight: 700 }}>Nv.{hero.level}</div>
                <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.55rem', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>NIVEL</div>
              </div>
            </div>
          )}
          <button onClick={openCreate} className="btn-gold">+ Nueva Misión</button>
        </div>
      </div>

      {/* ── Tabs de filtro ── */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button onClick={() => setActiveArea('today')} className={`tab-btn${activeArea === 'today' ? ' active' : ''}`}>
          📅 Hoy ({pending.length + doneToday.length})
        </button>
        <button onClick={() => setActiveArea('all')} className={`tab-btn${activeArea === 'all' ? ' active' : ''}`}>
          📋 Todas ({quests.length})
        </button>
        {areas.map(a => (
          <button key={a.id} onClick={() => setActiveArea(a.id)} className={`tab-btn${activeArea === a.id ? ' active' : ''}`}>
            {a.icon} {a.name}
          </button>
        ))}
      </div>

      {/* ── Vista "Hoy" ── */}
      {activeArea === 'today' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Pendientes */}
          {pending.length > 0 && (
            <div>
              <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.78rem', color: 'var(--text-gold)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
                ⚔️ Pendientes ({pending.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {pending.map(q => <QuestRow key={q.id} quest={q} />)}
              </div>
            </div>
          )}

          {/* Completadas hoy */}
          {doneToday.length > 0 && (
            <div>
              <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.78rem', color: 'var(--success)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
                ✓ Completadas hoy ({doneToday.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {doneToday.map(q => <QuestRow key={q.id} quest={q} />)}
              </div>
            </div>
          )}

          {pending.length === 0 && doneToday.length === 0 && (
            <div className="parch-card" style={{ padding: '48px', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', opacity: 0.3, marginBottom: '16px' }}>📅</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                No hay misiones programadas para hoy.<br/>¡Crea una misión o revisa tu calendario!
              </p>
              <button onClick={openCreate} className="btn-gold" style={{ marginTop: '20px' }}>+ Nueva Misión</button>
            </div>
          )}
        </div>
      )}

      {/* ── Vista "Todas" o por área ── */}
      {activeArea !== 'today' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredAll.length === 0 ? (
            <div className="parch-card" style={{ padding: '48px', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', opacity: 0.3, marginBottom: '16px' }}>📜</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Sin misiones aquí todavía.</p>
              <button onClick={openCreate} className="btn-gold" style={{ marginTop: '20px' }}>+ Crear Misión</button>
            </div>
          ) : (
            filteredAll.map(q => <QuestRow key={q.id} quest={q} />)
          )}
        </div>
      )}

      {/* ── MODAL crear/editar ── */}
      {showModal && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="modal-box" style={{ maxWidth: '560px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.4rem', color: 'var(--text-gold)' }}>
                {editing ? '✏️ Editar Misión' : '+ Nueva Misión'}
              </h3>
              <button onClick={closeModal}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.8rem', cursor: 'pointer', transition: 'var(--transition)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >✕</button>
            </div>

            <div className="form-group">
              <label>Nombre *</label>
              <input type="text" className="input-parch" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ej: Entrenar piernas, Leer 30 min..." maxLength={80} autoFocus />
            </div>

            <div className="form-group">
              <label>Descripción (opcional)</label>
              <textarea className="input-parch" value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Detalles adicionales..." rows={2} style={{ resize: 'vertical' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Santuario / Área</label>
                <select className="select-parch" value={form.area_id} onChange={e => setForm(f => ({ ...f, area_id: e.target.value }))}>
                  <option value="">Sin área</option>
                  {areas.map(a => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Dificultad</label>
                <select className="select-parch" value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}>
                  {DIFFICULTY_OPTIONS.map(k => <option key={k} value={k}>{DIFFICULTY_LABELS[k]}</option>)}
                </select>
              </div>
            </div>

            {/* Recurrencia */}
            <div className="form-group" style={{ marginTop: '20px' }}>
              <label>Frecuencia</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {RECURRENCE_OPTIONS.map(r => (
                  <button key={r.key} type="button" onClick={() => setForm(f => ({ ...f, recurrence_type: r.key, recurrence_days: [] }))}
                    className={`freq-chip${form.recurrence_type === r.key ? ' active' : ''}`} style={{ fontSize: '0.85rem' }}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Días de semana si es semanal */}
            {form.recurrence_type === 'weekly' && (
              <div className="form-group">
                <label>Días de la semana</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {DAYS.map(d => (
                    <button key={d.val} type="button" onClick={() => toggleDay(d.val)} title={d.full}
                      style={{
                        width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer',
                        fontFamily: 'Cinzel, serif', fontSize: '0.75rem', fontWeight: 700, transition: 'var(--transition)',
                        background: form.recurrence_days.includes(d.val) ? 'var(--gold)' : 'rgba(255,255,255,0.04)',
                        border: `2px solid ${form.recurrence_days.includes(d.val) ? 'var(--gold)' : 'rgba(255,255,255,0.15)'}`,
                        color: form.recurrence_days.includes(d.val) ? 'var(--bg-dark)' : 'var(--text-secondary)',
                      }}
                    >{d.label}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Fechas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Fecha de inicio</label>
                <input type="date" className="input-parch" value={form.start_date}
                  onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Fecha de fin (opcional)</label>
                <input type="date" className="input-parch" value={form.end_date}
                  onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} min={form.start_date} />
              </div>
            </div>

            {/* Preview recompensas */}
            <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.18)', margin: '20px 0 20px' }}>
              <p style={{ fontFamily: 'Cinzel, serif', fontSize: '0.82rem', color: 'var(--text-gold)' }}>
                Recompensa: <strong>+{DIFFICULTY_XP[form.difficulty] ?? 60} XP</strong>
                {' · '}<strong>+{DIFFICULTY_GOLD[form.difficulty] ?? 10} 💰</strong>
                {form.area_id && areas.find(a => a.id === form.area_id) && (
                  <>{' · +1 '}{areas.find(a => a.id === form.area_id)?.attribute}</>
                )}
              </p>
            </div>

            {saveErr && (
              <div style={{ padding: '14px', borderRadius: '8px', background: 'var(--danger-bg)', border: '1px solid rgba(255,23,68,0.35)', color: '#ff6b6b', marginBottom: '20px', fontSize: '0.9rem', lineHeight: 1.5 }}>
                {saveErr}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={saveQuest} disabled={saving || !form.name.trim()} className="btn-gold" style={{ flex: 1, justifyContent: 'center' }}>
                {saving ? '⏳ Guardando...' : editing ? '💾 Actualizar' : '⚡ Crear Misión'}
              </button>
              <button onClick={closeModal} className="btn-ghost">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
