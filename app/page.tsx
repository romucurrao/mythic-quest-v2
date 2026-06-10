import { redirect } from 'next/navigation'

// Redirige siempre a /login — el dashboard/layout.tsx protege las rutas autenticadas
export default function HomePage() {
  redirect('/login')
}
