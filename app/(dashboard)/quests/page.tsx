import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import QuestsClient from '@/components/quests/QuestsClient'

export default async function QuestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: quests } = await supabase
    .from('quests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const { data: hero } = await supabase
    .from('heroes')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return <QuestsClient quests={quests ?? []} hero={hero} userId={user.id} />
}
