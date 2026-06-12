'use client'

import { useState, useEffect, useCallback } from 'react'
import { Area } from '@/lib/types/database.types'
import { createClient } from '@/lib/supabase/client'
import { ATTRIBUTE_LABELS, ATTRIBUTE_EMOJIS } from '@/lib/utils/attributes'

interface Props { areas: Area[]; userId: string }

// Dioses con atributo sugerido
const DEITIES = [
  { name: 'Zeus',     emoji: '⚡', attribute: 'discipline', location: 'Monte Olimpo'             },
  { name: 'Atenea',   emoji: '🦉', attribute: 'wisdom',     location: 'Biblioteca de Atenea'      },
  { name: 'Ares',     emoji: '⚔️', attribute: 'strength',   location: 'Campos de guerra de Ares'  },
  { name: 'Hermes',   emoji: '🪽', attribute: 'charisma',   location: 'Caminos del Olimpo'        },
  { name: 'Afrodita', emoji: '🌹', attribute: 'charisma',   location: 'Jardines de Afrodita'      },
  { name: 'Apolo',    emoji: '🎵', attribute: 'creativity', location: 'Templo de Apolo'           },
  { name: 'Poseidón', emoji: '🌊', attribute: 'strength',   location: 'Mar de Poseidón'           },
  { name: 'Hades',    emoji: '💀', attribute: 'discipline', location: 'Aguas del Estigia'         },
  { name: 'Artemisa', emoji: '🌙', attribute: 'discipline', location: 'Bosques de Artemisa'       },
  { name: 'Deméter',  emoji: '🌿', attribute: 'wisdom',     location: 'Jardines de Deméter'       },
  { name: 'Hefesto',  emoji: '🔨', attribute: 'creativity', location: 'Forge de Hefesto'          },
  { name: 'Dioniso',  emoji: '🍇', attribute: 'charisma',   location: 'Viñedos del Olimpo'        },
]

const ICON_OPTIONS = ['⭐','🔥','💪','🧠','🎯','🌟','🏋️','🎨','📚','🤝','🕊️','♟️','🎵','🏃','🌿','🔱','⚡','💎','🏺','🌙','🌊','🦁','🐍','🦅']
const EMPTY_FORM = { name: '', icon: '⭐', deity: '', location: '', attribute: 'discipline' }

const ATTR_COLORS: Record<string, string> = {
  strength: '#C0392B', wisdom: '#7EC8E3', discipline: '#2ECC71', charisma: '#E91E8C', creativity: '#FF9800',
}

export default function AreasClient({ areas: initAreas, userId }: Props) {
  const sb = createClient()
  const [areas, setAreas]           = useState<Area[]>(initAreas)
  const [showModal, setShowModal]   = useState(false)
  const [editing, setEditing]       = useState<Area | null>(null)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)
  const [saveErr, setSaveErr]       = useState('')
  const [toast, setToast]           = useState('')
  const [deleting, setDeleting]     = useState<string | null>(null)

  const closeModal = useCallback(() => { setShowModal(false); setSaveErr(''); setSaving(false); setEditing(null) }, [])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [closeModal])

  function showToast(m: string) { setToast(m); setTimeout(() => setToast(''), 3000) }

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setSaveErr('')
    setShowModal(true)
  }

  function openEdit(area: Area) {
    setEditing(area)
    setForm({ name: area.name, icon: area.icon, deity: area.deity ?? '', location: area.location ?? '', attribute: area.attribute })
    setSaveErr('')
    setShowModal(true)
  }

  function applyDeity(deity: typeof DEITIES[0]) {
    setForm(f => ({ ...f, deity: deity.name, attribute: deity.attribute, location: f.location || deity.location, icon: f.icon }))
  }

  async function saveArea() {
    if (!form.name.trim()) { setSaveErr('El nombre es obligatorio.'); return }
    if (saving) return
    setSaving(true); setSaveErr('')

    const payload = {
      name: form.name.trim(),
      icon: form.icon,
      deity: form.deity.trim() || null,
      location: form.location.trim() || null,
      attribute: form.attribute,
    }

    try {
      if (editing) {
        const { data, error } = await sb.from('areas').update(payload as never).eq('id', editing.id).select().single()
        if (error) {
          if (error.code === '42P01') setSaveErr('⚠️ Ejecutá primero las migraciones SQL en Supabase.')
          else if (error.code === '23505') setSaveErr('Ya existe un área con ese nombre.')
          else setSaveErr(error.message)
          setSaving(false); return
        }
        if (data) setAreas(prev => prev.map(a => a.id === (data as Area).id ? data as Area : a))
        showToast('✏️ Área actualizada')
      } else {
        const { data, error } = await sb.from('areas').insert([{ user_id: userId, ...payload }] as never).select().single()
        if (error) {
          if (error.code === '42P01') setSaveErr('⚠️ Ejecutá primero las migraciones SQL en Supabase (002_areas.sql).')
          else if (error.code === '23505') setSaveErr('Ya existe un área con ese nombre.')
          else setSaveErr(error.message)
          setSaving(false); return
        }
        if (data) setAreas(prev => [...prev, data as Area])
        showToast(`🏛️ Santuario "${payload.name}" creado`)
      }
      setSaving(false)
      closeModal()
    } catch (e) {
      setSaveErr('Error de conexión')
      setSaving(false)
    }
  }

  async function deleteArea(id: string, name: string) {
    if (!confirm(`¿Eliminar el santuario "${name}"? Las misiones de este santuario quedarán sin área.`)) return
    setDeleting(id)
    const { error } = await sb.from('areas').delete().eq('id', id)
    if (error) { showToast('❌ Error al eliminar'); setDeleting(null); return }
    setAreas(prev => prev.filter(a => a.id !== id))
    showToast(`🗑️ "${name}" eliminado`)
    setDeleting(null)
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {toast && <div className="toast">{toast}</div>}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.8rem', color: 'var(--text-primary)', letterSpacing: '1px' }}>
            🏛️ Santuarios
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '6px' }}>
            Agrupa tus misiones por área de vida bajo la bendición de los dioses
          </p>
        </div>
        <button onClick={openCreate} className="btn-gold">+ Nuevo Santuario</button>
      </div>

      {/* Info SQL */}
      {areas.length === 0 && (
        <div style={{ padding: '16px 20px', borderRadius: '10px', background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.25)' }}>
          <p style={{ fontFamily: 'Cinzel, serif', fontSize: '0.85rem', color: 'var(--text-gold)', marginBottom: '6px' }}>
            ⚠️ Antes de crear santuarios, ejecutá las migraciones en Supabase:
          </p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontFamily: 'monospace', lineHeight: 1.8 }}>
            Supabase → SQL Editor → pegar y ejecutar:<br/>
            <strong>002_areas.sql</strong> y luego <strong>003_quests_v2.sql</strong>
          </p>
        </div>
      )}

      {/* Grid de santuarios */}
      {areas.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {areas.map(area => {
            const attrColor = ATTR_COLORS[area.attribute] ?? '#d4af37'
            const attrLabel = ATTRIBUTE_LABELS[area.attribute] ?? area.attribute
            const attrEmoji = ATTRIBUTE_EMOJIS[area.attribute] ?? '⭐'
            return (
              <div key={area.id} className="parch-card" style={{ padding: '20px', position: 'relative', overflow: 'hidden', borderColor: `${attrColor}30` }}>
                {/* Glow bar arriba */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, transparent, ${attrColor}, transparent)` }} />

                {/* Icon + nombre */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '12px', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem',
                    background: `${attrColor}15`, border: `1px solid ${attrColor}40`,
                  }}>{area.icon}</div>
                  <div>
                    <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '1rem', color: 'var(--text-primary)', letterSpacing: '0.5px' }}>
                      {area.name}
                    </h3>
                    {area.deity && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-gold)', marginTop: '2px' }}>
                        {DEITIES.find(d => d.name === area.deity)?.emoji ?? '⚡'} {area.deity}
                      </p>
                    )}
                  </div>
                </div>

                {/* Atributo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: area.location ? '10px' : 0 }}>
                  <span style={{ fontSize: '0.9rem' }}>{attrEmoji}</span>
                  <span style={{ fontSize: '0.82rem', color: attrColor, fontFamily: 'Cinzel, serif', fontWeight: 600 }}>{attrLabel}</span>
                </div>

                {/* Ubicación */}
                {area.location && (
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '14px' }}>
                    📍 {area.location}
                  </p>
                )}

                {/* Acciones */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <button onClick={() => openEdit(area)}
                    style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid rgba(212,175,55,0.25)', background: 'transparent', color: 'var(--text-gold)', cursor: 'pointer', fontFamily: 'Cinzel, serif', fontSize: '0.72rem', transition: 'var(--transition)' }}
                    onMouseEnter={e => { (e.currentTarget).style.background = 'rgba(212,175,55,0.10)' }}
                    onMouseLeave={e => { (e.currentTarget).style.background = 'transparent' }}
                  >✏️ Editar</button>
                  <button onClick={() => deleteArea(area.id, area.name)} disabled={deleting === area.id}
                    style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid rgba(255,23,68,0.2)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.72rem', transition: 'var(--transition)' }}
                    onMouseEnter={e => { (e.currentTarget).style.color = 'var(--danger)'; (e.currentTarget).style.borderColor = 'var(--danger)' }}
                    onMouseLeave={e => { (e.currentTarget).style.color = 'var(--text-secondary)'; (e.currentTarget).style.borderColor = 'rgba(255,23,68,0.2)' }}
                  >{deleting === area.id ? '⏳' : '🗑️'}</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {areas.length === 0 && (
        <div className="parch-card" style={{ padding: '56px', textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', opacity: 0.3, marginBottom: '16px' }}>🏛️</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Aún no creaste ningún santuario. ¡Crea el primero!
          </p>
          <button onClick={openCreate} className="btn-gold" style={{ marginTop: '20px' }}>+ Nuevo Santuario</button>
        </div>
      )}

      {/* ── MODAL crear/editar ── */}
      {showModal && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="modal-box" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.4rem', color: 'var(--text-gold)' }}>
                {editing ? '✏️ Editar Santuario' : '🏛️ Nuevo Santuario'}
              </h3>
              <button onClick={closeModal}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.8rem', cursor: 'pointer', transition: 'var(--transition)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >✕</button>
            </div>

            {/* Nombre */}
            <div className="form-group">
              <label>Nombre *</label>
              <input type="text" className="input-parch" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ej: Entrenamiento, Estudio, Meditación..." maxLength={40} autoFocus />
            </div>

            {/* Icono */}
            <div className="form-group">
              <label>Icono</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {ICON_OPTIONS.map(em => (
                  <button key={em} type="button" onClick={() => setForm(f => ({ ...f, icon: em }))}
                    style={{ fontSize: '1.3rem', padding: '6px', borderRadius: '8px', cursor: 'pointer', transition: 'var(--transition)', background: form.icon === em ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.03)', border: `2px solid ${form.icon === em ? 'var(--gold)' : 'rgba(255,255,255,0.08)'}` }}
                  >{em}</button>
                ))}
              </div>
            </div>

            {/* Divinidad */}
            <div className="form-group">
              <label>Dios Protector (opcional)</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {DEITIES.map(d => (
                  <button key={d.name} type="button" onClick={() => applyDeity(d)}
                    style={{
                      padding: '6px 10px', borderRadius: '16px', cursor: 'pointer', fontSize: '0.78rem',
                      fontFamily: 'Montserrat, sans-serif', transition: 'var(--transition)',
                      background: form.deity === d.name ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${form.deity === d.name ? 'var(--gold)' : 'rgba(255,255,255,0.10)'}`,
                      color: form.deity === d.name ? 'var(--gold-bright)' : 'var(--text-secondary)',
                    }}
                  >{d.emoji} {d.name}</button>
                ))}
                <button type="button" onClick={() => setForm(f => ({ ...f, deity: '' }))}
                  style={{ padding: '6px 10px', borderRadius: '16px', cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'Montserrat, sans-serif', background: !form.deity ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.10)', color: 'var(--text-muted)', transition: 'var(--transition)' }}
                >Sin dios</button>
              </div>
            </div>

            {/* Atributo */}
            <div className="form-group">
              <label>Atributo que potencia</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                {Object.entries(ATTRIBUTE_LABELS).map(([key, label]) => (
                  <button key={key} type="button" onClick={() => setForm(f => ({ ...f, attribute: key }))}
                    style={{
                      padding: '10px 4px', borderRadius: '8px', cursor: 'pointer', textAlign: 'center',
                      fontFamily: 'Cinzel, serif', fontSize: '0.62rem', letterSpacing: '0.04em', transition: 'var(--transition)',
                      background: form.attribute === key ? `${ATTR_COLORS[key]}20` : 'rgba(255,255,255,0.02)',
                      border: `2px solid ${form.attribute === key ? ATTR_COLORS[key] : 'rgba(255,255,255,0.08)'}`,
                      color: form.attribute === key ? ATTR_COLORS[key] : 'var(--text-secondary)',
                    }}
                  >
                    <div style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{ATTRIBUTE_EMOJIS[key]}</div>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ubicación */}
            <div className="form-group">
              <label>Ubicación mítica (opcional)</label>
              <input type="text" className="input-parch" value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && saveArea()}
                placeholder="Ej: Campos de guerra de Ares..." maxLength={80} />
            </div>

            {saveErr && (
              <div style={{ padding: '14px', borderRadius: '8px', background: 'var(--danger-bg)', border: '1px solid rgba(255,23,68,0.35)', color: '#ff6b6b', marginBottom: '20px', fontSize: '0.9rem', lineHeight: 1.5 }}>
                {saveErr}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={saveArea} disabled={saving || !form.name.trim()} className="btn-gold" style={{ flex: 1, justifyContent: 'center' }}>
                {saving ? '⏳ Guardando...' : editing ? '💾 Actualizar' : '🏛️ Crear Santuario'}
              </button>
              <button onClick={closeModal} className="btn-ghost">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
