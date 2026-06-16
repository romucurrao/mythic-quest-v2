/** Catálogo de criaturas y héroes mitológicos desbloqueables por nivel. */

export type MythType = 'bestia' | 'heroe' | 'criatura' | 'entidad'

export interface MythEntry {
  level: number        // nivel requerido para desbloquear
  name: string
  type: MythType
  emoji: string
  description: string
}

export const MYTH_CATALOG: MythEntry[] = [
  { level: 1,  name: 'Pegaso',            type: 'criatura', emoji: '🐴', description: 'Caballo alado nacido de la sangre de Medusa. Montura de héroes y mensajero entre el cielo y la tierra.' },
  { level: 2,  name: 'Cerbero',           type: 'bestia',   emoji: '🐕', description: 'El can de tres cabezas que custodia las puertas del Inframundo. Nadie escapa de su guardia.' },
  { level: 3,  name: 'Minotauro',         type: 'bestia',   emoji: '🐂', description: 'Criatura con cuerpo de hombre y cabeza de toro, encerrada en el laberinto de Creta por el rey Minos.' },
  { level: 4,  name: 'Medusa',            type: 'criatura', emoji: '🐍', description: 'La única Gorgona mortal. Su mirada convierte en piedra a cualquiera que la contemple directamente.' },
  { level: 5,  name: 'Quimera',           type: 'bestia',   emoji: '🦁', description: 'Monstruo que respira fuego con cabeza de león, cuerpo de cabra y cola de serpiente. Terror de Licia.' },
  { level: 6,  name: 'Hidra de Lerna',   type: 'bestia',   emoji: '🐲', description: 'Serpiente de nueve cabezas que renacen al ser cortadas. Habitaba los pantanos de Lerna.' },
  { level: 7,  name: 'Arpías',            type: 'criatura', emoji: '🦅', description: 'Espíritus del viento con rostro de mujer y cuerpo de ave. Mensajeras del castigo divino.' },
  { level: 8,  name: 'Cíclope',           type: 'bestia',   emoji: '👁️', description: 'Gigantes de un solo ojo, hijos de Poseidón. Forjadores del rayo de Zeus en las profundidades del Etna.' },
  { level: 9,  name: 'Sirenas',           type: 'criatura', emoji: '🧜', description: 'Criaturas mitad mujer mitad pájaro cuyo canto irresistible atraía a los marineros hacia la muerte.' },
  { level: 10, name: 'Grifo',             type: 'criatura', emoji: '🦅', description: 'León alado con cabeza de águila, guardián de los tesoros de los dioses. Símbolo de fuerza divina.' },
  { level: 11, name: 'Esfinge',           type: 'entidad',  emoji: '🏺', description: 'Guardiana de Tebas que devoraba a quienes no resolvieran su acertijo. Derrotada por Edipo.' },
  { level: 12, name: 'Centauro Quirón',  type: 'heroe',    emoji: '🏹', description: 'El más sabio de los centauros, maestro de Aquiles, Jasón y Asclepio. Inmortal que renunció a su inmortalidad.' },
  { level: 13, name: 'Talos',            type: 'criatura', emoji: '🤖', description: 'Gigante de bronce forjado por Hefesto para proteger Creta. El primer autómata de la mitología.' },
  { level: 14, name: 'Escila',           type: 'bestia',   emoji: '🦑', description: 'Monstruo marino de seis cabezas que habitaba el estrecho de Mesina, opuesta a Caribdis.' },
  { level: 15, name: 'Caribdis',         type: 'bestia',   emoji: '🌊', description: 'Remolino monstruoso que tragaba el mar tres veces al día. Némesis de los marineros en el estrecho.' },
  { level: 16, name: 'León de Nemea',    type: 'bestia',   emoji: '🦁', description: 'Primer trabajo de Heracles. Un león invulnerable cuya piel dorada se convirtió en la armadura del héroe.' },
  { level: 17, name: 'Jabalí de Erimanto', type: 'bestia', emoji: '🐗', description: 'Cuarto trabajo de Heracles. Gigantesco jabalí que sembraba el terror en las montañas del Peloponeso.' },
  { level: 18, name: 'Cierva de Cerinea', type: 'criatura', emoji: '🦌', description: 'Tercera tarea de Heracles. Una cierva de pezuñas de bronce y cuernos de oro sagrada para Artemisa.' },
  { level: 19, name: 'Aves del Estínfalo', type: 'bestia', emoji: '🐦', description: 'Aves de plumas metálicas que lanzaban sus plumas como flechas. Sexto trabajo de Heracles.' },
  { level: 20, name: 'Toro de Creta',    type: 'bestia',   emoji: '🐂', description: 'Séptimo trabajo de Heracles. El mismo toro padre del Minotauro que asolaba la isla de Creta.' },
  { level: 21, name: 'Perseo',           type: 'heroe',    emoji: '⚡', description: 'Hijo de Zeus y Dánae. Decapitó a Medusa y rescató a Andrómeda. Fundador del linaje de los Perseidas.' },
  { level: 22, name: 'Teseo',            type: 'heroe',    emoji: '🗡️', description: 'Rey de Atenas, derrotó al Minotauro en el laberinto con el hilo de Ariadna. Símbolo de la democracia ateniense.' },
  { level: 23, name: 'Heracles',         type: 'heroe',    emoji: '💪', description: 'El más grande de los héroes griegos. Realizó los doce trabajos y ascendió al Olimpo para unirse a los dioses.' },
  { level: 24, name: 'Aquiles',          type: 'heroe',    emoji: '🛡️', description: 'El guerrero más veloz de la Guerra de Troya. Hijo de la ninfa Tetis, invulnerable salvo en su talón.' },
  { level: 25, name: 'Odiseo',           type: 'heroe',    emoji: '🌊', description: 'Rey de Ítaca, el más astuto de los griegos. Tardó 10 años en volver a casa tras la caída de Troya.' },
  { level: 26, name: 'Jasón',            type: 'heroe',    emoji: '⚓', description: 'Líder de los Argonautas en la búsqueda del Vellocino de Oro. Navegante legendario y líder de hombres.' },
  { level: 27, name: 'Atalanta',         type: 'heroe',    emoji: '🏹', description: 'Heroína cazadora, la más veloz de los mortales. Participó en la caza del jabalí de Calidón.' },
  { level: 28, name: 'Orfeo',            type: 'heroe',    emoji: '🎵', description: 'El músico más grande del mundo antiguo. Bajó al Inframundo para recuperar a Eurídice con su lira.' },
  { level: 29, name: 'Prometeo',         type: 'entidad',  emoji: '🔥', description: 'Titán que robó el fuego a los dioses para dárselo a la humanidad. Encadenado eternamente en el Cáucaso.' },
  { level: 30, name: 'Cronos',           type: 'entidad',  emoji: '⏳', description: 'Señor de los Titanes y dios del tiempo. Padre de los dioses olímpicos, fue derrocado por su hijo Zeus.' },
]

export const TYPE_LABELS: Record<MythType, string> = {
  bestia: 'Bestia', heroe: 'Héroe', criatura: 'Criatura', entidad: 'Entidad',
}

export const TYPE_COLORS: Record<MythType, { bg: string; border: string; text: string }> = {
  bestia:   { bg: 'rgba(192,57,43,0.12)',  border: 'rgba(192,57,43,0.45)',  text: '#e74c3c' },
  heroe:    { bg: 'rgba(212,175,55,0.12)', border: 'rgba(212,175,55,0.45)', text: '#d4af37' },
  criatura: { bg: 'rgba(126,200,227,0.12)',border: 'rgba(126,200,227,0.4)', text: '#7ec8e3' },
  entidad:  { bg: 'rgba(138,43,226,0.12)', border: 'rgba(138,43,226,0.45)', text: '#9b59b6' },
}
