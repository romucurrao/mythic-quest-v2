'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Quest, Hero } from '@/lib/types/database.types'
import { createClient } from '@/lib/supabase/client'
import { CATEGORY_LABELS, DIFFICULTY_LABELS, FREQUENCY_LABELS, CATEGORY_ATTRIBUTE, getArgentinaDate, shouldResetQuest } from '@/lib/utils/attributes'
import { DIFFICULTY_XP, DIFFICULTY_GOLD, calculateLevel } from '@/lib/utils/xp'
import { ACHIEVEMENTS_CATALOG, AchievementStats } from '@/lib/utils/achievements'

interface Props { quests: Quest[]; hero: Hero | null; userId: string }
const EMPTY_FORM = { name: '', description: '', category: 'general', difficulty: 'media', frequency: 'diaria' }

// Áreas predefinidas (categorías existentes)
const PRESET_AREAS = Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
  key,
  label: label.replace(/^[^\s]+\s/, ''), // Sin emoji
  emoji: label.split(' ')[0],
}))

const ATTR_LABEL: Record<string, string> = {
  strength: 'Fuerza', wisdom: 'Sabiduría', discipline: 'Disciplina', charisma: 'Carisma', creativity: 'Creatividad',
}

export default function QuestsClient({ quests: init, hero, userId }: Props) {
  const router = useRouter()
  const sb = createClient()

  const [quests, setQuests]           = useState<Quest[]>(init)
  const [showModal, setShowModal]     = useState(false)
  const [editing, setEditing]         = useState<Quest | null>(null)
  const [form, setForm]               = useState(EMPTY_FORM)
  const [saving, setSaving]           = useState(false)
  const [saveErr, setSaveErr]         = useState('')
  const [activeArea, setActiveArea]   = useState<string>('all') // 'all' | category key
  const [toast, setToast]             = useState('')
  const [completing, setCompleting]   = useState<string | null>(null)
  const [selectedAch, setSelectedAch] = useState<Quest | null>(null)
  // Modal "crear área"
  const [showAreaModal, setShowAreaModal]   = useState(false)
  const [newAreaName, setNewAreaName]       = useState('')
  const [newAreaEmoji, setNewAreaEmoji]     = useState('⭐')
  const [newAreaLocation, setNewAreaLocation] = useState('')

  // Áreas personalizadas con ubicación mítica
  const [customAreas, setCustomAreas] = useState<{key: string; label: string; emoji: string; location?: string}[]>(() => {
    if (typeof window === 'undefined') return []
    try { return JSON.parse(localStorage.getItem(`mq_areas_${userId}`) || '[]') } catch { return [] }
  })

  const allAreas = [...PRESET_AREAS, ...customAreas]

  function saveCustomAreas(areas: typeof customAreas) {
    setCustomAreas(areas)
    localStorage.setItem(`mq_areas_${userId}`, JSON.stringify(areas))
  }

  function createArea() {
    if (!newAreaName.trim()) return
    const key = `custom_${Date.now()}`
    const newArea = { key, label: newAreaName.trim(), emoji: newAreaEmoji, location: newAreaLocation.trim() || undefined }
    saveCustomAreas([...customAreas, newArea])
    setNewAreaName('')
    setNewAreaEmoji('⭐')
    setNewAreaLocation('')
    setShowAreaModal(false)
  }

  const closeModal = useCallback(() => { setShowModal(false); setSaveErr(''); setSaving(false) }, [])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { closeModal(); setShowAreaModal(false) } }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [closeModal])

  function showToast(m: string) { setToast(m); setTimeout(() => setToast(''), 3200) }
  function openCreate() { setEditing(null); setForm({ ...EMPTY_FORM, category: activeArea !== 'all' ? activeArea : 'general' }); setSaveErr(''); setSaving(false); setShowModal(true) }
  function openEdit(q: Quest) { setEditing(q); setForm({ name: q.name, description: q.description ?? '', category: q.category, difficulty: q.difficulty, frequency: q.frequency }); setSaveErr(''); setSaving(false); setShowModal(true) }

  async function saveQuest() {
    if (!form.name.trim()) { setSaveErr('El nombre es obligatorio.'); return }
    if (saving) return
    setSaving(true); setSaveErr('')
    const xp = DIFFICULTY_XP[form.difficulty] ?? 60
    const gold = DIFFICULTY_GOLD[form.difficulty] ?? 10
    const attr = CATEGORY_ATTRIBUTE[form.category] ?? 'discipline'
    const base = { name: form.name.trim(), description: form.description, category: form.category, difficulty: form.difficulty, frequency: form.frequency, xp_reward: xp, gold_reward: gold, attribute_bonus: attr }
    try {
      if (editing) {
        const { data, error } = await sb.from('quests').update(base as never).eq('id', editing.id).select().single()
        if (error) { setSaveErr(error.message.includes('exist') ? '⚠️ Ejecutá el SQL en Supabase primero.' : error.message); setSaving(false); return }
        if (data) setQuests(p => p.map(q => q.id === (data as Quest).id ? data as Quest : q))
        showToast('✏️ Misión actualizada')
      } else {
        const { data, error } = await sb.from('quests').insert([{ user_id: userId, ...base }] as never).select().single()
        if (error) { setSaveErr(error.message.includes('exist') ? '⚠️ Ejecutá el SQL en Supabase (Settings → SQL Editor).' : error.message); setSaving(false); return }
        if (data) setQuests(p => [data as Quest, ...p])
        showToast('📜 ¡Misión creada!')
      }
      setSaving(false); closeModal()
    } catch { setSaveErr('Error de conexión con Supabase.'); setSaving(false) }
  }

  async function deleteQuest(id: string) {
    if (!confirm('¿Eliminar esta misión?')) return
    await sb.from('quests').delete().eq('id', id)
    setQuests(p => p.filter(q => q.id !== id))
    showToast('🗑️ Eliminada')
  }

  async function completeQuest(quest: Quest) {
    if (!hero) { showToast('⚠️ Primero crea tu héroe'); return }
    if (quest.is_completed) return
    setCompleting(quest.id)
    const today = getArgentinaDate()
    if (shouldResetQuest(quest)) await sb.from('quests').update({ is_completed: false, last_reset_date: today } as never).eq('id', quest.id)
    const newXp = hero.xp + quest.xp_reward, newGold = hero.gold + quest.gold_reward
    const newLevel = calculateLevel(newXp), newTotal = hero.total_quests_completed + 1
    const ak = quest.attribute_bonus as keyof Pick<Hero,'strength'|'wisdom'|'discipline'|'charisma'|'creativity'>|null
    const attrU: Partial<Hero> = {}
    if (ak && ['strength','wisdom','discipline','charisma','creativity'].includes(ak)) attrU[ak] = (hero[ak] as number) + 1
    const last = hero.last_active_date
    let streak = hero.streak
    if (!last) streak = 1
    else if (last !== today) { const d = Math.floor((new Date(today).getTime()-new Date(last).getTime())/86400000); streak = d===1 ? streak+1 : 1 }
    await sb.from('quests').update({ is_completed: true, last_reset_date: today } as never).eq('id', quest.id)
    await sb.from('heroes').update({ xp: newXp, gold: newGold, level: newLevel, streak, last_active_date: today, total_quests_completed: newTotal, ...attrU } as never).eq('user_id', userId)
    const stats: AchievementStats = { total_quests_completed: newTotal, streak, level: newLevel, gold: newGold, hero_created: true, chapters_completed: 0 }
    for (const a of ACHIEVEMENTS_CATALOG) if (a.condition(stats)) await sb.from('achievements').upsert([{ user_id: userId, achievement_key: a.key } as never], { onConflict: 'user_id,achievement_key' })
    setQuests(p => p.map(q => {
      if (q.id === quest.id) return { ...q, is_completed: true }
      if (shouldResetQuest(q)) { sb.from('quests').update({ is_completed: false, last_reset_date: today } as never).eq('id', q.id); return { ...q, is_completed: false } }
      return q
    }))
    showToast(newLevel > hero.level ? `⚡ ¡NIVEL ${newLevel}! +${quest.xp_reward} XP` : `✅ +${quest.xp_reward} XP · +${quest.gold_reward} 💰`)
    setCompleting(null); router.refresh()
  }

  const filtered = activeArea === 'all' ? quests : quests.filter(q => q.category === activeArea)

  // Contar misiones por área
  const areaCounts: Record<string, number> = {}
  quests.forEach(q => { areaCounts[q.category] = (areaCounts[q.category] || 0) + 1 })

  // Emoji del área
  function getAreaEmoji(key: string) { return allAreas.find(a => a.key === key)?.emoji ?? '📁' }
  function getAreaLabel(key: string) { return allAreas.find(a => a.key === key)?.label ?? key }

  const AREA_EMOJIS_CHOICE = ['⭐','🔥','💪','🧠','🎯','🌟','🏋️','🎨','📚','🤝','🕊️','♟️','🎵','🏃','🌿','🔱','⚡','💎']

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {toast && <div className="toast">{toast}</div>}

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.6rem', color: 'var(--text-primary)', letterSpacing: '1px' }}>📜 Tablón de Misiones</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>Cumple tus hábitos y asciende al Olimpo</p>
        </div>
        <button onClick={openCreate} className="btn-gold">+ Nueva Misión</button>
      </div>

      {/* ── ÁREAS (filtros por categoría) ── */}
      <div className="parch-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: '0.9rem', color: 'var(--text-gold)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Áreas
          </h2>
          <button
            onClick={() => setShowAreaModal(true)}
            style={{ fontFamily: 'Cinzel, serif', fontSize: '0.72rem', color: 'var(--text-secondary)', background: 'transparent', border: '1px dashed rgba(212,175,55,0.3)', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', transition: 'var(--transition)' }}
            onMouseEnter={e => { (e.currentTarget).style.borderColor = 'var(--gold)'; (e.currentTarget).style.color = 'var(--text-gold)' }}
            onMouseLeave={e => { (e.currentTarget).style.borderColor = 'rgba(212,175,55,0.3)'; (e.currentTarget).style.color = 'var(--text-secondary)' }}
          >+ Nueva Área</button>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {/* Botón "Todas" */}
          <button
            onClick={() => setActiveArea('all')}
            style={{
              padding: '10px 18px', borderRadius: '24px', cursor: 'pointer', transition: 'var(--transition)',
              fontFamily: 'Montserrat, sans-serif', fontSize: '0.9rem',
              background: activeArea === 'all' ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${activeArea === 'all' ? 'var(--gold)' : 'rgba(255,255,255,0.10)'}`,
              color: activeArea === 'all' ? 'var(--gold-bright)' : 'var(--text-secondary)',
            }}
          >
            📋 Todas <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>({quests.length})</span>
          </button>

          {/* Áreas con misiones + áreas personalizadas */}
          {allAreas.map(area => {
            const count = areaCounts[area.key] || 0
            if (count === 0 && !customAreas.find(c => c.key === area.key)) return null
            const isActive = activeArea === area.key
            return (
              <button key={area.key} onClick={() => setActiveArea(area.key)}
                style={{
                  padding: '10px 18px', borderRadius: '24px', cursor: 'pointer', transition: 'var(--transition)',
                  fontFamily: 'Montserrat, sans-serif', fontSize: '0.9rem',
                  background: isActive ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isActive ? 'var(--gold)' : 'rgba(255,255,255,0.10)'}`,
                  color: isActive ? 'var(--gold-bright)' : 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                {area.emoji} {area.label}
                {count > 0 && <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>({count})</span>}
              </button>
            )
          })}

          {/* Mostrar áreas personalizadas aunque no tengan misiones */}
          {customAreas.filter(c => !areaCounts[c.key]).map(area => {
            const isActive = activeArea === area.key
            return (
              <button key={area.key} onClick={() => setActiveArea(area.key)}
                style={{
                  padding: '10px 18px', borderRadius: '24px', cursor: 'pointer', transition: 'var(--transition)',
                  fontFamily: 'Montserrat, sans-serif', fontSize: '0.9rem',
                  background: isActive ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.02)',
                  border: `1px dashed ${isActive ? 'var(--gold)' : 'rgba(212,175,55,0.2)'}`,
                  color: isActive ? 'var(--gold-bright)' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                {area.emoji} {area.label} <span style={{ fontSize: '0.75rem' }}>(0)</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Lista de misiones ── */}
      {filtered.length === 0 ? (
        <div className="parch-card" style={{ padding: '56px', textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', opacity: 0.3, color: 'var(--gold)', marginBottom: '16px' }}>📜</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            {quests.length === 0 ? 'Sin misiones todavía. ¡Crea la primera!' : `No hay misiones en "${getAreaLabel(activeArea)}".`}
          </p>
          <button onClick={openCreate} className="btn-gold" style={{ marginTop: '20px' }}>+ Crear Misión</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Header del área activa */}
          {activeArea !== 'all' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span style={{ fontSize: '1.4rem' }}>{getAreaEmoji(activeArea)}</span>
              <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: '1rem', color: 'var(--text-gold)' }}>{getAreaLabel(activeArea)}</h2>
              <span className="badge-parch">{filtered.length} misiones</span>
            </div>
          )}

          {filtered.map(quest => (
            <div key={quest.id} className={`quest-card${quest.is_completed ? ' done' : ''}`}>
              {/* ── Checkbox GRANDE ── */}
              <button
                onClick={() => completeQuest(quest)}
                disabled={quest.is_completed || completing === quest.id}
                style={{
                  width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
                  border: `3px solid ${quest.is_completed ? 'var(--success)' : 'var(--gold)'}`,
                  background: quest.is_completed ? 'var(--success)' : 'var(--bg-deep)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: quest.is_completed ? 'default' : 'pointer',
                  color: quest.is_completed ? 'var(--bg-dark)' : 'transparent',
                  fontWeight: 'bold', fontSize: '1.2rem', transition: 'var(--transition)',
                  boxShadow: quest.is_completed ? '0 0 12px rgba(0,230,118,0.4)' : '0 0 8px rgba(212,175,55,0.2)',
                }}
                onMouseEnter={e => { if (!quest.is_completed) (e.currentTarget).style.boxShadow = '0 0 18px rgba(212,175,55,0.5)' }}
                onMouseLeave={e => { if (!quest.is_completed) (e.currentTarget).style.boxShadow = '0 0 8px rgba(212,175,55,0.2)' }}
              >
                {completing === quest.id ? '⏳' : quest.is_completed ? '✓' : ''}
              </button>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600, fontSize: '1.05rem', color: quest.is_completed ? 'var(--text-secondary)' : 'var(--text-primary)', textDecoration: quest.is_completed ? 'line-through' : 'none' }}>
                    {quest.name}
                  </span>
                  <span className="badge-parch">{FREQUENCY_LABELS[quest.frequency]}</span>
                  <span className="badge-parch">{DIFFICULTY_LABELS[quest.difficulty]}</span>
                </div>
                {quest.description && <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '6px' }}>{quest.description}</p>}
                <div style={{ display: 'flex', gap: '16px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-gold)', fontWeight: 600 }}>+{quest.xp_reward} XP</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-gold)', fontWeight: 600 }}>+{quest.gold_reward} 💰</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{getAreaEmoji(quest.category)} {getAreaLabel(quest.category)}</span>
                </div>
              </div>

              {/* Acciones */}
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
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
          ))}
        </div>
      )}

      {/* ── MODAL crear misión ── */}
      {showModal && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="modal-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.4rem', color: 'var(--text-gold)' }}>
                {editing ? '✏️ Editar Misión' : '+ Nueva Misión'}
              </h3>
              <button onClick={closeModal}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.8rem', cursor: 'pointer', lineHeight: 1, padding: '0 4px', transition: 'var(--transition)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >✕</button>
            </div>

            <div className="form-group">
              <label>Nombre *</label>
              <input type="text" className="input-parch" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && saveQuest()}
                placeholder="Ej: Leer 30 min, Hacer ejercicio..." maxLength={80} autoFocus />
            </div>

            <div className="form-group">
              <label>Descripción (opcional)</label>
              <textarea className="input-parch" value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Detalles de tu misión..." rows={2} style={{ resize: 'vertical' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Área / Categoría</label>
                <select className="select-parch" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {allAreas.map(a => <option key={a.key} value={a.key}>{a.emoji} {a.label}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Dificultad</label>
                <select className="select-parch" value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}>
                  {Object.entries(DIFFICULTY_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '20px' }}>
              <label>Frecuencia</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {Object.entries(FREQUENCY_LABELS).map(([k,v]) => (
                  <button key={k} type="button" onClick={() => setForm(f => ({ ...f, frequency: k }))}
                    className={`freq-chip${form.frequency === k ? ' active' : ''}`}>{v}</button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.18)', marginBottom: '20px' }}>
              <p style={{ fontFamily: 'Cinzel, serif', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Recompensa: <span style={{ color: 'var(--text-gold)', fontWeight: 600 }}>+{DIFFICULTY_XP[form.difficulty]??60} XP</span>
                {' · '}<span style={{ color: 'var(--text-gold)', fontWeight: 600 }}>+{DIFFICULTY_GOLD[form.difficulty]??10} 💰</span>
                {' · '}<span style={{ color: 'var(--text-gold)', fontWeight: 600 }}>+1 {ATTR_LABEL[CATEGORY_ATTRIBUTE[form.category]??'discipline']}</span>
              </p>
            </div>

            {saveErr && (
              <div style={{ padding: '14px', borderRadius: '8px', background: 'var(--danger-bg)', border: '1px solid rgba(255,23,68,0.35)', color: '#ff6b6b', marginBottom: '20px', fontSize: '0.95rem', lineHeight: 1.5 }}>
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

      {/* ── MODAL crear área ── */}
      {showAreaModal && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setShowAreaModal(false) }}>
          <div className="modal-box" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.3rem', color: 'var(--text-gold)' }}>+ Nueva Área</h3>
              <button onClick={() => setShowAreaModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.8rem', cursor: 'pointer', transition: 'var(--transition)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >✕</button>
            </div>

            <div className="form-group">
              <label>Nombre del área</label>
              <input type="text" className="input-parch" value={newAreaName}
                onChange={e => setNewAreaName(e.target.value)}
                placeholder="Ej: Finanzas, Meditación, Cocina..." maxLength={30} autoFocus />
            </div>

            {/* Ubicación mítica */}
            <div className="form-group">
              <label>Ubicación mítica (opcional)</label>
              <input type="text" className="input-parch" value={newAreaLocation}
                onChange={e => setNewAreaLocation(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createArea()}
                placeholder="Ej: Campos de guerra de Ares..." maxLength={60} />
              {/* Sugerencias rápidas */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                {[
                  'Campos de guerra de Ares',
                  'Jardines de Deméter',
                  'Biblioteca de Atenea',
                  'Templo de Apolo',
                  'Forge de Hefesto',
                  'Mar de Poseidón',
                  'Bosques de Artemisa',
                  'Monte Olimpo',
                  'Laberinto de Dédalo',
                  'Aguas del Estigia',
                ].map(loc => (
                  <button key={loc} type="button"
                    onClick={() => setNewAreaLocation(loc)}
                    style={{
                      padding: '5px 10px', borderRadius: '16px', cursor: 'pointer', fontSize: '0.75rem',
                      fontFamily: 'Montserrat, sans-serif',
                      background: newAreaLocation === loc ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${newAreaLocation === loc ? 'var(--gold)' : 'rgba(255,255,255,0.10)'}`,
                      color: newAreaLocation === loc ? 'var(--gold-bright)' : 'var(--text-secondary)',
                      transition: 'var(--transition)',
                    }}
                  >{loc}</button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Icono</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {AREA_EMOJIS_CHOICE.map(em => (
                  <button key={em} type="button" onClick={() => setNewAreaEmoji(em)}
                    style={{
                      fontSize: '1.4rem', padding: '8px', borderRadius: '8px', cursor: 'pointer',
                      background: newAreaEmoji === em ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.03)',
                      border: `2px solid ${newAreaEmoji === em ? 'var(--gold)' : 'rgba(255,255,255,0.08)'}`,
                      transition: 'var(--transition)',
                    }}
                  >{em}</button>
                ))}
              </div>
            </div>

            {/* Preview */}
            {newAreaName.trim() && (
              <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.18)', marginBottom: '20px' }}>
                <p style={{ fontFamily: 'Cinzel, serif', fontSize: '0.82rem', color: 'var(--text-gold)' }}>
                  {newAreaEmoji} {newAreaName.trim()}
                </p>
                {newAreaLocation.trim() && (
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', fontStyle: 'italic' }}>
                    📍 {newAreaLocation.trim()}
                  </p>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={createArea} disabled={!newAreaName.trim()} className="btn-gold" style={{ flex: 1, justifyContent: 'center' }}>
                {newAreaEmoji} Crear Área
              </button>
              <button onClick={() => setShowAreaModal(false)} className="btn-ghost">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
