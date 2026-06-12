export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; username: string | null; created_at: string }
        Insert: { id: string; username?: string | null; created_at?: string }
        Update: { username?: string | null; created_at?: string }
      }
      heroes: {
        Row: {
          id: string
          user_id: string
          name: string
          avatar: string
          patron_god: string
          class: string
          level: number
          xp: number
          gold: number
          streak: number
          longest_streak: number
          last_active_date: string | null
          strength: number
          wisdom: number
          discipline: number
          charisma: number
          creativity: number
          total_quests_completed: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          avatar?: string
          patron_god?: string
          class?: string
          level?: number
          xp?: number
          gold?: number
          streak?: number
          longest_streak?: number
          strength?: number
          wisdom?: number
          discipline?: number
          charisma?: number
          creativity?: number
        }
        Update: {
          id?: string; user_id?: string; name?: string; avatar?: string; patron_god?: string
          class?: string; level?: number; xp?: number; gold?: number; streak?: number
          longest_streak?: number; last_active_date?: string | null; strength?: number
          wisdom?: number; discipline?: number; charisma?: number; creativity?: number
          total_quests_completed?: number; created_at?: string
        }
      }
      areas: {
        Row: {
          id: string
          user_id: string
          name: string
          icon: string
          deity: string | null
          location: string | null
          attribute: string
          color: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          icon?: string
          deity?: string | null
          location?: string | null
          attribute?: string
          color?: string | null
        }
        Update: {
          name?: string; icon?: string; deity?: string | null; location?: string | null
          attribute?: string; color?: string | null
        }
      }
      quests: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          category: string
          difficulty: string
          frequency: string
          is_completed: boolean
          last_reset_date: string | null
          xp_reward: number
          gold_reward: number
          attribute_bonus: string | null
          area_id: string | null
          start_date: string | null
          end_date: string | null
          recurrence_type: string
          recurrence_days: number[]
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          category?: string
          difficulty?: string
          frequency?: string
          is_completed?: boolean
          xp_reward?: number
          gold_reward?: number
          attribute_bonus?: string | null
          area_id?: string | null
          start_date?: string | null
          end_date?: string | null
          recurrence_type?: string
          recurrence_days?: number[]
        }
        Update: {
          id?: string; user_id?: string; name?: string; description?: string | null
          category?: string; difficulty?: string; frequency?: string; is_completed?: boolean
          last_reset_date?: string | null; xp_reward?: number; gold_reward?: number
          attribute_bonus?: string | null; area_id?: string | null; start_date?: string | null
          end_date?: string | null; recurrence_type?: string; recurrence_days?: number[]
          created_at?: string
        }
      }
      mission_completions: {
        Row: {
          id: string
          user_id: string
          quest_id: string
          completed_date: string
          xp_earned: number
          gold_earned: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          quest_id: string
          completed_date: string
          xp_earned?: number
          gold_earned?: number
        }
        Update: { xp_earned?: number; gold_earned?: number }
      }
      achievements: {
        Row: {
          id: string
          user_id: string
          achievement_key: string
          unlocked_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_key: string
          unlocked_at?: string
        }
        Update: { id?: string; achievement_key?: string; unlocked_at?: string }
      }
      gods: {
        Row: {
          id: string; name: string; slug: string; title: string | null
          description: string | null; area: string | null; emoji: string | null
          bonus_description: string | null; unlock_level: number; color_hex: string; created_at: string
        }
        Insert: { id?: string; name?: string; slug?: string; title?: string; description?: string; area?: string; emoji?: string; bonus_description?: string; unlock_level?: number; color_hex?: string }
        Update: { name?: string; title?: string; description?: string; bonus_description?: string; unlock_level?: number; color_hex?: string }
      }
      user_gods: {
        Row: { id: string; user_id: string; god_id: string; favor_level: number; unlocked_at: string }
        Insert: { id?: string; user_id: string; god_id: string; favor_level?: number }
        Update: { favor_level?: number }
      }
      story_chapters: {
        Row: {
          id: string; chapter_number: number; title: string; subtitle: string | null
          narrative_text: string; unlock_level: number; unlock_quests_count: number; created_at: string
        }
        Insert: { id?: string; chapter_number?: number; title?: string; subtitle?: string; narrative_text?: string; unlock_level?: number; unlock_quests_count?: number }
        Update: { title?: string; subtitle?: string; narrative_text?: string }
      }
      story_choices: {
        Row: {
          id: string; chapter_id: string; choice_text: string; consequence: string | null
          effect_type: string | null; effect_target: string | null; effect_value: number
        }
        Insert: { id?: string; chapter_id: string; choice_text: string; consequence?: string; effect_type?: string; effect_target?: string; effect_value?: number }
        Update: { choice_text?: string; consequence?: string; effect_type?: string; effect_target?: string; effect_value?: number }
      }
      user_story_progress: {
        Row: {
          id: string; user_id: string; chapter_id: string; status: string
          unlocked_at: string | null; completed_at: string | null; choice_made: string | null
        }
        Insert: { id?: string; user_id: string; chapter_id: string; status?: string; unlocked_at?: string; completed_at?: string; choice_made?: string }
        Update: { status?: string; completed_at?: string | null; choice_made?: string | null; unlocked_at?: string | null }
      }
    }
  }
}

export type Hero             = Database['public']['Tables']['heroes']['Row']
export type Area             = Database['public']['Tables']['areas']['Row']
export type Quest            = Database['public']['Tables']['quests']['Row']
export type MissionCompletion = Database['public']['Tables']['mission_completions']['Row']
export type Achievement      = Database['public']['Tables']['achievements']['Row']
export type God              = Database['public']['Tables']['gods']['Row']
export type StoryChapter     = Database['public']['Tables']['story_chapters']['Row']
export type StoryChoice      = Database['public']['Tables']['story_choices']['Row']
export type UserStoryProgress = Database['public']['Tables']['user_story_progress']['Row']
