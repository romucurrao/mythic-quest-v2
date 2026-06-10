'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError]       = useState('')

  useEffect(() => {
    createClient().auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/dashboard')
      else setChecking(false)
    }).catch(() => setChecking(false))
  }, [router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const { error } = await createClient().auth.signInWithPassword({ email, password })
      if (error) { setError(error.message.includes('Invalid') ? 'Correo o contraseña incorrectos.' : error.message); setLoading(false) }
      else { router.push('/dashboard'); router.refresh() }
    } catch { setError('Error de conexión.'); setLoading(false) }
  }

  if (checking) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '12px' }} className="animate-float">⚡</div>
        <p style={{ color: 'var(--text-secondary)', fontFamily: 'Cinzel, serif', fontSize: '0.8rem', letterSpacing: '0.1em' }}>CARGANDO...</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative' }}>
      {/* Partículas decorativas */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
        {[...Array(12)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: (i % 3 + 1) * 2 + 'px', height: (i % 3 + 1) * 2 + 'px',
            borderRadius: '50%', background: 'var(--gold)',
            opacity: 0.06 + (i % 4) * 0.02,
            top: ((i * 37 + 11) % 100) + '%', left: ((i * 53 + 7) % 100) + '%',
            animation: `float ${3 + (i % 3)}s ease-in-out infinite`,
            animationDelay: (i * 0.4) + 's',
          }} />
        ))}
      </div>

      <div style={{ width: '100%', maxWidth: '400px', position: 'relative', zIndex: 1 }} className="animate-fade-in">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(212,175,55,0.12)', border: '2px solid rgba(212,175,55,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 14px', backdropFilter: 'blur(10px)' }} className="animate-glow">⚡</div>
          <h1 style={{ fontFamily: 'Cinzel Decorative, serif', fontSize: '1.6rem', color: 'var(--gold-bright)', letterSpacing: '0.05em' }}>Mythic Quest</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '6px', fontStyle: 'italic' }}>Las puertas del Olimpo te aguardan</p>
        </div>

        {/* Card */}
        <div className="parch-card" style={{ padding: '28px' }}>
          <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: '0.8rem', color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'center', marginBottom: '22px' }}>
            Iniciar Sesión
          </h2>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} noValidate>
            <div>
              <label htmlFor="email" style={{ display: 'block', fontSize: '0.68rem', marginBottom: '6px', color: 'var(--text-secondary)', fontFamily: 'Cinzel, serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Correo</label>
              <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-parch" placeholder="tu@correo.com" required autoComplete="email" disabled={loading} />
            </div>
            <div>
              <label htmlFor="password" style={{ display: 'block', fontSize: '0.68rem', marginBottom: '6px', color: 'var(--text-secondary)', fontFamily: 'Cinzel, serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Contraseña</label>
              <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-parch" placeholder="••••••••" required autoComplete="current-password" disabled={loading} />
            </div>
            {error && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,69,96,0.1)', border: '1px solid rgba(255,69,96,0.35)', color: 'var(--danger)', fontSize: '0.85rem' }}>
                ⚠️ {error}
              </div>
            )}
            <button type="submit" disabled={loading || !email || !password} className="btn-gold" style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '4px' }}>
              {loading ? '⏳ Entrando...' : '⚡ Entrar al Olimpo'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            ¿Sin héroe?{' '}
            <Link href="/register" style={{ color: 'var(--gold)', textDecoration: 'underline' }}>Regístrate aquí</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
