import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/dashboard/DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: hero } = await supabase
    .from('heroes')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const { data: quests } = await supabase
    .from('quests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const { data: achievements } = await supabase
    .from('achievements')
    .select('*')
    .eq('user_id', user.id)

  return (
    <DashboardClient
      hero={hero}
      quests={quests ?? []}
      achievements={achievements ?? []}
      userId={user.id}
    />
  )
}
