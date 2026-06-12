import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import QuestsClient from '@/components/quests/QuestsClient'
import { calculateStreak } from '@/lib/utils/streak'
import { getArgentinaDate } from '@/lib/utils/attributes'

export const dynamic = 'force-dynamic'

export default async function QuestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = getArgentinaDate()

  // Cargar datos en paralelo
  const [questsRes, heroRes, areasRes, completionsRes] = await Promise.all([
    supabase.from('quests').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('heroes').select('*').eq('user_id', user.id).single(),
    supabase.from('areas').select('*').eq('user_id', user.id).order('name'),
    supabase.from('mission_completions').select('*').eq('user_id', user.id).eq('completed_date', today),
  ])

  const hero = heroRes.data

  // Actualizar racha si el héroe existe
  if (hero) {
    const { streak, longest_streak } = calculateStreak(hero, today)
    if (streak !== hero.streak || longest_streak !== (hero.longest_streak ?? 0) || hero.last_active_date !== today) {
      await supabase.from('heroes').update({
        streak,
        longest_streak,
        last_active_date: today,
      } as never).eq('user_id', user.id)
      // Actualizar localmente para pasar al client
      hero.streak = streak
      hero.longest_streak = longest_streak
      hero.last_active_date = today
    }
  }

  return (
    <QuestsClient
      quests={questsRes.data ?? []}
      hero={hero}
      areas={areasRes.data ?? []}
      todayCompletions={completionsRes.data ?? []}
      userId={user.id}
      today={today}
    />
  )
}
