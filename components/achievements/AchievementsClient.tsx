'use client'

import { useState } from 'react'
import { Achievement } from '@/lib/types/database.types'
import { ACHIEVEMENTS_CATALOG } from '@/lib/utils/achievements'
import { MYTH_CATALOG, TYPE_LABELS, TYPE_COLORS, MythEntry } from '@/lib/utils/mythology'

interface Props { achievements: Achievement[]; heroLevel: number }

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(iso))
}

export default function AchievementsClient({ achievements, heroLevel }: Props) {
  const unlockedKeys  = new Set(achievements.map(a => a.achievement_key))
  const unlockedCount = unlockedKeys.size
  const totalCount    = ACHIEVEMENTS_CATALOG.length

  const [selected, setSelected]         = useState<typeof ACHIEVEMENTS_CATALOG[0] | null>(null)
  const [selectedMyth, setSelectedMyth] = useState<MythEntry | null>(null)
  const [activeTab, setActiveTab]       = useState<'hazanas' | 'bestias'>('hazanas')

  const selectedRecord      = selected ? achievements.find(a => a.achievement_key === selected.key) : null
  const isSelectedUnlocked  = selected ? unlockedKeys.has(selected.key) : false
  const unlockedMythCount   = MYTH_CATALOG.filter(m => m.level <= heroLevel).length

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

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.6rem', color: 'var(--text-primary)', letterSpacing: '1px' }}>🏆 Hazañas</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>Los dioses recuerdan tus logros por toda la eternidad</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={() => setActiveTab('hazanas')} className={`tab-btn${activeTab === 'hazanas' ? ' active' : ''}`}>
          🏆 Hazañas ({unlockedCount}/{totalCount})
        </button>
        <button onClick={() => setActiveTab('bestias')} className={`tab-btn${activeTab === 'bestias' ? ' active' : ''}`}>
          🐉 Bestiario ({unlockedMythCount}/{MYTH_CATALOG.length})
        </button>
      </div>

      {/* ─────────── TAB: HAZAÑAS ─────────── */}
      {activeTab === 'hazanas' && (
        <>
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: '14px' }}>
            {ACHIEVEMENTS_CATALOG.map((ach, idx) => {
              const unlocked = unlockedKeys.has(ach.key)
              const palette  = colorMap[ach.key] ?? { bg: 'rgba(100,100,150,0.07)', border: 'rgba(100,100,150,0.25)', glow: 'rgba(100,100,150,0.15)' }
              return (
                <button key={ach.key} onClick={() => setSelected(ach)} title={ach.title}
                  style={{
                    background: unlocked ? palette.bg : 'rgba(20,20,35,0.6)',
                    border: `2px solid ${unlocked ? palette.border : 'rgba(60,60,90,0.4)'}`,
                    borderRadius: '14px', padding: '22px 14px', textAlign: 'center', cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.25,0.8,0.25,1)', position: 'relative', overflow: 'hidden',
                    boxShadow: unlocked ? `0 4px 20px ${palette.glow}` : 'none',
                    filter: unlocked ? 'none' : 'saturate(0.2)',
                  }}
                  onMouseEnter={e => { const el = e.currentTarget; if (unlocked) { el.style.transform = 'translateY(-4px)'; el.style.boxShadow = `0 8px 30px ${palette.glow}` } else { el.style.transform = 'translateY(-2px)'; el.style.filter = 'saturate(0.4)' } }}
                  onMouseLeave={e => { const el = e.currentTarget; el.style.transform = 'none'; el.style.boxShadow = unlocked ? `0 4px 20px ${palette.glow}` : 'none'; el.style.filter = unlocked ? 'none' : 'saturate(0.2)' }}
                >
                  {unlocked && <div style={{ position: 'absolute', inset: 0, borderRadius: '14px', pointerEvents: 'none', background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%)' }} />}
                  <div style={{ position: 'absolute', top: '8px', left: '10px', fontFamily: 'Cinzel, serif', fontSize: '0.55rem', color: unlocked ? palette.border : 'rgba(100,100,130,0.5)', letterSpacing: '0.05em' }}>#{String(idx + 1).padStart(2,'0')}</div>
                  <div style={{ fontSize: '2.6rem', marginBottom: '12px', display: 'block', lineHeight: 1 }}>{unlocked ? ach.emoji : '🔒'}</div>
                  <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.7rem', letterSpacing: '0.04em', lineHeight: 1.4, color: unlocked ? '#f0f2f5' : 'rgba(120,125,160,0.7)', marginTop: '4px' }}>{ach.title}</div>
                  {unlocked && <div style={{ marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.6rem', color: 'var(--success)', fontFamily: 'Cinzel, serif', background: 'var(--success-bg)', border: '1px solid rgba(0,230,118,0.25)', borderRadius: '10px', padding: '2px 8px' }}>✓ Obtenida</div>}
                </button>
              )
            })}
          </div>
        </>
      )}

      {/* ─────────── TAB: BESTIARIO ─────────── */}
      {activeTab === 'bestias' && (
        <>
          <div className="parch-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontFamily: 'Cinzel, serif', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <span>Bestias y héroes descubiertos</span>
              <span style={{ color: 'var(--text-gold)' }}>{Math.round((unlockedMythCount / MYTH_CATALOG.length) * 100)}%</span>
            </div>
            <div className="progress-parch">
              <div className="progress-fill" style={{ width: `${(unlockedMythCount / MYTH_CATALOG.length) * 100}%`, background: 'linear-gradient(90deg, #c0392b, #e74c3c)' }} />
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Nivel actual: <strong style={{ color: 'var(--text-gold)' }}>Nv.{heroLevel}</strong>
              {' · '} Descubrís 1 nuevo ser mitológico por nivel
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))', gap: '14px' }}>
            {MYTH_CATALOG.map((myth) => {
              const unlocked = myth.level <= heroLevel
              const tc       = TYPE_COLORS[myth.type]
              return (
                <button key={myth.level} onClick={() => setSelectedMyth(myth)} title={myth.name}
                  style={{
                    background: unlocked ? tc.bg : 'rgba(20,20,35,0.6)',
                    border: `2px solid ${unlocked ? tc.border : 'rgba(60,60,90,0.35)'}`,
                    borderRadius: '14px', padding: '20px 12px', textAlign: 'center', cursor: 'pointer',
                    transition: 'all 0.3s', position: 'relative', overflow: 'hidden',
                    filter: unlocked ? 'none' : 'saturate(0) brightness(0.5)',
                    boxShadow: unlocked ? `0 4px 18px ${tc.bg}` : 'none',
                  }}
                  onMouseEnter={e => { const el = e.currentTarget; el.style.transform = 'translateY(-4px)'; if (unlocked) el.style.boxShadow = `0 8px 28px ${tc.bg}` }}
                  onMouseLeave={e => { const el = e.currentTarget; el.style.transform = 'none'; el.style.boxShadow = unlocked ? `0 4px 18px ${tc.bg}` : 'none' }}
                >
                  {/* Nivel badge */}
                  <div style={{ position: 'absolute', top: '8px', right: '8px', fontFamily: 'Cinzel, serif', fontSize: '0.55rem', background: unlocked ? tc.border : 'rgba(60,60,90,0.5)', color: unlocked ? '#000' : 'rgba(120,125,160,0.6)', borderRadius: '8px', padding: '2px 6px', fontWeight: 700 }}>
                    Nv.{myth.level}
                  </div>

                  <div style={{ fontSize: '2.8rem', marginBottom: '10px', display: 'block', lineHeight: 1 }}>
                    {unlocked ? myth.emoji : '🔒'}
                  </div>

                  <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.72rem', letterSpacing: '0.04em', lineHeight: 1.4, color: unlocked ? '#f0f2f5' : 'rgba(120,125,160,0.5)', marginBottom: '8px' }}>
                    {unlocked ? myth.name : '???'}
                  </div>

                  {unlocked && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.58rem', color: tc.text, background: tc.bg, border: `1px solid ${tc.border}`, borderRadius: '8px', padding: '2px 7px', fontFamily: 'Cinzel, serif', letterSpacing: '0.04em' }}>
                      {TYPE_LABELS[myth.type]}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}

      {/* ── MODAL hazaña ── */}
      {selected && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setSelected(null) }}>
          <div className="modal-box" style={{ maxWidth: '420px', textAlign: 'center' }}>
            <button onClick={() => setSelected(null)}
              style={{ position: 'absolute', top: '16px', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.6rem', cursor: 'pointer', transition: 'var(--transition)', zIndex: 2 }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >✕</button>

            <div style={{ width: '96px', height: '96px', borderRadius: '50%', margin: '0 auto 20px', background: isSelectedUnlocked ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.04)', border: `3px solid ${isSelectedUnlocked ? 'var(--gold)' : 'rgba(255,255,255,0.10)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', boxShadow: isSelectedUnlocked ? '0 0 30px rgba(212,175,55,0.30)' : 'none', filter: isSelectedUnlocked ? 'none' : 'grayscale(1)' }} className={isSelectedUnlocked ? 'animate-glow' : ''}>
              {isSelectedUnlocked ? selected.emoji : '🔒'}
            </div>

            <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.3rem', color: isSelectedUnlocked ? 'var(--text-gold)' : 'var(--text-secondary)', marginBottom: '10px', letterSpacing: '1px' }}>{selected.title}</h3>
            <div style={{ marginBottom: '16px' }}>
              {isSelectedUnlocked
                ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: 'Cinzel, serif', fontSize: '0.8rem', color: 'var(--success)', background: 'var(--success-bg)', border: '1px solid rgba(0,230,118,0.3)', borderRadius: '20px', padding: '5px 14px' }}>✓ Hazaña desbloqueada</span>
                : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: 'Cinzel, serif', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '20px', padding: '5px 14px' }}>🔒 Bloqueada</span>}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.7, marginBottom: '16px' }}>
              {isSelectedUnlocked ? `Lograste: ${selected.description.toLowerCase()}.` : `Para obtenerla: ${selected.description.toLowerCase()}.`}
            </p>
            {isSelectedUnlocked && selectedRecord && (
              <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.18)' }}>
                <p style={{ fontFamily: 'Cinzel, serif', fontSize: '0.78rem', color: 'var(--text-gold)', letterSpacing: '0.04em' }}>
                  📅 Desbloqueada el {formatDate(selectedRecord.unlocked_at)}
                </p>
              </div>
            )}
            <button onClick={() => setSelected(null)} className="btn-ghost" style={{ marginTop: '20px', width: '100%', justifyContent: 'center' }}>Cerrar</button>
          </div>
        </div>
      )}

      {/* ── MODAL bestiario ── */}
      {selectedMyth && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setSelectedMyth(null) }}>
          <div className="modal-box" style={{ maxWidth: '440px', textAlign: 'center' }}>
            <button onClick={() => setSelectedMyth(null)}
              style={{ position: 'absolute', top: '16px', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.6rem', cursor: 'pointer', zIndex: 2 }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >✕</button>

            {(() => {
              const unlocked = selectedMyth.level <= heroLevel
              const tc       = TYPE_COLORS[selectedMyth.type]
              return (
                <>
                  <div style={{ width: '100px', height: '100px', borderRadius: '50%', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.2rem', background: unlocked ? tc.bg : 'rgba(255,255,255,0.03)', border: `3px solid ${unlocked ? tc.border : 'rgba(255,255,255,0.10)'}`, boxShadow: unlocked ? `0 0 30px ${tc.bg}` : 'none', filter: unlocked ? 'none' : 'grayscale(1)' }}>
                    {unlocked ? selectedMyth.emoji : '🔒'}
                  </div>

                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: 'Cinzel, serif', fontSize: '0.72rem', color: tc.text, background: tc.bg, border: `1px solid ${tc.border}`, borderRadius: '12px', padding: '4px 12px', marginBottom: '12px' }}>
                    {TYPE_LABELS[selectedMyth.type]}
                  </div>

                  <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.4rem', color: unlocked ? '#f0f2f5' : 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '1px' }}>
                    {unlocked ? selectedMyth.name : '???'}
                  </h3>

                  <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.78rem', color: unlocked ? tc.text : 'var(--text-muted)', marginBottom: '16px' }}>
                    Requiere Nivel {selectedMyth.level}
                  </div>

                  {unlocked ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.75, marginBottom: '20px' }}>
                      {selectedMyth.description}
                    </p>
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', marginBottom: '20px' }}>
                      Alcanza el Nivel {selectedMyth.level} para descubrir este ser de la mitología griega.
                    </p>
                  )}

                  <button onClick={() => setSelectedMyth(null)} className="btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>Cerrar</button>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
