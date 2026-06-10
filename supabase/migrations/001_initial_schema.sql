-- ====================================
-- MYTHIC QUEST 2.0 — SCHEMA INICIAL
-- ====================================

-- ─── EXTENSIONES ─────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── PROFILES (extiende auth.users) ──
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username   TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── HEROES ──────────────────────────
CREATE TABLE IF NOT EXISTS heroes (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  avatar           TEXT DEFAULT '⚔️',
  patron_god       TEXT DEFAULT 'zeus',
  class            TEXT DEFAULT 'guerrero',
  level            INT DEFAULT 1,
  xp               INT DEFAULT 0,
  gold             INT DEFAULT 0,
  streak           INT DEFAULT 0,
  last_active_date DATE,
  -- Atributos
  strength         INT DEFAULT 0,
  wisdom           INT DEFAULT 0,
  discipline       INT DEFAULT 0,
  charisma         INT DEFAULT 0,
  creativity       INT DEFAULT 0,
  total_quests_completed INT DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── QUESTS (Misiones/Hábitos) ────────
CREATE TABLE IF NOT EXISTS quests (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  description    TEXT,
  category       TEXT NOT NULL DEFAULT 'general',
  difficulty     TEXT NOT NULL DEFAULT 'media',
  frequency      TEXT NOT NULL DEFAULT 'diaria',
  is_completed   BOOLEAN DEFAULT FALSE,
  last_reset_date DATE,
  xp_reward      INT DEFAULT 50,
  gold_reward    INT DEFAULT 10,
  attribute_bonus TEXT,   -- 'strength', 'wisdom', etc.
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ACHIEVEMENTS (Hazañas) ───────────
CREATE TABLE IF NOT EXISTS achievements (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  unlocked_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_key)
);

-- ─── GODS (Seed table — lectura pública) ───
CREATE TABLE IF NOT EXISTS gods (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,
  slug                TEXT UNIQUE NOT NULL,
  title               TEXT,
  description         TEXT,
  area                TEXT,
  emoji               TEXT,
  bonus_description   TEXT,
  unlock_level        INT DEFAULT 1,
  color_hex           TEXT DEFAULT '#D4A017',
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── USER_GODS (relación usuario-dioses) ──
CREATE TABLE IF NOT EXISTS user_gods (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  god_id      UUID NOT NULL REFERENCES gods(id),
  favor_level INT DEFAULT 0,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, god_id)
);

-- ─── STORY CHAPTERS (Seed — lectura pública) ──
CREATE TABLE IF NOT EXISTS story_chapters (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_number    INT UNIQUE NOT NULL,
  title             TEXT NOT NULL,
  subtitle          TEXT,
  narrative_text    TEXT NOT NULL,
  unlock_level      INT DEFAULT 1,
  unlock_quests_count INT DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── STORY CHOICES ───────────────────
CREATE TABLE IF NOT EXISTS story_choices (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id     UUID NOT NULL REFERENCES story_chapters(id) ON DELETE CASCADE,
  choice_text    TEXT NOT NULL,
  consequence    TEXT,
  effect_type    TEXT,    -- 'attribute', 'god_favor', 'gold'
  effect_target  TEXT,    -- 'wisdom', 'atenea', etc.
  effect_value   INT DEFAULT 5
);

-- ─── USER STORY PROGRESS ─────────────
CREATE TABLE IF NOT EXISTS user_story_progress (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id    UUID NOT NULL REFERENCES story_chapters(id),
  status        TEXT DEFAULT 'locked',   -- locked | unlocked | completed
  unlocked_at   TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  choice_made   UUID REFERENCES story_choices(id),
  UNIQUE(user_id, chapter_id)
);

-- ====================================
-- ROW LEVEL SECURITY
-- ====================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE heroes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_gods ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_story_progress ENABLE ROW LEVEL SECURITY;

-- Políticas: cada usuario solo ve y modifica sus propios datos
CREATE POLICY "profiles_own" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "heroes_own" ON heroes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "quests_own" ON quests FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "achievements_own" ON achievements FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_gods_own" ON user_gods FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_story_own" ON user_story_progress FOR ALL USING (auth.uid() = user_id);

-- Tablas seed: lectura pública (sin auth)
CREATE POLICY "gods_public_read" ON gods FOR SELECT USING (true);
CREATE POLICY "story_chapters_public_read" ON story_chapters FOR SELECT USING (true);
CREATE POLICY "story_choices_public_read" ON story_choices FOR SELECT USING (true);
ALTER TABLE gods ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_choices ENABLE ROW LEVEL SECURITY;

-- ====================================
-- TRIGGER: Crear profile + hero al registrar usuario
-- ====================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, username)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ====================================
-- SEED: DIOSES GRIEGOS
-- ====================================
INSERT INTO gods (name, slug, title, description, area, emoji, bonus_description, unlock_level, color_hex) VALUES
('Zeus', 'zeus', 'Señor del Olimpo', 'El padre de los dioses, dios del trueno y la soberanía. Su favor otorga poder sobre los demás y voluntad de hierro.', 'Poder y Liderazgo', '⚡', '+15% XP en todas las misiones', 1, '#F5C542'),
('Atenea', 'atenea', 'Diosa de la Sabiduría', 'Nacida de la cabeza de Zeus con armadura completa, Atenea representa la sabiduría táctica, las artes y la justicia.', 'Sabiduría y Estrategia', '🦉', '+20% XP en misiones de Estudio y Estrategia', 3, '#7EC8E3'),
('Ares', 'ares', 'Dios de la Guerra', 'Dios del combate y la ferocidad. Su favor forja guerreros imparables que nunca abandonan sus objetivos.', 'Fuerza y Combate', '🗡️', '+20% XP en misiones Físicas', 5, '#C0392B'),
('Hermes', 'hermes', 'Mensajero de los Dioses', 'Veloz como el viento, Hermes protege a los viajeros, comerciantes y a quienes buscan nuevos caminos.', 'Velocidad y Comercio', '🪶', '+15% oro en todas las misiones', 7, '#2ECC71'),
('Afrodita', 'afrodita', 'Diosa del Amor', 'La más bella del Olimpo, Afrodita bendice a quienes cultivan conexiones y expresan su creatividad con pasión.', 'Creatividad y Carisma', '🌹', '+20% XP en misiones Sociales y Artísticas', 9, '#E91E8C'),
('Apolo', 'apolo', 'Dios de la Luz', 'Dios del sol, la música, la poesía y la curación. Apolo ilumina el camino de los artistas y sabios.', 'Arte y Curación', '☀️', '+20% XP en misiones Espirituales y Artísticas', 12, '#FF9800'),
('Poseidón', 'poseidon', 'Señor de los Mares', 'Hermano de Zeus, dios de los océanos y los terremotos. Su favor otorga adaptabilidad y fuerza inquebrantable.', 'Disciplina y Adaptación', '🔱', '+20% XP en misiones de Disciplina', 15, '#1565C0'),
('Hades', 'hades', 'Rey del Inframundo', 'Señor de los muertos y guardián de las riquezas ocultas de la tierra. Solo los más persistentes ganan su respeto.', 'Persistencia y Riqueza', '💀', 'x2 oro al completar rachas de 7+ días', 20, '#6A1B9A'),
('Artemisa', 'artemisa', 'Diosa de la Caza', 'Diosa de la luna y la caza, protectora de la naturaleza y la independencia. Premia la constancia y la precisión.', 'Constancia y Naturaleza', '🌙', 'Racha nunca pierde bonus por 1 día de inactividad', 25, '#00897B')
ON CONFLICT (slug) DO NOTHING;

-- ====================================
-- SEED: CAPÍTULOS DE HISTORIA
-- ====================================
INSERT INTO story_chapters (chapter_number, title, subtitle, narrative_text, unlock_level, unlock_quests_count) VALUES
(1, 'El Despertar del Héroe', 'Tus primeros pasos en el mundo de los dioses',
'Las nieblas del Olimpo se disipan ante tus ojos. Una voz grave resuena entre las nubes:

"Mortal. Hemos estado observándote."

Zeus te contempla desde su trono dorado, sus ojos cargados del peso de los milenios. A su lado, Atenea sostiene su lanza con la serenidad de quien conoce todos los resultados posibles.

"El mundo necesita héroes. No nacen, se forjan. Cada hábito que cultivas, cada desafío que superas, es un golpe sobre el yunque de tu destino."

Sientes en tu pecho algo nuevo: el fuego de la ambición divina.

¿Cómo respondes al llamado del Olimpo?',
1, 0),

(2, 'La Prueba de la Voluntad', 'Zeus pone a prueba tu determinación',
'Han pasado días desde que respondiste al llamado. Zeus observa tu progreso desde su nube, y no está del todo convencido.

"Muchos mortales prometen mucho al principio", dice, haciendo girar un rayo entre sus dedos. "Pocos mantienen el fuego cuando nadie los mira."

Atenea interviene: "Señor, este héroe ha demostrado constancia. Permitidle continuar."

Un silencio eterno. Luego Zeus sonríe —apenas, como si le doliera hacerlo.

"Bien. Pero las pruebas apenas comienzan. El Olimpo solo acepta a los que perseveran."

¿Cuál es tu respuesta?',
3, 5),

(3, 'El Don de Atenea', 'La diosa de la sabiduría te otorga su guía',
'Atenea aparece ante ti en la biblioteca del Olimpo, entre estantes de pergaminos que contienen todo el conocimiento de la humanidad.

"Bienvenido", dice. "Zeus puede medir tu fuerza, pero yo mido algo más difícil de ver: tu mente."

Saca un pergamino y te lo tiende.

"Cada conocimiento que adquieras, cada decisión que tomes con consciencia, me habla más de ti que cualquier batalla. El verdadero poder, héroe, no está en los músculos ni en el oro. Está en saber cuándo usarlos."

Te entrega una lechuza pequeña, símbolo de su favor.

¿Qué camino de conocimiento elegís?',
5, 10),

(4, 'La Furia de Ares', 'El dios de la guerra exige que demuestres tu fuerza',
'Ares bloquea tu camino. El dios de la guerra es todo lo que su nombre promete: violento, directo, implacable.

"He oído que te llaman héroe", dice con una sonrisa que no es amistosa. "Los héroes que conozco yo tienen músculos, no palabras."

Lanza hacia tus pies una espada oxidada.

"Entrena. Supera tus límites físicos. Demuéstrame que tu cuerpo es tan fuerte como tu espíritu. Los dioses del Olimpo no se impresionan con excusas."

Tomas la espada. Pesa más de lo que esperabas.

¿Cómo enfrentás el desafío de Ares?',
8, 15),

(5, 'El Mercado de Hermes', 'El dios mensajero te propone un trato',
'Hermes aparece de la nada, literalmente, con una bandeja de frutas doradas y una sonrisa que promete complicaciones.

"¡Héroe! Justo la persona que necesitaba ver." Señala hacia el horizonte, donde brillan las luces de un mercado celestial. "Los dioses también comercian, ¿sabías? Y yo soy el mejor en eso."

Te ofrece una moneda de oro que gira sola entre sus dedos.

"El oro que acumulas con tu esfuerzo tiene valor aquí también. Cada misión completada, cada hábito mantenido, te acerca a recompensas que ni Zeus puede negarles a quienes las merecen."

¿Aceptás el trato de Hermes?',
10, 20)
ON CONFLICT (chapter_number) DO NOTHING;

-- ====================================
-- SEED: OPCIONES DE HISTORIA
-- ====================================
-- Capítulo 1
WITH ch1 AS (SELECT id FROM story_chapters WHERE chapter_number = 1)
INSERT INTO story_choices (chapter_id, choice_text, consequence, effect_type, effect_target, effect_value)
SELECT id,
  'Acepto el llamado con honor. Prometo forjarme en el esfuerzo diario.',
  'Zeus asiente. Un rayo dora suavemente tu pecho. Sientes +Fuerza fluir por tus venas.',
  'attribute', 'strength', 10
FROM ch1
UNION ALL
SELECT id,
  'Me inclino en señal de respeto y pido la guía de Atenea.',
  'Atenea sonríe por primera vez en siglos. Una lechuza se posa en tu hombro. Sientes +Sabiduría.',
  'attribute', 'wisdom', 10
FROM ch1
ON CONFLICT DO NOTHING;

-- Capítulo 2
WITH ch2 AS (SELECT id FROM story_chapters WHERE chapter_number = 2)
INSERT INTO story_choices (chapter_id, choice_text, consequence, effect_type, effect_target, effect_value)
SELECT id,
  'La perseverancia es mi mayor arma. No me detendré.',
  'Zeus lanza un rayo al cielo en señal de aprobación. Tu Disciplina se fortalece.',
  'attribute', 'discipline', 10
FROM ch2
UNION ALL
SELECT id,
  'Pido más tiempo. La paciencia también es virtud.',
  'Atenea te guiña el ojo. Tu Sabiduría crece, junto con el respeto de los dioses.',
  'attribute', 'wisdom', 8
FROM ch2
ON CONFLICT DO NOTHING;

-- Capítulo 3
WITH ch3 AS (SELECT id FROM story_chapters WHERE chapter_number = 3)
INSERT INTO story_choices (chapter_id, choice_text, consequence, effect_type, effect_target, effect_value)
SELECT id,
  'El conocimiento práctico: aprendo haciendo, no solo leyendo.',
  'Atenea asiente satisfecha. Tu Fuerza y Disciplina crecen juntas.',
  'attribute', 'discipline', 8
FROM ch3
UNION ALL
SELECT id,
  'La filosofía y el pensamiento profundo: primero entender, luego actuar.',
  'La lechuza de Atenea canta. Tu Sabiduría da un gran salto.',
  'attribute', 'wisdom', 12
FROM ch3
ON CONFLICT DO NOTHING;

-- Capítulo 4
WITH ch4 AS (SELECT id FROM story_chapters WHERE chapter_number = 4)
INSERT INTO story_choices (chapter_id, choice_text, consequence, effect_type, effect_target, effect_value)
SELECT id,
  'Levanto la espada con determinación. El cuerpo también es un templo.',
  'Ares grita de aprobación. Tu Fuerza aumenta significativamente.',
  'attribute', 'strength', 15
FROM ch4
UNION ALL
SELECT id,
  'La mente estratégica supera la fuerza bruta. Entreno con inteligencia.',
  'Ares frunce el ceño, pero Atenea aplaude. +Sabiduría y +Disciplina.',
  'attribute', 'discipline', 10
FROM ch4
ON CONFLICT DO NOTHING;

-- Capítulo 5
WITH ch5 AS (SELECT id FROM story_chapters WHERE chapter_number = 5)
INSERT INTO story_choices (chapter_id, choice_text, consequence, effect_type, effect_target, effect_value)
SELECT id,
  'Acepto el trato. El oro ganado con esfuerzo merece invertirse bien.',
  'Hermes sella el trato con un apretón de manos. +50 de oro extra.',
  'gold', 'gold', 50
FROM ch5
UNION ALL
SELECT id,
  'No necesito intermediarios. Construyo mi propio camino al Olimpo.',
  'Hermes ríe. "Me gusta tu independencia." Tu Carisma aumenta.',
  'attribute', 'charisma', 12
FROM ch5
ON CONFLICT DO NOTHING;
