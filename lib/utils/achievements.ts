export const ACHIEVEMENTS_CATALOG = [
  {
    key: 'first_quest',
    title: 'Primera Hazaña',
    description: 'Completa tu primera misión',
    emoji: '⭐',
    condition: (stats: AchievementStats) => stats.total_quests_completed >= 1,
  },
  {
    key: 'quests_10',
    title: 'Guerrero Incipiente',
    description: 'Completa 10 misiones en total',
    emoji: '🗡️',
    condition: (stats: AchievementStats) => stats.total_quests_completed >= 10,
  },
  {
    key: 'quests_50',
    title: 'Veterano del Olimpo',
    description: 'Completa 50 misiones en total',
    emoji: '⚔️',
    condition: (stats: AchievementStats) => stats.total_quests_completed >= 50,
  },
  {
    key: 'quests_100',
    title: 'Leyenda Viviente',
    description: 'Completa 100 misiones en total',
    emoji: '🏆',
    condition: (stats: AchievementStats) => stats.total_quests_completed >= 100,
  },
  {
    key: 'streak_3',
    title: 'Llama Persistente',
    description: 'Mantén una racha de 3 días seguidos',
    emoji: '🔥',
    condition: (stats: AchievementStats) => stats.streak >= 3,
  },
  {
    key: 'streak_7',
    title: 'Semana Heroica',
    description: 'Mantén una racha de 7 días seguidos',
    emoji: '🌟',
    condition: (stats: AchievementStats) => stats.streak >= 7,
  },
  {
    key: 'streak_30',
    title: 'Un Mes en el Olimpo',
    description: 'Mantén una racha de 30 días seguidos',
    emoji: '🌙',
    condition: (stats: AchievementStats) => stats.streak >= 30,
  },
  {
    key: 'streak_90',
    title: 'Tres Meses de Gloria',
    description: 'Mantén una racha de 90 días seguidos',
    emoji: '✨',
    condition: (stats: AchievementStats) => stats.streak >= 90,
  },
  {
    key: 'level_5',
    title: 'Guardián Novato',
    description: 'Alcanza el nivel 5',
    emoji: '🛡️',
    condition: (stats: AchievementStats) => stats.level >= 5,
  },
  {
    key: 'level_10',
    title: 'Campeón Mortal',
    description: 'Alcanza el nivel 10',
    emoji: '🦁',
    condition: (stats: AchievementStats) => stats.level >= 10,
  },
  {
    key: 'level_20',
    title: 'Semidiós Consagrado',
    description: 'Alcanza el nivel 20',
    emoji: '⚡',
    condition: (stats: AchievementStats) => stats.level >= 20,
  },
  {
    key: 'level_30',
    title: 'Dios Mortal',
    description: 'Alcanza el nivel máximo: 30',
    emoji: '👑',
    condition: (stats: AchievementStats) => stats.level >= 30,
  },
  {
    key: 'gold_100',
    title: 'Primer Tesoro',
    description: 'Acumula 100 monedas de oro',
    emoji: '💰',
    condition: (stats: AchievementStats) => stats.gold >= 100,
  },
  {
    key: 'gold_1000',
    title: 'Tesoro del Olimpo',
    description: 'Acumula 1000 monedas de oro',
    emoji: '🏺',
    condition: (stats: AchievementStats) => stats.gold >= 1000,
  },
  {
    key: 'hero_created',
    title: 'Nacimiento del Héroe',
    description: 'Crea tu héroe por primera vez',
    emoji: '🌅',
    condition: (stats: AchievementStats) => stats.hero_created,
  },
  {
    key: 'first_chapter',
    title: 'El Despertar',
    description: 'Desbloquea el primer capítulo de la historia',
    emoji: '📖',
    condition: (stats: AchievementStats) => stats.chapters_completed >= 1,
  },
  {
    key: 'chapters_5',
    title: 'Cronista del Olimpo',
    description: 'Completa los primeros 5 capítulos de la historia',
    emoji: '📜',
    condition: (stats: AchievementStats) => stats.chapters_completed >= 5,
  },
]

export interface AchievementStats {
  total_quests_completed: number
  streak: number
  level: number
  gold: number
  hero_created: boolean
  chapters_completed: number
}
