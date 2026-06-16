import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AchievementsClient from '@/components/achievements/AchievementsClient'

export const dynamic = 'force-dynamic'

export default async function AchievementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [achievementsRes, heroRes] = await Promise.all([
    supabase.from('achievements').select('*').eq('user_id', user.id),
    supabase.from('heroes').select('*').eq('user_id', user.id).single(),
  ])

  return (
    <AchievementsClient
      achievements={achievementsRes.data ?? []}
      heroLevel={heroRes.data?.level ?? 1}
    />
  )
}
