'use client'

import { useState } from 'react'
import { Achievement } from '@/lib/types/database.types'
import { ACHIEVEMENTS_CATALOG } from '@/lib/utils/achievements'

interface Props {
  achievements: any[]
  hero?: any
}
function formatDate(iso: string) {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(iso))
}

export default function AchievementsClient({ achievements }: Props) {
  const unlockedKeys = new Set(achievements.map(a => a.achievement_key))
  const unlockedCount = unlockedKeys.size
  const totalCount = ACHIEVEMENTS_CATALOG.length

  const [selected, setSelected] = useState<typeof ACHIEVEMENTS_CATALOG[0] | null>(null)

  const selectedRecord = selected ? achievements.find(a => a.achievement_key === selected.key) : null
  const isSelectedUnlocked = selected ? unlockedKeys.has(selected.key) : false

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.6rem', color: 'var(--text-primary)', letterSpacing: '1px' }}>🏆 Hazañas</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>Los dioses recuerdan tus logros por toda la eternidad</p>
        </div>
        <div className="badge-gold" style={{ fontSize: '0.85rem', padding: '6px 14px', alignSelf: 'flex-start' }}>
          {unlockedCount} / {totalCount} desbloqueadas
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="parch-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontFamily: 'Cinzel, serif', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          <span>Progreso de hazañas</span>
          <span style={{ color: 'var(--text-gold)' }}>{Math.round((unlockedCount / totalCount) * 100)}%</span>
        </div>
        <div className="progress-parch">
          <div className="progress-fill" style={{ width: `${(unlockedCount / totalCount) * 100}%` }} />
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
          {totalCount - unlockedCount > 0
            ? `Te quedan ${totalCount - unlockedCount} hazañas por conquistar`
            : '¡Hazañas completas! Eres una leyenda del Olimpo 🌟'}
        </p>
      </div>

      {/* ── GRILLA DE TILES ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: '14px' }}>
        {ACHIEVEMENTS_CATALOG.map((ach, idx) => {
          const unlocked = unlockedKeys.has(ach.key)

          // Paleta de colores por tipo de hazaña
          const colorMap: Record<string, { bg: string; border: string; glow: string }> = {
            first_quest:   { bg: 'rgba(255,215,0,0.08)',    border: 'rgba(255,215,0,0.3)',    glow: 'rgba(255,215,0,0.2)' },
            quests_10:     { bg: 'rgba(255,165,0,0.08)',    border: 'rgba(255,165,0,0.3)',    glow: 'rgba(255,165,0,0.2)' },
            quests_50:     { bg: 'rgba(255,100,0,0.08)',    border: 'rgba(255,100,0,0.3)',    glow: 'rgba(255,100,0,0.2)' },
            quests_100:    { bg: 'rgba(212,175,55,0.10)',   border: 'rgba(212,175,55,0.4)',   glow: 'rgba(212,175,55,0.3)' },
            streak_3:      { bg: 'rgba(255,80,80,0.08)',    border: 'rgba(255,80,80,0.3)',    glow: 'rgba(255,80,80,0.2)' },
            streak_7:      { bg: 'rgba(255,50,50,0.10)',    border: 'rgba(255,50,50,0.35)',   glow: 'rgba(255,50,50,0.25)' },
            streak_30:     { bg: 'rgba(180,30,30,0.10)',    border: 'rgba(180,30,30,0.4)',    glow: 'rgba(180,30,30,0.25)' },
            streak_90:     { bg: 'rgba(138,43,226,0.12)',   border: 'rgba(138,43,226,0.4)',   glow: 'rgba(138,43,226,0.3)' },
            level_5:       { bg: 'rgba(0,200,255,0.07)',    border: 'rgba(0,200,255,0.28)',   glow: 'rgba(0,200,255,0.18)' },
            level_10:      { bg: 'rgba(0,150,255,0.09)',    border: 'rgba(0,150,255,0.35)',   glow: 'rgba(0,150,255,0.22)' },
            level_20:      { bg: 'rgba(80,0,255,0.10)',     border: 'rgba(80,0,255,0.38)',    glow: 'rgba(80,0,255,0.25)' },
            level_30:      { bg: 'rgba(212,175,55,0.14)',   border: 'rgba(212,175,55,0.55)',  glow: 'rgba(212,175,55,0.4)' },
            gold_100:      { bg: 'rgba(205,127,50,0.08)',   border: 'rgba(205,127,50,0.3)',   glow: 'rgba(205,127,50,0.2)' },
            gold_1000:     { bg: 'rgba(212,175,55,0.10)',   border: 'rgba(212,175,55,0.4)',   glow: 'rgba(212,175,55,0.3)' },
            hero_created:  { bg: 'rgba(0,230,118,0.08)',    border: 'rgba(0,230,118,0.3)',    glow: 'rgba(0,230,118,0.2)' },
            first_chapter: { bg: 'rgba(0,242,254,0.07)',    border: 'rgba(0,242,254,0.28)',   glow: 'rgba(0,242,254,0.18)' },
            chapters_5:    { bg: 'rgba(0,200,220,0.09)',    border: 'rgba(0,200,220,0.35)',   glow: 'rgba(0,200,220,0.22)' },
          }
          const palette = colorMap[ach.key] ?? { bg: 'rgba(100,100,150,0.07)', border: 'rgba(100,100,150,0.25)', glow: 'rgba(100,100,150,0.15)' }

          return (
            <button
              key={ach.key}
              onClick={() => setSelected(ach)}
              title={ach.title}
              style={{
                background: unlocked ? palette.bg : 'rgba(20,20,35,0.6)',
                border: `2px solid ${unlocked ? palette.border : 'rgba(60,60,90,0.4)'}`,
                borderRadius: '14px',
                padding: '22px 14px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: unlocked ? `0 4px 20px ${palette.glow}` : 'none',
                filter: unlocked ? 'none' : 'saturate(0.2)',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget
                if (unlocked) { el.style.transform = 'translateY(-4px)'; el.style.boxShadow = `0 8px 30px ${palette.glow}` }
                else { el.style.transform = 'translateY(-2px)'; el.style.filter = 'saturate(0.4)' }
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.transform = 'none'
                el.style.boxShadow = unlocked ? `0 4px 20px ${palette.glow}` : 'none'
                el.style.filter = unlocked ? 'none' : 'saturate(0.2)'
              }}
            >
              {/* Shimmer overlay */}
              {unlocked && (
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '14px', pointerEvents: 'none',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%)',
                }} />
              )}

              {/* Número de orden */}
              <div style={{ position: 'absolute', top: '8px', left: '10px', fontFamily: 'Cinzel, serif', fontSize: '0.55rem', color: unlocked ? palette.border : 'rgba(100,100,130,0.5)', letterSpacing: '0.05em' }}>
                #{String(idx + 1).padStart(2, '0')}
              </div>

              {/* Ícono */}
              <div style={{ fontSize: '2.6rem', marginBottom: '12px', display: 'block', lineHeight: 1 }}>
                {unlocked ? ach.emoji : '🔒'}
              </div>

              {/* Nombre */}
              <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.7rem', letterSpacing: '0.04em', lineHeight: 1.4, color: unlocked ? '#f0f2f5' : 'rgba(120,125,160,0.7)', marginTop: '4px' }}>
                {ach.title}
              </div>

              {/* Badge obtenida */}
              {unlocked && (
                <div style={{ marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.6rem', color: 'var(--success)', fontFamily: 'Cinzel, serif', background: 'var(--success-bg)', border: '1px solid rgba(0,230,118,0.25)', borderRadius: '10px', padding: '2px 8px' }}>
                  ✓ Obtenida
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* ── MODAL detalle ── */}
      {selected && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setSelected(null) }}>
          <div className="modal-box" style={{ maxWidth: '420px', textAlign: 'center' }}>
            {/* Cerrar */}
            <button onClick={() => setSelected(null)}
              style={{ position: 'absolute', top: '16px', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.6rem', cursor: 'pointer', transition: 'var(--transition)', zIndex: 2 }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >✕</button>

            {/* Ícono grande */}
            <div style={{
              width: '96px', height: '96px', borderRadius: '50%', margin: '0 auto 20px',
              background: isSelectedUnlocked ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.04)',
              border: `3px solid ${isSelectedUnlocked ? 'var(--gold)' : 'rgba(255,255,255,0.10)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem',
              boxShadow: isSelectedUnlocked ? '0 0 30px rgba(212,175,55,0.30)' : 'none',
              filter: isSelectedUnlocked ? 'none' : 'grayscale(1)',
            }} className={isSelectedUnlocked ? 'animate-glow' : ''}>
              {isSelectedUnlocked ? selected.emoji : '🔒'}
            </div>

            {/* Título */}
            <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.3rem', color: isSelectedUnlocked ? 'var(--text-gold)' : 'var(--text-secondary)', marginBottom: '10px', letterSpacing: '1px' }}>
              {selected.title}
            </h3>

            {/* Estado */}
            <div style={{ marginBottom: '16px' }}>
              {isSelectedUnlocked ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: 'Cinzel, serif', fontSize: '0.8rem', color: 'var(--success)', background: 'var(--success-bg)', border: '1px solid rgba(0,230,118,0.3)', borderRadius: '20px', padding: '5px 14px' }}>
                  ✓ Hazaña desbloqueada
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: 'Cinzel, serif', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '20px', padding: '5px 14px' }}>
                  🔒 Bloqueada
                </span>
              )}
            </div>

            {/* Descripción — lo que hiciste */}
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.7, marginBottom: '16px' }}>
              {isSelectedUnlocked
                ? `Lograste: ${selected.description.toLowerCase()}.`
                : `Para obtenerla: ${selected.description.toLowerCase()}.`}
            </p>

            {/* Fecha si está desbloqueada */}
            {isSelectedUnlocked && selectedRecord && (
              <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.18)' }}>
                <p style={{ fontFamily: 'Cinzel, serif', fontSize: '0.78rem', color: 'var(--text-gold)', letterSpacing: '0.04em' }}>
                  📅 Desbloqueada el {formatDate(selectedRecord.unlocked_at)}
                </p>
              </div>
            )}

            {/* Botón cerrar */}
            <button onClick={() => setSelected(null)} className="btn-ghost" style={{ marginTop: '20px', width: '100%', justifyContent: 'center' }}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
