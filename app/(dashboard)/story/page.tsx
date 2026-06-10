import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StoryClient from '@/components/story/StoryClient'

export default async function StoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: chapters } = await supabase
    .from('story_chapters')
    .select('*')
    .order('chapter_number')

  const { data: hero } = await supabase
    .from('heroes')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const { data: progress } = await supabase
    .from('user_story_progress')
    .select('*, story_choices(*)')
    .eq('user_id', user.id)

  const { data: choices } = await supabase
    .from('story_choices')
    .select('*')

  return (
    <StoryClient
      chapters={chapters ?? []}
      hero={hero}
      progress={progress ?? []}
      choices={choices ?? []}
      userId={user.id}
    />
  )
}
