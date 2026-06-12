-- ================================================
-- MYTHIC QUEST 2.0 — MIGRACIÓN 003: QUESTS V2
-- Ejecutar en Supabase → SQL Editor DESPUÉS de 002_areas.sql
-- ================================================

-- ─── Extender tabla quests con campos de fecha y recurrencia ───
ALTER TABLE quests ADD COLUMN IF NOT EXISTS area_id         UUID REFERENCES areas(id) ON DELETE SET NULL;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS start_date      DATE;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS end_date        DATE;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS recurrence_type TEXT NOT NULL DEFAULT 'none';
  -- Valores: 'none' | 'daily' | 'weekly' | 'monthly'
ALTER TABLE quests ADD COLUMN IF NOT EXISTS recurrence_days JSONB NOT NULL DEFAULT '[]';
  -- Para semanal: [0,1,2,3,4,5,6] donde 0=Dom, 1=Lun, ..., 6=Sáb

-- ─── Tabla de completados por fecha ───────────────────────────
CREATE TABLE IF NOT EXISTS mission_completions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id       UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL,
  xp_earned      INT DEFAULT 0,
  gold_earned    INT DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, quest_id, completed_date)
);

-- Row Level Security para mission_completions
ALTER TABLE mission_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "completions_select" ON mission_completions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "completions_insert" ON mission_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "completions_delete" ON mission_completions
  FOR DELETE USING (auth.uid() = user_id);

-- ─── Extender heroes con mejor racha histórica ─────────────────
ALTER TABLE heroes ADD COLUMN IF NOT EXISTS longest_streak INT NOT NULL DEFAULT 0;
