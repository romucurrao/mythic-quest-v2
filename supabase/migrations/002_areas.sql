-- ================================================
-- MYTHIC QUEST 2.0 — MIGRACIÓN 002: ÁREAS
-- Ejecutar en Supabase → SQL Editor
-- ================================================

-- Tabla principal de áreas/santuarios del usuario
CREATE TABLE IF NOT EXISTS areas (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  icon       TEXT NOT NULL DEFAULT '⭐',
  deity      TEXT,            -- Ej: 'Ares', 'Atenea', etc.
  location   TEXT,            -- Ej: 'Campos de guerra de Ares'
  attribute  TEXT NOT NULL DEFAULT 'discipline',
  color      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Row Level Security
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "areas_select_own" ON areas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "areas_insert_own" ON areas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "areas_update_own" ON areas
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "areas_delete_own" ON areas
  FOR DELETE USING (auth.uid() = user_id);
