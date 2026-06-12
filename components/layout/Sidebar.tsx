'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  { href: '/quests',       icon: '📜', label: 'Misiones',    primary: true  },
  { href: '/calendar',     icon: '🗓️', label: 'Calendario',  primary: false },
  { href: '/areas',        icon: '🏛️', label: 'Santuarios',  primary: false },
  { href: '/hero',         icon: '⚔️', label: 'Mi Héroe',    primary: false },
  { href: '/achievements', icon: '🏆', label: 'Hazañas',     primary: false },
  { href: '/story',        icon: '📖', label: 'Historia',    primary: false },
  { href: '/pantheon',     icon: '🏺', label: 'Panteón',     primary: false },
  { href: '/dashboard',    icon: '✨', label: 'Olimpo',      primary: false },
]

export function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()

  async function logout() {
    await createClient().auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0, height: '100%', width: 'var(--sidebar-w)',
      background: 'rgba(6,8,20,0.95)',
      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      borderRight: '1px solid rgba(212,175,55,0.15)',
      boxShadow: '4px 0 28px rgba(0,0,0,0.55)',
      display: 'flex', flexDirection: 'column', zIndex: 40,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(212,175,55,0.12)', textAlign: 'center' }}>
        <div style={{ fontSize: '1.8rem', marginBottom: '6px' }} className="animate-float">⚡</div>
        <div style={{ fontFamily: 'Cinzel Decorative, serif', fontSize: '0.6rem', color: 'var(--gold-bright)', letterSpacing: '0.1em', lineHeight: 1.4 }}>
          Mythic<br/>Quest
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
        {NAV.map(item => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: item.primary ? '12px 14px' : '9px 12px',
              borderRadius: '8px',
              fontFamily: 'Cinzel, serif',
              fontSize: item.primary ? '0.78rem' : '0.68rem',
              letterSpacing: '0.06em', textTransform: 'uppercase',
              textDecoration: 'none',
              color: active ? 'var(--gold-bright)' : item.primary ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: active
                ? 'rgba(212,175,55,0.14)'
                : item.primary ? 'rgba(212,175,55,0.04)' : 'transparent',
              borderLeft: `3px solid ${active ? 'var(--gold)' : item.primary ? 'rgba(212,175,55,0.25)' : 'transparent'}`,
              transition: 'all 0.25s',
              fontWeight: item.primary ? 700 : 400,
              marginBottom: item.primary ? '4px' : 0,
            }}
            onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'rgba(212,175,55,0.07)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-gold)' } }}
            onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = item.primary ? 'rgba(212,175,55,0.04)' : 'transparent'; (e.currentTarget as HTMLElement).style.color = item.primary ? 'var(--text-primary)' : 'var(--text-secondary)' } }}
            >
              <span style={{ fontSize: item.primary ? '1.15rem' : '0.95rem' }}>{item.icon}</span>
              {item.label}
              {item.primary && (
                <span style={{ marginLeft: 'auto', fontSize: '0.5rem', color: 'var(--gold)', fontFamily: 'Cinzel, serif', letterSpacing: '0.08em' }}>
                  PRINCIPAL
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '8px', borderTop: '1px solid rgba(212,175,55,0.12)' }}>
        <button onClick={logout} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 12px', borderRadius: '8px',
          fontFamily: 'Cinzel, serif', fontSize: '0.68rem',
          letterSpacing: '0.06em', textTransform: 'uppercase',
          color: 'var(--text-secondary)', background: 'transparent',
          border: 'none', cursor: 'pointer', transition: 'all 0.25s',
        }}
        onMouseEnter={e => { (e.currentTarget).style.color = 'var(--danger)'; (e.currentTarget).style.background = 'rgba(255,23,68,0.08)' }}
        onMouseLeave={e => { (e.currentTarget).style.color = 'var(--text-secondary)'; (e.currentTarget).style.background = 'transparent' }}
        >
          <span>🚪</span> Salir
        </button>
      </div>
    </aside>
  )
}

/* ── Bottom nav móvil — solo las 5 más importantes ── */
const MOBILE_NAV = NAV.slice(0, 5)

export function MobileNav() {
  const pathname = usePathname()
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
      display: 'flex',
      background: 'rgba(6,8,20,0.97)',
      backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
      borderTop: '1px solid rgba(212,175,55,0.15)',
      boxShadow: '0 -4px 16px rgba(0,0,0,0.5)',
    }}
    className="md:hidden"
    >
      {MOBILE_NAV.map(item => {
        const active = pathname === item.href
        return (
          <Link key={item.href} href={item.href} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', padding: '8px 2px', gap: '2px',
            textDecoration: 'none',
            color: active ? 'var(--gold-bright)' : 'var(--text-secondary)',
            borderTop: `2px solid ${active ? 'var(--gold)' : 'transparent'}`,
            transition: 'all 0.2s',
            background: active ? 'rgba(212,175,55,0.06)' : 'transparent',
          }}>
            <span style={{ fontSize: '1.2rem', lineHeight: 1.2 }}>{item.icon}</span>
            <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.42rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
