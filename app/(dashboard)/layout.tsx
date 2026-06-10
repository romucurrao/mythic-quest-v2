import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar, MobileNav } from '@/components/layout/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let user = null
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch { redirect('/login') }
  if (!user) redirect('/login')

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Sidebar — solo desktop */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Contenido principal */}
      <main style={{ paddingBottom: '80px' }} className="md:pb-0">
        <div style={{ marginLeft: 0, padding: '24px 20px' }} className="md:ml-[220px] md:p-8">
          <div style={{ maxWidth: '900px' }}>
            {children}
          </div>
        </div>
      </main>

      {/* Bottom nav — solo móvil */}
      <MobileNav />
    </div>
  )
}
