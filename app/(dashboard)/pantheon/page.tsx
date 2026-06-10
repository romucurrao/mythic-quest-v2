import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PantheonClient from '@/components/pantheon/PantheonClient'

export default async function PantheonPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: gods } = await supabase.from('gods').select('*').order('unlock_level')
  const { data: hero } = await supabase.from('heroes').select('*').eq('user_id', user.id).single()

  return <PantheonClient gods={gods ?? []} hero={hero} />
}
