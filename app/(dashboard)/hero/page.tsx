import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HeroClient from '@/components/hero/HeroClient'

export default async function HeroPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: hero } = await supabase
    .from('heroes')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const { data: gods } = await supabase
    .from('gods')
    .select('*')
    .order('unlock_level')

  return <HeroClient hero={hero} gods={gods ?? []} userId={user.id} />
}
