'use client'

import { useState } from 'react'
import { God, Hero } from '@/lib/types/database.types'

interface Props {
  gods: God[]
  hero: Hero | null
}

export default function PantheonClient({ gods, hero }: Props) {
  const [selected, setSelected] = useState<God | null>(null)
  const heroLevel = hero?.level ?? 0

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-cinzel text-2xl" style={{ color: 'var(--gold-light)' }}>Panteón del Olimpo</h1>
        <p style={{ color: 'var(--parch-shadow)', fontFamily: 'EB Garamond, serif', fontStyle: 'italic' }}>
          Los nueve dioses inmortales que rigen el destino de los héroes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {gods.map(god => {
          const isUnlocked = heroLevel >= god.unlock_level
          const isPatron = hero?.patron_god === god.slug

          return (
            <div
              key={god.id}
              onClick={() => setSelected(god)}
              className="parch-card p-5 cursor-pointer transition-all"
              style={{
                opacity: isUnlocked ? 1 : 0.45,
                borderColor: isPatron ? 'var(--gold)' : isUnlocked ? 'var(--border-parch)' : 'var(--border-aged)',
                boxShadow: isPatron ? `0 0 20px ${god.color_hex}30` : undefined,
              }}
              onMouseEnter={e => isUnlocked && ((e.currentTarget as HTMLElement).style.borderColor = god.color_hex)}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = isPatron ? 'var(--gold)' : isUnlocked ? 'var(--border-parch)' : 'var(--border-aged)'}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-sm flex items-center justify-center text-3xl flex-shrink-0"
                  style={{
                    background: isUnlocked ? `${god.color_hex}20` : '#1A1000',
                    border: `2px solid ${isUnlocked ? god.color_hex + '60' : 'var(--border-aged)'}`,
                    filter: isUnlocked ? undefined : 'grayscale(1)',
                  }}
                >
                  {isUnlocked ? god.emoji : '🔒'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-cinzel text-base" style={{ color: isUnlocked ? 'var(--gold-light)' : 'var(--parch-shadow)' }}>
                      {god.name}
                    </h3>
                    {isPatron && <span className="badge-gold text-xs">Patrono</span>}
                  </div>
                  <p className="text-xs mb-2" style={{ color: god.color_hex, fontFamily: 'Cinzel, serif' }}>
                    {god.title}
                  </p>
                  {isUnlocked ? (
                    <p className="text-xs" style={{ color: 'var(--parch-shadow)', fontFamily: 'EB Garamond, serif' }}>
                      {god.area}
                    </p>
                  ) : (
                    <p className="text-xs" style={{ color: 'var(--parch-shadow)', fontFamily: 'Cinzel, serif' }}>
                      🔒 Nv. {god.unlock_level} requerido
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {selected && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setSelected(null) }}>
          <div className="parch-card p-7 w-full max-w-md corner-ornament animate-fade-in">
            <div className="text-center mb-5">
              <div
                className="w-20 h-20 rounded-sm flex items-center justify-center text-4xl mx-auto mb-3 animate-glow"
                style={{ background: `${selected.color_hex}15`, border: `2px solid ${selected.color_hex}` }}
              >
                {heroLevel >= selected.unlock_level ? selected.emoji : '🔒'}
              </div>
              <h2 className="font-cinzel text-2xl" style={{ color: 'var(--gold-light)' }}>{selected.name}</h2>
              <p style={{ color: selected.color_hex, fontFamily: 'Cinzel, serif', fontSize: '0.85rem' }}>{selected.title}</p>
            </div>

            <div className="divider-ornament my-4" />

            <p className="mb-4 leading-relaxed" style={{ color: 'var(--parch-light)', fontFamily: 'EB Garamond, serif', fontSize: '1.05rem' }}>
              {selected.description}
            </p>

            <div className="p-4 rounded-sm" style={{ background: `${selected.color_hex}10`, border: `1px solid ${selected.color_hex}40` }}>
              <p className="text-xs mb-1" style={{ color: selected.color_hex, fontFamily: 'Cinzel, serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Bendición Divina
              </p>
              <p style={{ color: 'var(--parch-light)', fontFamily: 'EB Garamond, serif' }}>{selected.bonus_description}</p>
            </div>

            {heroLevel < selected.unlock_level && (
              <p className="text-center text-xs mt-4" style={{ color: 'var(--parch-shadow)', fontFamily: 'Cinzel, serif' }}>
                🔒 Desbloquea al alcanzar el Nivel {selected.unlock_level}
              </p>
            )}

            <button onClick={() => setSelected(null)} className="btn-ghost w-full mt-4">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
