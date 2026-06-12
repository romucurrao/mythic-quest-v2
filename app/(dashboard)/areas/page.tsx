import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AreasClient from '@/components/areas/AreasClient'

export const dynamic = 'force-dynamic'

export default async function AreasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: areas } = await supabase
    .from('areas')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  return <AreasClient areas={areas ?? []} userId={user.id} />
}
