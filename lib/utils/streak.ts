import { Hero } from '../types/database.types'

/** Recalcula la racha dado el héroe actual y la fecha de hoy (YYYY-MM-DD en Argentina). */
export function calculateStreak(hero: Hero, today: string): { streak: number; longest_streak: number } {
  const last     = hero.last_active_date
  const current  = hero.streak ?? 0
  const longest  = hero.longest_streak ?? current

  // Ya usó la app hoy — no cambiar
  if (last === today) {
    return { streak: current, longest_streak: longest }
  }

  // Nunca usó la app antes
  if (!last) {
    return { streak: 1, longest_streak: Math.max(1, longest) }
  }

  const lastMs  = new Date(last).getTime()
  const todayMs = new Date(today).getTime()
  const diffDays = Math.floor((todayMs - lastMs) / (1000 * 60 * 60 * 24))

  const newStreak = diffDays === 1 ? current + 1 : 1

  return {
    streak:         newStreak,
    longest_streak: Math.max(newStreak, longest),
  }
}

/** Verifica si una quest recurrente debería aparecer en una fecha dada.
 *  Usa los nuevos campos recurrence_type / recurrence_days / start_date / end_date.
 *  También mantiene compatibilidad con el campo legacy `frequency`.
 */
export function questAppearsOnDate(quest: {
  recurrence_type: string
  recurrence_days: number[]
  start_date: string | null
  end_date: string | null
  frequency: string
  is_completed: boolean
}, dateStr: string): boolean {
  const date   = new Date(dateStr + 'T12:00:00')  // mediodía para evitar off-by-one con TZ
  const today  = new Date(dateStr + 'T12:00:00')

  // Si tiene fecha de fin y ya pasó, no mostrar
  if (quest.end_date) {
    const end = new Date(quest.end_date + 'T23:59:59')
    if (date > end) return false
  }

  // Si tiene fecha de inicio y aún no llegó, no mostrar
  if (quest.start_date) {
    const start = new Date(quest.start_date + 'T00:00:00')
    if (date < start) return false
  }

  const rt = quest.recurrence_type ?? 'none'
  const dayOfWeek = date.getDay() // 0=Dom, 1=Lun, ..., 6=Sáb

  switch (rt) {
    case 'none':
      // Misión de un día: solo aparece en su start_date (o hoy si no tiene)
      if (!quest.start_date) return dateStr === new Date().toISOString().slice(0, 10)
      return quest.start_date === dateStr

    case 'daily':
      return true

    case 'weekly': {
      const days = quest.recurrence_days ?? []
      if (days.length === 0) {
        // Fallback: mismo día de la semana que start_date
        if (quest.start_date) {
          const startDay = new Date(quest.start_date + 'T12:00:00').getDay()
          return dayOfWeek === startDay
        }
        return false
      }
      return days.includes(dayOfWeek)
    }

    case 'monthly': {
      if (!quest.start_date) return false
      const startDay = new Date(quest.start_date + 'T12:00:00').getDate()
      return date.getDate() === startDay
    }

    default: {
      // Compatibilidad con campo legacy `frequency`
      switch (quest.frequency) {
        case 'diaria':  return true
        case 'semanal': {
          if (!quest.start_date) return false
          const startDay = new Date(quest.start_date + 'T12:00:00').getDay()
          return dayOfWeek === startDay
        }
        case 'mensual': {
          if (!quest.start_date) return false
          const startDay = new Date(quest.start_date + 'T12:00:00').getDate()
          return date.getDate() === startDay
        }
        case 'unica':
          return !quest.is_completed
        default:
          return true
      }
    }
  }
}
