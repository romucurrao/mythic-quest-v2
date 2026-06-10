'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Hero, God } from '@/lib/types/database.types'
import { createClient } from '@/lib/supabase/client'
import { ATTRIBUTE_EMOJIS, ATTRIBUTE_LABELS, ATTRIBUTE_COLORS } from '@/lib/utils/attributes'
import { LEVEL_TITLES, xpProgress, xpForNextLevel } from '@/lib/utils/xp'

interface Props { hero: Hero | null; gods: God[]; userId: string }

const CLASSES = [
  { id: 'guerrero',   label: '⚔️ Guerrero',   desc: 'Fuerza y disciplina. Nació para el combate.' },
  { id: 'sabio',      label: '📚 Sabio',        desc: 'Sabiduría y estrategia. La mente como arma.' },
  { id: 'explorador', label: '🏹 Explorador',   desc: 'Creatividad y aventura. Nunca se detiene.' },
  { id: 'artista',    label: '🎨 Artista',       desc: 'Creatividad y carisma. Inspira a los demás.' },
  { id: 'estratega',  label: '♟️ Estratega',    desc: 'Sabiduría y carisma. Piensa antes de actuar.' },
]
const AVATARS = ['⚔️','🛡️','🏹','📚','🎨','♟️','🌟','🔱','⚡','🦁','🦅','🐉','🌙','☀️','🏺']


export default function HeroClient({ hero, gods, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [editing, setEditing]     = useState(!hero)
  const [name, setName]           = useState(hero?.name ?? '')
  const [avatar, setAvatar]       = useState(hero?.avatar ?? '⚔️')
  const [patronGod, setPatronGod] = useState(hero?.patron_god ?? 'zeus')
  const [heroClass, setHeroClass] = useState(hero?.class ?? 'guerrero')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  const availableGods = gods.filter(g => g.unlock_level <= (hero?.level ?? 1))

  async function saveHero() {
    if (!name.trim()) { setError('El nombre no puede estar vacío.'); return }
    setSaving(true); setError('')
    const payload = { user_id: userId, name: name.trim(), avatar, patron_god: patronGod, class: heroClass } as Record<string, unknown>
    if (hero) {
      const { error: e } = await supabase.from('heroes').update(payload as never).eq('user_id', userId)
      if (e) { setError(e.message.includes('exist') ? '⚠️ Ejecuta el SQL en Supabase primero.' : 'Error al guardar.'); setSaving(false); return }
    } else {
      const { error: e } = await supabase.from('heroes').insert(payload as never)
      if (e) { setError(e.message.includes('exist') ? '⚠️ Ejecuta el SQL en Supabase primero.' : 'Error al crear.'); setSaving(false); return }
      await supabase.from('achievements').upsert([{ user_id: userId, achievement_key: 'hero_created' } as never])
    }
    setSaving(false); setEditing(false); router.refresh()
  }

  /* ── Formulario ── */
  if (editing) return (
    <div className="space-y-6 animate-fade-in" style={{ maxWidth: '680px' }}>
      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.5rem', color: 'var(--text-primary)', letterSpacing: '1px' }}>
            {hero ? '✏️ Editar Héroe' : '⚔️ Forja Tu Héroe'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '4px' }}>
            {hero ? 'Ajusta tu identidad en el Olimpo' : 'El Olimpo espera conocerte. ¿Quién eres?'}
          </p>
        </div>
        {hero && <button onClick={() => setEditing(false)} className="btn-ghost">← Volver</button>}
        {!hero && <Link href="/dashboard" className="btn-ghost">← Volver</Link>}
      </div>

      <div className="parch-card corner-ornament" style={{ padding: '28px' }}>
        {/* Avatar */}
        <div className="form-group">
          <label>Avatar del Héroe</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '8px' }}>
            {AVATARS.map(av => (
              <button key={av} onClick={() => setAvatar(av)}
                style={{
                  fontSize: '1.4rem', padding: '8px', borderRadius: '6px', cursor: 'pointer',
                  background: avatar === av ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.02)',
                  border: `2px solid ${avatar === av ? 'var(--gold)' : 'rgba(255,255,255,0.08)'}`,
                  transition: 'var(--transition)',
                }}
              >{av}</button>
            ))}
          </div>
        </div>

        {/* Nombre */}
        <div className="form-group">
          <label>Nombre del Héroe *</label>
          <input id="hero-name" type="text" value={name}
            onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveHero()}
            className="input-parch" placeholder="Perseo, Aquiles, Odiseo..." maxLength={40} autoFocus />
        </div>

        {/* Clase */}
        <div className="form-group">
          <label>Clase</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {CLASSES.map(cls => (
              <button key={cls.id} onClick={() => setHeroClass(cls.id)}
                style={{
                  padding: '12px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left',
                  background: heroClass === cls.id ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${heroClass === cls.id ? 'var(--gold)' : 'rgba(255,255,255,0.08)'}`,
                  transition: 'var(--transition)',
                }}
              >
                <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.85rem', marginBottom: '4px', color: heroClass === cls.id ? 'var(--gold-bright)' : 'var(--text-primary)' }}>{cls.label}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{cls.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Dios Patrono */}
        {availableGods.length > 0 && (
          <div className="form-group">
            <label>Dios Patrono</label>
            <select id="patron-god" value={patronGod} onChange={e => setPatronGod(e.target.value)} className="select-parch">
              {availableGods.map(g => <option key={g.slug} value={g.slug}>{g.emoji} {g.name} — {g.area}</option>)}
            </select>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '4px' }}>
              {gods.find(g => g.slug === patronGod)?.bonus_description}
            </p>
          </div>
        )}

        {error && (
          <div style={{ padding: '12px', borderRadius: '6px', background: 'var(--danger-bg)', border: '1px solid rgba(255,23,68,0.35)', color: '#ff6b6b', marginBottom: '18px', fontSize: '0.88rem' }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={saveHero} disabled={saving || !name.trim()} className="btn-gold" style={{ flex: 1, justifyContent: 'center' }}>
            {saving ? '⏳ Forjando...' : '⚔️ Guardar Héroe'}
          </button>
          {hero
            ? <button onClick={() => setEditing(false)} className="btn-ghost">Cancelar</button>
            : <Link href="/dashboard" className="btn-ghost">Cancelar</Link>
          }
        </div>
      </div>
    </div>
  )

  /* ── Vista de perfil ── */
  const progress  = xpProgress(hero!.xp, hero!.level)
  const nextLvlXp = xpForNextLevel(hero!.level)
  const title     = LEVEL_TITLES[hero!.level]
  const god       = gods.find(g => g.slug === hero!.patron_god)
  const cls       = CLASSES.find(c => c.id === hero!.class)

  return (
    <div className="animate-fade-in" style={{ maxWidth: '680px' }}>
      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.5rem', color: 'var(--text-primary)', letterSpacing: '1px' }}>⚔️ Mi Héroe</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>Tu identidad en el Olimpo</p>
        </div>
        <button onClick={() => setEditing(true)} className="btn-ghost">✏️ Editar</button>
      </div>

      {/* Card principal */}
      <div className="parch-card corner-ornament" style={{ padding: '28px', marginBottom: '20px' }}>
        {/* Avatar + nombre */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
          <div className="animate-glow" style={{
            width: '72px', height: '72px', borderRadius: '50%', flexShrink: 0,
            background: 'var(--bg-deep)', border: '2px solid var(--gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', boxShadow: '0 0 15px var(--gold-glow)',
          }}>{hero!.avatar}</div>
          <div>
            <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '4px' }}>{hero!.name}</h2>
            <p style={{ fontFamily: 'Cinzel, serif', fontSize: '0.82rem', color: 'var(--text-gold)' }}>
              {title} · {cls?.label}
            </p>
          </div>
        </div>

        {/* Stats en fila — alineados por grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          {[
            { icon: '🏅', val: hero!.level, label: 'Nivel' },
            { icon: '🔥', val: hero!.streak, label: 'Racha' },
            { icon: '💰', val: hero!.gold,   label: 'Oro' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '8px', padding: '14px 10px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.2rem', marginBottom: '6px', lineHeight: 1 }}>{s.icon}</div>
              <div style={{ fontFamily: 'Cinzel, serif', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-gold)', marginBottom: '4px', lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* XP bar */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'Cinzel, serif', marginBottom: '6px' }}>
            <span>{hero!.xp.toLocaleString()} XP</span>
            <span>{progress}% → Nv.{hero!.level + 1} ({nextLvlXp.toLocaleString()} XP)</span>
          </div>
          <div className="progress-parch"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
        </div>

        {/* Dios patrono */}
        {god && (
          <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)' }}>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              Patrono: <strong style={{ color: 'var(--text-gold)' }}>{god.emoji} {god.name}</strong> — {god.bonus_description}
            </p>
          </div>
        )}
      </div>

      {/* Atributos */}
      <div className="parch-card" style={{ padding: '24px', marginBottom: '20px' }}>
        <div className="divider-ornament" style={{ marginBottom: '18px' }}>
          <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.8rem', color: 'var(--text-gold)', letterSpacing: '0.1em' }}>ATRIBUTOS</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {(['strength','wisdom','discipline','charisma','creativity'] as const).map(k => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.2rem', width: '28px', textAlign: 'center', flexShrink: 0 }}>{ATTRIBUTE_EMOJIS[k]}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{ATTRIBUTE_LABELS[k]}</span>
                  <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.78rem', fontWeight: 700, color: ATTRIBUTE_COLORS[k] }}>{hero![k]}</span>
                </div>
                <div className="progress-parch" style={{ height: '8px' }}>
                  <div className="progress-fill" style={{ width: `${Math.min(100, hero![k])}%`, background: ATTRIBUTE_COLORS[k] }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
