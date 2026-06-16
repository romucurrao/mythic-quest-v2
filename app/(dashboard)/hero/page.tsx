import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HeroClient from '@/components/hero/HeroClient'

export const dynamic = 'force-dynamic'

export default async function HeroPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [heroRes, godsRes, chaptersRes, progressRes] = await Promise.all([
    supabase.from('heroes').select('*').eq('user_id', user.id).single(),
    supabase.from('gods').select('*').order('unlock_level'),
    supabase.from('story_chapters').select('*').order('chapter_number'),
    supabase.from('user_story_progress').select('*').eq('user_id', user.id),
  ])

  return (
    <HeroClient
      hero={heroRes.data}
      gods={godsRes.data ?? []}
      chapters={chaptersRes.data ?? []}
      storyProgress={progressRes.data ?? []}
      userId={user.id}
    />
  )
}
