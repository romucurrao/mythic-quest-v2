-- ================================================
-- MYTHIC QUEST 2.0 — MIGRACIÓN 004: PRIORIDAD
-- Ejecutar en Supabase → SQL Editor
-- ================================================

-- Agregar columna priority a quests (retrocompatible)
ALTER TABLE quests ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium';
-- Valores: 'low' | 'medium' | 'high'
-- 'low'    = Ascua menor
-- 'medium' = Llama sagrada  (default para misiones existentes)
-- 'high'   = Fuego del Olimpo
