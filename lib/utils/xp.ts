// XP thresholds per level (30 levels)
export const XP_TABLE: number[] = [
  0,      // Level 1
  100,    // Level 2
  250,    // Level 3
  450,    // Level 4
  700,    // Level 5
  1000,   // Level 6
  1350,   // Level 7
  1750,   // Level 8
  2200,   // Level 9
  2700,   // Level 10
  3250,   // Level 11
  3850,   // Level 12
  4500,   // Level 13
  5200,   // Level 14
  5950,   // Level 15
  6750,   // Level 16
  7600,   // Level 17
  8500,   // Level 18
  9450,   // Level 19
  10450,  // Level 20
  11500,  // Level 21
  12600,  // Level 22
  13750,  // Level 23
  14950,  // Level 24
  16200,  // Level 25
  17500,  // Level 26
  18850,  // Level 27
  20250,  // Level 28
  21700,  // Level 29
  23200,  // Level 30
]

export const DIFFICULTY_XP: Record<string, number> = {
  facil: 30,
  media: 60,
  dificil: 120,
  epica: 200,
}

export const DIFFICULTY_GOLD: Record<string, number> = {
  facil: 5,
  media: 10,
  dificil: 20,
  epica: 35,
}

export function calculateLevel(totalXp: number): number {
  let level = 1
  for (let i = 0; i < XP_TABLE.length; i++) {
    if (totalXp >= XP_TABLE[i]) {
      level = i + 1
    } else {
      break
    }
  }
  return Math.min(level, 30)
}

export function xpForNextLevel(currentLevel: number): number {
  if (currentLevel >= 30) return XP_TABLE[29]
  return XP_TABLE[currentLevel] // index = next level - 1
}

export function xpProgress(totalXp: number, currentLevel: number): number {
  const currentLevelXp = XP_TABLE[currentLevel - 1] ?? 0
  const nextLevelXp = XP_TABLE[currentLevel] ?? XP_TABLE[29]
  if (nextLevelXp === currentLevelXp) return 100
  return Math.round(((totalXp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100)
}

export const LEVEL_TITLES: Record<number, string> = {
  1: 'Alma Errante',
  2: 'Neófito de Olimpo',
  3: 'Aprendiz de Héroes',
  4: 'Portador de Antorcha',
  5: 'Guardián Novato',
  6: 'Cazador de Mitos',
  7: 'Espadachín del Destino',
  8: 'Discípulo de los Dioses',
  9: 'Aspirante al Olimpo',
  10: 'Campeón Mortal',
  11: 'Semidiós Emergente',
  12: 'Hijo de las Estrellas',
  13: 'Portador del Rayo',
  14: 'Guardián del Olimpo',
  15: 'Paladín de los Dioses',
  16: 'Legendario del Ágora',
  17: 'Forjado en la Gloria',
  18: 'Leyenda Viviente',
  19: 'Ascendido de Olimpo',
  20: 'Semidiós Consagrado',
  21: 'Heraldo de los Inmortales',
  22: 'Elegido del Panteón',
  23: 'Coloso de la Historia',
  24: 'Titán Renacido',
  25: 'Inmortal en Vida',
  26: 'Voz del Olimpo',
  27: 'Favorito de los Dioses',
  28: 'Señor del Destino',
  29: 'Héroe Eterno',
  30: 'Dios Mortal',
}
