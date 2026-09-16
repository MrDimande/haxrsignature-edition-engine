-- ==============================================================================
-- HAXR PLUS MEMORIES — FASE 2: MEDIA CORE + EVENT STAGES + METADATA + MOMENTS
-- Target: Neon Preview (br-flat-block-ayfks0so)
-- ==============================================================================

-- 1. memory_stages: Etapas configuráveis por experiência e evento
CREATE TABLE IF NOT EXISTS memory_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id uuid NOT NULL REFERENCES memory_experiences(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  slug text NOT NULL,
  label text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT memory_stages_time_window_check CHECK (starts_at IS NULL OR ends_at IS NULL OR starts_at < ends_at),
  CONSTRAINT memory_stages_experience_slug_key UNIQUE (experience_id, slug),
  CONSTRAINT memory_stages_id_event_id_key UNIQUE (id, event_id),
  CONSTRAINT memory_stages_composite_identity_key UNIQUE (id, event_id, experience_id)
);

CREATE INDEX IF NOT EXISTS memory_stages_exp_order_idx
  ON memory_stages (experience_id, order_index);

CREATE INDEX IF NOT EXISTS memory_stages_event_active_idx
  ON memory_stages (event_id, is_active);

-- 2. wedding_photos: Unicidade composta de identidade de evento
-- Assegura que (id, event_id) é único para permitir FKs compostas de isolamento
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wedding_photos_id_event_id_key'
  ) THEN
    ALTER TABLE wedding_photos
      ADD CONSTRAINT wedding_photos_id_event_id_key UNIQUE (id, event_id);
  END IF;
END $$;

-- 3. wedding_photos: Evolução de metadados do Media Core
ALTER TABLE wedding_photos
  ADD COLUMN IF NOT EXISTS captured_at timestamptz,
  ADD COLUMN IF NOT EXISTS stage_id uuid,
  ADD COLUMN IF NOT EXISTS width integer CHECK (width IS NULL OR width > 0),
  ADD COLUMN IF NOT EXISTS height integer CHECK (height IS NULL OR height > 0),
  ADD COLUMN IF NOT EXISTS orientation text,
  ADD COLUMN IF NOT EXISTS duration_seconds numeric(8, 2) CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  ADD COLUMN IF NOT EXISTS thumbnail_storage_path text,
  ADD COLUMN IF NOT EXISTS poster_storage_path text;

-- Integridade relacional composta ao nível da BD:
-- Impede que uma foto do Evento A aponte para um Stage do Evento B
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wedding_photos_stage_event_fkey'
  ) THEN
    ALTER TABLE wedding_photos
      ADD CONSTRAINT wedding_photos_stage_event_fkey
      FOREIGN KEY (stage_id, event_id)
      REFERENCES memory_stages(id, event_id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS wedding_photos_stage_idx
  ON wedding_photos (stage_id);

CREATE INDEX IF NOT EXISTS wedding_photos_event_media_type_idx
  ON wedding_photos (event_id, media_type);

CREATE INDEX IF NOT EXISTS wedding_photos_event_captured_idx
  ON wedding_photos (event_id, COALESCE(captured_at, created_at) DESC);

-- Backfill media_type para vídeos existentes
UPDATE wedding_photos
SET media_type = 'video'
WHERE content_type LIKE 'video/%'
  AND media_type <> 'video';

-- Backfill experience_id para wedding_photos a partir de memory_experiences
UPDATE wedding_photos wp
SET experience_id = me.id
FROM memory_experiences me
WHERE wp.event_id = me.event_id
  AND wp.experience_id IS NULL;

-- 4. photo_upload_intents: Metadados no intent
ALTER TABLE photo_upload_intents
  ADD COLUMN IF NOT EXISTS stage_id uuid,
  ADD COLUMN IF NOT EXISTS captured_at timestamptz,
  ADD COLUMN IF NOT EXISTS width integer,
  ADD COLUMN IF NOT EXISTS height integer,
  ADD COLUMN IF NOT EXISTS duration_seconds numeric(8, 2),
  ADD COLUMN IF NOT EXISTS thumbnail_storage_path text,
  ADD COLUMN IF NOT EXISTS poster_storage_path text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'photo_upload_intents_stage_event_fkey'
  ) THEN
    ALTER TABLE photo_upload_intents
      ADD CONSTRAINT photo_upload_intents_stage_event_fkey
      FOREIGN KEY (stage_id, event_id)
      REFERENCES memory_stages(id, event_id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- 5. memory_participants: Unicidade composta de identidade de evento
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'memory_participants_id_event_id_key'
  ) THEN
    ALTER TABLE memory_participants
      ADD CONSTRAINT memory_participants_id_event_id_key UNIQUE (id, event_id);
  END IF;
END $$;

-- 6. memory_media_views: Seen state por participante com integridade estrita
CREATE TABLE IF NOT EXISTS memory_media_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  experience_id uuid NOT NULL REFERENCES memory_experiences(id) ON DELETE CASCADE,
  media_id uuid NOT NULL,
  participant_id uuid NOT NULL,
  session_id uuid REFERENCES memory_sessions(id) ON DELETE SET NULL,
  seen_at timestamptz NOT NULL DEFAULT now(),
  last_progress numeric(4, 3) NOT NULL DEFAULT 1.0 CHECK (last_progress >= 0.0 AND last_progress <= 1.0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT memory_media_views_participant_media_key UNIQUE (participant_id, media_id),
  -- Integridade de isolamento: media_id DEVE pertencer ao mesmo event_id
  CONSTRAINT memory_media_views_media_event_fkey
    FOREIGN KEY (media_id, event_id)
    REFERENCES wedding_photos(id, event_id)
    ON DELETE CASCADE,
  -- Integridade de isolamento: participant_id DEVE pertencer ao mesmo event_id
  CONSTRAINT memory_media_views_participant_event_fkey
    FOREIGN KEY (participant_id, event_id)
    REFERENCES memory_participants(id, event_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS memory_media_views_part_event_idx
  ON memory_media_views (participant_id, event_id);

CREATE INDEX IF NOT EXISTS memory_media_views_media_idx
  ON memory_media_views (media_id);

-- 7. RLS e Princípio do Mínimo Privilégio
ALTER TABLE memory_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_media_views ENABLE ROW LEVEL SECURITY;

-- memory_stages: Leitura para roles runtime; Escrita restrita a haxrweb_runtime (admin)
GRANT SELECT ON memory_stages TO edition_runtime, haxr_edition_runtime, haxrweb_runtime;
GRANT INSERT, UPDATE, DELETE ON memory_stages TO haxrweb_runtime;

DROP POLICY IF EXISTS memory_stages_read_policy ON memory_stages;
CREATE POLICY memory_stages_read_policy ON memory_stages
  FOR SELECT TO edition_runtime, haxr_edition_runtime, haxrweb_runtime
  USING (is_active = true OR current_user = 'haxrweb_runtime');

DROP POLICY IF EXISTS memory_stages_admin_write_policy ON memory_stages;
CREATE POLICY memory_stages_admin_write_policy ON memory_stages
  FOR ALL TO haxrweb_runtime
  USING (true)
  WITH CHECK (true);

-- memory_media_views: Leitura e inserção/upsert para runtime autorizado
GRANT SELECT, INSERT, UPDATE ON memory_media_views TO edition_runtime, haxr_edition_runtime, haxrweb_runtime;

DROP POLICY IF EXISTS memory_media_views_runtime_policy ON memory_media_views;
CREATE POLICY memory_media_views_runtime_policy ON memory_media_views
  FOR ALL TO edition_runtime, haxr_edition_runtime, haxrweb_runtime
  USING (participant_id IS NOT NULL)
  WITH CHECK (participant_id IS NOT NULL);

-- 8. Seed default stages para experiências existentes
INSERT INTO memory_stages (experience_id, event_id, slug, label, order_index, is_active)
SELECT 
  me.id,
  me.event_id,
  s.slug,
  s.label,
  s.order_index,
  true
FROM memory_experiences me
CROSS JOIN (
  VALUES 
    ('preparativos', 'Preparativos', 10),
    ('cerimonia', 'Cerimónia', 20),
    ('recepcao', 'Recepção & Brinde', 30),
    ('festa', 'Festa & Pista', 40),
    ('pos-festa', 'After-Party / Memórias Finais', 50)
) AS s(slug, label, order_index)
ON CONFLICT (experience_id, slug) DO NOTHING;

-- Associar fotos existentes sem stage ao stage 'recepcao' da respectiva experiência
UPDATE wedding_photos wp
SET stage_id = ms.id
FROM memory_stages ms
WHERE ms.experience_id = wp.experience_id
  AND ms.slug = 'recepcao'
  AND wp.stage_id IS NULL;

