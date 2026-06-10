import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AchievementsClient from '@/components/achievements/AchievementsClient'

export default async function AchievementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: achievements } = await supabase
    .from('achievements')
    .select('*')
    .eq('user_id', user.id)

  const { data: hero } = await supabase
    .from('heroes')
    .select('*')
    .eq('user_id', user.id)
    .single()


  return <AchievementsClient achievements={achievements ?? []} hero={hero} />
}
