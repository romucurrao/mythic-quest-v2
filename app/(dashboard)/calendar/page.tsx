import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CalendarClient from '@/components/calendar/CalendarClient'
import { getArgentinaDate } from '@/lib/utils/attributes'

export const dynamic = 'force-dynamic'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = getArgentinaDate()

  // Obtener misiones y completados del mes actual + próximo
  const startRange = today.slice(0, 8) + '01'
  const endDate    = new Date(today)
  endDate.setDate(endDate.getDate() + 60) // 2 meses hacia adelante
  const endRange   = endDate.toISOString().slice(0, 10)

  const [questsRes, areasRes, completionsRes] = await Promise.all([
    supabase.from('quests').select('*').eq('user_id', user.id),
    supabase.from('areas').select('*').eq('user_id', user.id).order('name'),
    supabase.from('mission_completions').select('*').eq('user_id', user.id)
      .gte('completed_date', startRange).lte('completed_date', endRange),
  ])

  return (
    <CalendarClient
      quests={questsRes.data ?? []}
      areas={areasRes.data ?? []}
      completions={completionsRes.data ?? []}
      userId={user.id}
      today={today}
    />
  )
}
