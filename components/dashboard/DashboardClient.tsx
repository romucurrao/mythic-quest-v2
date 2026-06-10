'use client'

import Link from 'next/link'
import { Hero, Quest, Achievement } from '@/lib/types/database.types'
import { xpProgress, xpForNextLevel, LEVEL_TITLES } from '@/lib/utils/xp'
import { ATTRIBUTE_EMOJIS, ATTRIBUTE_LABELS, ATTRIBUTE_COLORS, getArgentinaDateLabel } from '@/lib/utils/attributes'
import { ACHIEVEMENTS_CATALOG } from '@/lib/utils/achievements'

interface Props { hero: Hero | null; quests: Quest[]; achievements: Achievement[]; userId: string }

export default function DashboardClient({ hero, quests, achievements }: Props) {
  /* ── Sin héroe ── */
  if (!hero) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="parch-card corner-ornament animate-fade-in" style={{ padding: '48px', textAlign: 'center', maxWidth: '480px', width: '100%' }}>
        <div style={{ fontSize: '4rem', marginBottom: '16px' }} className="animate-float">🌅</div>
        <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '12px' }}>
          Tu leyenda aún no comienza
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.7 }}>
          Los dioses del Olimpo aguardan conocerte. Forja tu identidad y da el primer paso hacia la inmortalidad.
        </p>
        <Link href="/hero" className="btn-gold">⚔️ Crear Mi Héroe</Link>
      </div>
    </div>
  )

  const dateLabel     = getArgentinaDateLabel()
  const progress      = xpProgress(hero.xp, hero.level)
  const nextLevelXp   = xpForNextLevel(hero.level)
  const title         = LEVEL_TITLES[hero.level] ?? 'Héroe'
  const pending       = quests.filter(q => !q.is_completed && q.frequency === 'diaria')
  const completedToday = quests.filter(q => q.is_completed).length
  const totalDaily    = quests.filter(q => q.frequency === 'diaria').length

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Fecha */}
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
        📅 {dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}
      </p>

      {/* ── Héroe ── */}
      <div className="parch-card corner-ornament" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
          {/* Avatar */}
          <Link href="/hero" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ position: 'relative' }}>
              <div className="animate-glow" style={{
                width: '65px', height: '65px', borderRadius: '50%',
                background: 'var(--bg-deep)', border: '2px solid var(--gold)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.8rem', boxShadow: '0 0 15px var(--gold-glow)',
              }}>{hero.avatar}</div>
              <div style={{
                position: 'absolute', bottom: '-5px', right: '-5px',
                background: 'var(--gold)', color: 'var(--bg-dark)',
                fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: '0.72rem',
                width: '22px', height: '22px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid var(--bg-dark)',
              }}>{hero.level}</div>
            </div>
          </Link>

          {/* Info */}
          <div style={{ flex: 1, minWidth: '180px' }}>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: '1.1rem', color: 'var(--text-gold)', marginBottom: '4px' }}>{hero.name}</div>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              {title} · {hero.class}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', height: '10px', borderRadius: '5px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '4px' }}>
              <div style={{ background: 'linear-gradient(90deg, var(--purple), var(--gold))', width: `${progress}%`, height: '100%', transition: 'width 0.6s ease', borderRadius: '5px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'Cinzel, serif' }}>
              <span>{hero.xp.toLocaleString()} XP</span>
              <span>{progress}% hacia Nv.{hero.level + 1}</span>
            </div>
          </div>

          {/* Racha + Oro */}
          <div style={{ display: 'flex', gap: '16px', flexShrink: 0 }}>
            {[{ icon:'🔥', val: hero.streak, label:'Racha' }, { icon:'💰', val: hero.gold, label:'Oro' }].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem', lineHeight: 1, marginBottom: '4px' }}>{s.icon}</div>
                <div style={{ fontFamily: 'Cinzel, serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-gold)', lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.58rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '3px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Atributos mini */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '16px', paddingTop: '14px', display: 'flex', gap: '10px' }}>
          {(['strength','wisdom','discipline','charisma','creativity'] as const).map(k => (
            <div key={k} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', marginBottom: '3px' }}>{ATTRIBUTE_EMOJIS[k]}</div>
              <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.8rem', fontWeight: 700, color: ATTRIBUTE_COLORS[k] }}>{hero[k]}</div>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginTop: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, hero[k])}%`, height: '100%', background: ATTRIBUTE_COLORS[k], borderRadius: '2px' }} />
              </div>
              <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.5rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '3px' }}>{ATTRIBUTE_LABELS[k].slice(0,3)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stats rápidos ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' }}>
        {[
          { icon:'📜', label:'Hoy', val:`${completedToday}/${totalDaily}` },
          { icon:'⏳', label:'Pendientes', val: pending.length },
          { icon:'⚔️', label:'Totales', val: hero.total_quests_completed },
          { icon:'🏆', label:'Hazañas', val:`${achievements.length}/${ACHIEVEMENTS_CATALOG.length}` },
        ].map((s,i) => (
          <div key={i} className="stat-card">
            <div style={{ fontSize: '1.4rem', marginBottom: '6px' }}>{s.icon}</div>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-gold)' }}>{s.val}</div>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Misiones del día — SECCIÓN PRINCIPAL ── */}
      <div className="parch-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.1rem', color: 'var(--text-primary)', letterSpacing: '1px' }}>📜 Misiones del Día</h2>
            {totalDaily > 0 && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', height: '6px', borderRadius: '3px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', width: '200px' }}>
                  <div style={{ background: 'linear-gradient(90deg, var(--purple), var(--gold))', width: `${(completedToday/totalDaily)*100}%`, height: '100%', borderRadius: '3px', transition: 'width 0.5s ease' }} />
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'Cinzel, serif', marginTop: '3px', display: 'block' }}>{completedToday} de {totalDaily} completadas</span>
              </div>
            )}
          </div>
          <Link href="/quests" className="btn-gold" style={{ fontSize: '0.75rem' }}>Ver Todas →</Link>
        </div>

        {pending.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px' }}>
            <div style={{ fontSize: '2.5rem', opacity: 0.3, color: 'var(--gold)', marginBottom: '10px' }}>
              {quests.length === 0 ? '📜' : '✨'}
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              {quests.length === 0 ? 'Sin misiones. ¡Crea la primera!' : '¡Todas las misiones completadas hoy!'}
            </p>
            {quests.length === 0 && <Link href="/quests" className="btn-gold" style={{ display: 'inline-flex', marginTop: '14px' }}>+ Crear Misión</Link>}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pending.slice(0, 5).map(q => (
              <div key={q.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px',
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px',
              }}>
                <div style={{
                  width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                  border: '2px solid var(--gold)', background: 'var(--bg-deep)',
                }} />
                <span style={{ flex: 1, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.name}</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-gold)', fontWeight: 600, flexShrink: 0 }}>+{q.xp_reward} XP</span>
              </div>
            ))}
            {pending.length > 5 && (
              <Link href="/quests" style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-gold)', textDecoration: 'none', fontStyle: 'italic', display: 'block', paddingTop: '4px' }}>
                +{pending.length - 5} misiones más →
              </Link>
            )}
          </div>
        )}
      </div>

    </div>
  )
}
