// Maps quest category → which attribute to boost
export const CATEGORY_ATTRIBUTE: Record<string, string> = {
  estudio: 'wisdom',
  fisico: 'strength',
  espiritual: 'discipline',
  social: 'charisma',
  artistico: 'creativity',
  estrategia: 'wisdom',
  general: 'discipline',
}

export const ATTRIBUTE_LABELS: Record<string, string> = {
  strength: 'Fuerza',
  wisdom: 'Sabiduría',
  discipline: 'Disciplina',
  charisma: 'Carisma',
  creativity: 'Creatividad',
}

export const ATTRIBUTE_EMOJIS: Record<string, string> = {
  strength: '⚔️',
  wisdom: '📚',
  discipline: '🛡️',
  charisma: '✨',
  creativity: '🎨',
}

export const ATTRIBUTE_COLORS: Record<string, string> = {
  strength: '#C0392B',
  wisdom: '#7EC8E3',
  discipline: '#2ECC71',
  charisma: '#E91E8C',
  creativity: '#FF9800',
}

export const CATEGORY_LABELS: Record<string, string> = {
  estudio: '📚 Estudio',
  fisico: '⚔️ Físico',
  espiritual: '🕊️ Espiritual',
  social: '🤝 Social',
  artistico: '🎨 Artístico',
  estrategia: '♟️ Estrategia',
  general: '⭐ General',
}

export const DIFFICULTY_LABELS: Record<string, string> = {
  facil: '🌿 Fácil',
  media: '🔥 Media',
  dificil: '⚡ Difícil',
  epica: '💀 Épica',
}

export const FREQUENCY_LABELS: Record<string, string> = {
  unica: '🏆 Única vez',
  diaria: '☀️ Diaria',
  semanal: '📅 Semanal',
  mensual: '🌙 Mensual',
}

export function getArgentinaDate(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export function getArgentinaDateLabel(): string {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
}

export function shouldResetQuest(quest: { frequency: string; last_reset_date: string | null }): boolean {
  const today = getArgentinaDate()
  if (!quest.last_reset_date) return false

  const last = new Date(quest.last_reset_date)
  const now = new Date(today)

  switch (quest.frequency) {
    case 'diaria':
      return quest.last_reset_date < today
    case 'semanal': {
      const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
      return diffDays >= 7
    }
    case 'mensual': {
      return (
        now.getFullYear() > last.getFullYear() ||
        (now.getFullYear() === last.getFullYear() && now.getMonth() > last.getMonth())
      )
    }
    case 'unica':
      return false
    default:
      return false
  }
}
