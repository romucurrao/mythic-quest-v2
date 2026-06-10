'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      })

      if (error) {
        if (error.message.includes('already registered')) {
          setError('Este correo ya tiene una cuenta. Iniciá sesión.')
        } else {
          setError(error.message)
        }
        setLoading(false)
      } else {
        setSuccess(true)
        setTimeout(() => router.push('/dashboard'), 1800)
      }
    } catch {
      setError('Error de conexión. Verificá tu proyecto Supabase.')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center animate-fade-in">
          <div className="text-6xl mb-4 animate-float">🌅</div>
          <h2 className="font-cinzel text-2xl mb-2" style={{ color: 'var(--gold-light)' }}>
            ¡Bienvenido al Olimpo!
          </h2>
          <p style={{ color: 'var(--parch-shadow)', fontFamily: 'EB Garamond, serif', fontStyle: 'italic', fontSize: '1.1rem' }}>
            Tu leyenda comienza ahora...
          </p>
          <div className="mt-4">
            <div className="inline-block w-6 h-6 border-2 rounded-full animate-spin"
              style={{ borderColor: 'var(--gold)', borderTopColor: 'transparent' }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="absolute rounded-full"
            style={{
              width: (i % 3 + 1) * 2 + 'px',
              height: (i % 3 + 1) * 2 + 'px',
              background: '#C8922A',
              opacity: 0.08,
              top: ((i * 41 + 13) % 100) + '%',
              left: ((i * 57 + 9) % 100) + '%',
              animation: `float ${3 + (i % 3)}s ease-in-out infinite`,
              animationDelay: (i * 0.5) + 's',
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="text-center mb-8">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 animate-glow"
            style={{ background: 'linear-gradient(135deg, #2A1A04, #1C1200)', border: '2px solid var(--gold)' }}
          >
            🌅
          </div>
          <h1 className="font-cinzel-decorative text-3xl mb-2" style={{ color: 'var(--gold-light)' }}>
            Mythic Quest
          </h1>
          <p style={{ color: 'var(--parch-shadow)', fontFamily: 'EB Garamond, serif', fontStyle: 'italic', fontSize: '1.1rem' }}>
            El Olimpo espera a su próximo héroe
          </p>
        </div>

        <div className="parch-card p-8 corner-ornament">
          <div className="divider-ornament mb-6">
            <span style={{ color: 'var(--gold)', fontSize: '0.75rem', fontFamily: 'Cinzel, serif', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Crear Cuenta
            </span>
          </div>

          <form onSubmit={handleRegister} className="space-y-5" noValidate>
            <div>
              <label htmlFor="reg-username" style={{ display: 'block', fontSize: '0.72rem', marginBottom: '8px', color: 'var(--parch-dark)', fontFamily: 'Cinzel, serif', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Nombre de Aventurero
              </label>
              <input
                id="reg-username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="input-parch"
                placeholder="Ej: Agamenón, Perseo..."
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="reg-email" style={{ display: 'block', fontSize: '0.72rem', marginBottom: '8px', color: 'var(--parch-dark)', fontFamily: 'Cinzel, serif', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Correo del Héroe
              </label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-parch"
                placeholder="tu@correo.com"
                required
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="reg-password" style={{ display: 'block', fontSize: '0.72rem', marginBottom: '8px', color: 'var(--parch-dark)', fontFamily: 'Cinzel, serif', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Contraseña Secreta
              </label>
              <input
                id="reg-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-parch"
                placeholder="Mínimo 6 caracteres"
                required
                autoComplete="new-password"
                disabled={loading}
              />
            </div>

            {error && (
              <div style={{ padding: '12px 14px', borderRadius: '3px', background: '#8B1A1A18', border: '1px solid #8B1A1A60', color: '#CC4444', fontFamily: 'EB Garamond, serif', fontSize: '0.95rem' }}>
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password || !username}
              className="btn-gold"
              style={{ width: '100%', padding: '12px', opacity: (loading || !email || !password || !username) ? 0.65 : 1 }}
            >
              {loading ? '⏳ Forjando tu destino...' : '🌅 Comenzar mi Leyenda'}
            </button>
          </form>

          <div className="divider-ornament my-6" />

          <p style={{ textAlign: 'center', fontSize: '0.95rem', color: 'var(--parch-shadow)', fontFamily: 'EB Garamond, serif' }}>
            ¿Ya tienes un héroe?{' '}
            <Link href="/login" style={{ color: 'var(--gold-light)', textDecoration: 'underline' }}>
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
