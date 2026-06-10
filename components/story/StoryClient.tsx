'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StoryChapter, StoryChoice, UserStoryProgress, Hero } from '@/lib/types/database.types'
import { createClient } from '@/lib/supabase/client'

interface Props {
  chapters: StoryChapter[]
  hero: Hero | null
  progress: (UserStoryProgress & { story_choices?: StoryChoice })[]
  choices: StoryChoice[]
  userId: string
}

export default function StoryClient({ chapters, hero, progress, choices, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [activeChapter, setActiveChapter] = useState<StoryChapter | null>(null)
  const [toast, setToast] = useState('')

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3500) }

  function getStatus(chapter: StoryChapter): 'locked' | 'unlocked' | 'completed' {
    if (!hero) return 'locked'
    const prog = progress.find(p => p.chapter_id === chapter.id)
    if (prog) return prog.status as 'locked' | 'unlocked' | 'completed'
    return (hero.level >= chapter.unlock_level && hero.total_quests_completed >= chapter.unlock_quests_count) ? 'unlocked' : 'locked'
  }

  async function openChapter(chapter: StoryChapter, status: string) {
    if (status === 'locked') return
    setActiveChapter(chapter)
    const existing = progress.find(p => p.chapter_id === chapter.id)
    if (!existing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await supabase.from('user_story_progress').upsert([{ user_id: userId, chapter_id: chapter.id, status: 'unlocked', unlocked_at: new Date().toISOString() }] as any)
    }
  }

  async function makeChoice(chapter: StoryChapter, choice: StoryChoice) {
    if (!hero) return
    if (choice.effect_type === 'attribute' && choice.effect_target) {
      const valid = ['strength','wisdom','discipline','charisma','creativity']
      if (valid.includes(choice.effect_target)) {
        const cur = hero[choice.effect_target as keyof Pick<Hero,'strength'|'wisdom'|'discipline'|'charisma'|'creativity'>] as number
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await supabase.from('heroes').update({ [choice.effect_target]: cur + choice.effect_value } as any).eq('user_id', userId)
      }
    } else if (choice.effect_type === 'gold') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await supabase.from('heroes').update({ gold: hero.gold + choice.effect_value } as any).eq('user_id', userId)
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from('user_story_progress').upsert([{ user_id: userId, chapter_id: chapter.id, status: 'completed', completed_at: new Date().toISOString(), choice_made: choice.id }] as any, { onConflict: 'user_id,chapter_id' })
    showToast(`✨ ${choice.consequence ?? 'Decisión tomada.'}`)
    setActiveChapter(null)
    router.refresh()
  }

  const chapterChoices = (id: string) => choices.filter(c => c.chapter_id === id)

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {toast && <div className="toast">{toast}</div>}

      {/* Header — fuente grande */}
      <div>
        <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: '2rem', color: 'var(--text-primary)', letterSpacing: '2px', marginBottom: '8px' }}>
          📖 Historia del Héroe
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', fontStyle: 'italic' }}>
          Tu leyenda se escribe con cada hábito cumplido
        </p>
      </div>

      {!hero ? (
        <div className="parch-card" style={{ padding: '56px', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📖</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', fontStyle: 'italic' }}>
            Crea tu héroe para comenzar tu historia en el Olimpo.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {chapters.map((chapter, idx) => {
            const status = getStatus(chapter)
            const prog = progress.find(p => p.chapter_id === chapter.id)
            const isCompleted = status === 'completed' || prog?.status === 'completed'
            const isLocked    = status === 'locked'

            return (
              <div
                key={chapter.id}
                onClick={() => openChapter(chapter, status)}
                role={isLocked ? undefined : 'button'}
                style={{
                  background: isCompleted
                    ? 'rgba(212,175,55,0.06)'
                    : isLocked ? 'rgba(10,12,28,0.7)' : 'rgba(13,19,43,0.65)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: `1px solid ${isCompleted ? 'rgba(212,175,55,0.45)' : isLocked ? 'rgba(255,255,255,0.06)' : 'rgba(212,175,55,0.20)'}`,
                  borderRadius: '14px',
                  padding: '24px 28px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '24px',
                  cursor: isLocked ? 'default' : 'pointer',
                  opacity: isLocked ? 0.5 : 1,
                  boxShadow: isCompleted ? '0 0 20px rgba(212,175,55,0.15)' : 'none',
                  transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                }}
                onMouseEnter={e => {
                  if (!isLocked) {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = 'rgba(212,175,55,0.55)'
                    el.style.boxShadow = '0 6px 24px rgba(0,0,0,0.3)'
                    el.style.transform = 'translateY(-2px)'
                  }
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = isCompleted ? 'rgba(212,175,55,0.45)' : isLocked ? 'rgba(255,255,255,0.06)' : 'rgba(212,175,55,0.20)'
                  el.style.boxShadow = isCompleted ? '0 0 20px rgba(212,175,55,0.15)' : 'none'
                  el.style.transform = 'none'
                }}
              >
                {/* Número/estado */}
                <div style={{
                  width: '60px', height: '60px', borderRadius: '12px', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: isCompleted ? '1.8rem' : isLocked ? '1.8rem' : '1.4rem',
                  fontFamily: 'Cinzel, serif', fontWeight: 700,
                  background: isCompleted
                    ? 'linear-gradient(135deg, rgba(212,175,55,0.3), rgba(212,175,55,0.15))'
                    : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isCompleted ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  color: isCompleted ? 'var(--gold-bright)' : 'var(--text-secondary)',
                }}>
                  {isLocked ? '🔒' : isCompleted ? '✓' : idx + 1}
                </div>

                {/* Contenido */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.2rem', color: isLocked ? 'var(--text-secondary)' : 'var(--text-gold)', letterSpacing: '0.5px' }}>
                      {chapter.title}
                    </h3>
                    {isCompleted && (
                      <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.7rem', color: 'var(--bg-dark)', background: 'linear-gradient(135deg, var(--gold-bright), var(--gold))', borderRadius: '4px', padding: '3px 10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Completado
                      </span>
                    )}
                    {!isLocked && !isCompleted && (
                      <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.7rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '4px', padding: '3px 10px' }}>
                        Disponible
                      </span>
                    )}
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontStyle: 'italic', lineHeight: 1.6 }}>
                    {chapter.subtitle}
                  </p>
                  {isLocked && (
                    <p style={{ marginTop: '8px', fontSize: '0.88rem', color: 'var(--text-muted)', fontFamily: 'Cinzel, serif' }}>
                      🔒 Requiere Nivel {chapter.unlock_level}
                      {chapter.unlock_quests_count > 0 && ` · ${chapter.unlock_quests_count} misiones completadas`}
                    </p>
                  )}
                </div>

                {/* Flecha */}
                {!isLocked && (
                  <div style={{ fontSize: '1.5rem', color: 'var(--text-gold)', flexShrink: 0, opacity: 0.6 }}>→</div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── MODAL capítulo ── */}
      {activeChapter && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setActiveChapter(null) }}>
          <div className="modal-box" style={{ maxWidth: '600px' }}>
            {/* Cierre */}
            <button onClick={() => setActiveChapter(null)}
              style={{ position: 'absolute', top: '20px', right: '24px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.8rem', cursor: 'pointer', transition: 'var(--transition)', zIndex: 2 }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >✕</button>

            {/* Ornamento */}
            <div className="divider-ornament" style={{ marginBottom: '20px' }}>
              <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.82rem', color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Capítulo {activeChapter.chapter_number}
              </span>
            </div>

            {/* Título del capítulo */}
            <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.6rem', color: 'var(--text-gold)', marginBottom: '8px', letterSpacing: '1px' }}>
              {activeChapter.title}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', fontStyle: 'italic', marginBottom: '24px' }}>
              {activeChapter.subtitle}
            </p>

            <div className="divider-ornament" style={{ marginBottom: '24px' }} />

            {/* Texto narrativo — tipografía grande y cómoda */}
            <div style={{
              color: 'var(--text-primary)',
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: '1.15rem',
              lineHeight: 2,
              marginBottom: '28px',
              whiteSpace: 'pre-line',
              letterSpacing: '0.01em',
            }}>
              {activeChapter.narrative_text}
            </div>

            {/* Opciones */}
            {(() => {
              const prog = progress.find(p => p.chapter_id === activeChapter.id)
              const isCompleted = prog?.status === 'completed'
              const chapChoices = chapterChoices(activeChapter.id)

              if (isCompleted) {
                const madeChoice = chapChoices.find(c => c.id === prog?.choice_made)
                return (
                  <div style={{ padding: '18px 20px', borderRadius: '10px', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.35)' }}>
                    <p style={{ color: 'var(--text-gold)', fontSize: '1rem', fontStyle: 'italic' }}>
                      ✓ Decisión tomada: <strong>{madeChoice?.choice_text}</strong>
                    </p>
                  </div>
                )
              }

              return chapChoices.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ fontFamily: 'Cinzel, serif', fontSize: '0.82rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    ¿Cuál es tu respuesta?
                  </p>
                  {chapChoices.map(choice => (
                    <button key={choice.id} onClick={() => makeChoice(activeChapter, choice)}
                      style={{
                        width: '100%', textAlign: 'left', padding: '18px 20px', borderRadius: '10px',
                        fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '1.1rem',
                        color: 'var(--text-primary)',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(212,175,55,0.15)',
                        cursor: 'pointer', transition: 'var(--transition)', lineHeight: 1.6,
                      }}
                      onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = 'var(--gold)'; el.style.background = 'rgba(212,175,55,0.08)' }}
                      onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = 'rgba(212,175,55,0.15)'; el.style.background = 'rgba(255,255,255,0.03)' }}
                    >
                      {choice.choice_text}
                    </button>
                  ))}
                </div>
              ) : (
                <button onClick={() => setActiveChapter(null)} className="btn-gold" style={{ width: '100%', justifyContent: 'center', fontSize: '1rem', padding: '14px' }}>
                  Continuar →
                </button>
              )
            })()}

            <button onClick={() => setActiveChapter(null)}
              style={{ display: 'block', width: '100%', marginTop: '16px', padding: '10px', fontFamily: 'Cinzel, serif', fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em' }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
