-- Migration: 20260911120000_plus_memories_phase_1b.sql
-- HAXR Plus Memories — Fase 1B: Identidade, Sessões Revogáveis, Access Links e Upload Intents Idempotentes.
-- Alvo autorizado: Somente Preview (br-flat-block-ayfks0so). Não aplicar em Produção sem autorização explícita.

-- 1. memory_experiences: adicionar colunas aditivas e chave estrangeira para events
ALTER TABLE memory_experiences
  ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES events(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS access_mode text NOT NULL DEFAULT 'legacy',
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'moderated',
  ADD COLUMN IF NOT EXISTS uploads_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS competition_enabled boolean NOT NULL DEFAULT true;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'memory_experiences_access_mode_check') THEN
    ALTER TABLE memory_experiences
      ADD CONSTRAINT memory_experiences_access_mode_check
      CHECK (access_mode IN ('legacy', 'session'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'memory_experiences_visibility_check') THEN
    ALTER TABLE memory_experiences
      ADD CONSTRAINT memory_experiences_visibility_check
      CHECK (visibility IN ('community', 'moderated', 'private_to_couple'));
  END IF;
END $$;

-- Backfill determinístico de event_id para experiências existentes
UPDATE memory_experiences me
SET event_id = e.id
FROM events e
WHERE me.event_slug = 'jessicasamuelwedding'
  AND e.edition_registry_key = 'jessica-samuel-wedding'
  AND me.event_id IS NULL;

CREATE INDEX IF NOT EXISTS memory_experiences_event_id_idx
  ON memory_experiences (event_id);

-- 2. memory_share_links: evolução para suportar token_hash, scopes, expiração e revogação
ALTER TABLE memory_share_links
  ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS token_hash text,
  ADD COLUMN IF NOT EXISTS scope_type text NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS scope_guest_id uuid REFERENCES guests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS scope_table_id text,
  ADD COLUMN IF NOT EXISTS max_uses integer,
  ADD COLUMN IF NOT EXISTS uses integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'memory_share_links_scope_type_check') THEN
    ALTER TABLE memory_share_links
      ADD CONSTRAINT memory_share_links_scope_type_check
      CHECK (scope_type IN ('general', 'guest', 'table'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'memory_share_links_max_uses_check') THEN
    ALTER TABLE memory_share_links
      ADD CONSTRAINT memory_share_links_max_uses_check
      CHECK (max_uses IS NULL OR max_uses > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'memory_share_links_uses_check') THEN
    ALTER TABLE memory_share_links
      ADD CONSTRAINT memory_share_links_uses_check
      CHECK (uses >= 0);
  END IF;
END $$;

-- Backfill de event_id em memory_share_links a partir de memory_experiences
UPDATE memory_share_links msl
SET event_id = me.event_id
FROM memory_experiences me
WHERE msl.experience_id = me.id
  AND msl.event_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS memory_share_links_token_hash_uidx
  ON memory_share_links (token_hash)
  WHERE token_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS memory_share_links_event_id_idx
  ON memory_share_links (event_id);

-- 3. memory_participants: identidade por evento vinculada à experiência
CREATE TABLE IF NOT EXISTS memory_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  experience_id uuid REFERENCES memory_experiences(id) ON DELETE CASCADE,
  guest_id uuid REFERENCES guests(id) ON DELETE SET NULL,
  assigned_table_id text,
  display_name text,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS memory_participants_event_guest_idx
  ON memory_participants (event_id, guest_id);

CREATE INDEX IF NOT EXISTS memory_participants_experience_idx
  ON memory_participants (experience_id);

-- 4. memory_sessions: sessões persistidas revogáveis com hash criptográfico
CREATE TABLE IF NOT EXISTS memory_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL UNIQUE,
  participant_id uuid NOT NULL REFERENCES memory_participants(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  experience_id uuid REFERENCES memory_experiences(id) ON DELETE CASCADE,
  access_link_id uuid REFERENCES memory_share_links(id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS memory_sessions_event_participant_idx
  ON memory_sessions (event_id, participant_id);

CREATE INDEX IF NOT EXISTS memory_sessions_active_idx
  ON memory_sessions (expires_at)
  WHERE revoked_at IS NULL;

-- 5. wedding_photos: adicionar event_id e backfill
ALTER TABLE wedding_photos
  ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES events(id) ON DELETE RESTRICT;

UPDATE wedding_photos wp
SET event_id = me.event_id
FROM memory_experiences me
WHERE (wp.experience_id = me.id OR wp.invitation_slug = me.invitation_slug)
  AND wp.event_id IS NULL;

-- Backfill para casamento tradicional
UPDATE wedding_photos wp
SET event_id = e.id
FROM events e
WHERE wp.invitation_slug = 'jessicaesamueltraditionalwedding'
  AND e.edition_registry_key = 'traditional-wedding'
  AND wp.event_id IS NULL;

CREATE INDEX IF NOT EXISTS wedding_photos_event_id_idx
  ON wedding_photos (event_id);

-- 6. photo_upload_intents: vínculo a evento, participante, sessão e receipt de media
ALTER TABLE photo_upload_intents
  ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES events(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS participant_id uuid REFERENCES memory_participants(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES memory_sessions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS completed_media_id uuid REFERENCES wedding_photos(id) ON DELETE SET NULL;

-- Actualizar constraint de status para permitir 'completed' e 'cancelled'
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'photo_upload_intents_status_check') THEN
    ALTER TABLE photo_upload_intents DROP CONSTRAINT photo_upload_intents_status_check;
  END IF;
  ALTER TABLE photo_upload_intents
    ADD CONSTRAINT photo_upload_intents_status_check
    CHECK (status IN ('pending', 'consumed', 'completed', 'expired', 'cancelled'));

  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'photo_upload_intents_consumed_at_status') THEN
    ALTER TABLE photo_upload_intents DROP CONSTRAINT photo_upload_intents_consumed_at_status;
  END IF;
  ALTER TABLE photo_upload_intents
    ADD CONSTRAINT photo_upload_intents_consumed_at_status
    CHECK (
      ((status IN ('consumed', 'completed')) AND (consumed_at IS NOT NULL))
      OR
      ((status NOT IN ('consumed', 'completed')) AND (consumed_at IS NULL))
    );
END $$;

UPDATE photo_upload_intents poi
SET event_id = me.event_id
FROM memory_experiences me
WHERE (poi.experience_id = me.id OR poi.invitation_slug = me.invitation_slug)
  AND poi.event_id IS NULL;

UPDATE photo_upload_intents poi
SET event_id = e.id
FROM events e
WHERE poi.invitation_slug = 'jessicaesamueltraditionalwedding'
  AND e.edition_registry_key = 'traditional-wedding'
  AND poi.event_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS photo_upload_intents_completed_media_uidx
  ON photo_upload_intents (completed_media_id)
  WHERE completed_media_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS photo_upload_intents_event_participant_idx
  ON photo_upload_intents (event_id, participant_id);

-- 7. RLS e Grants para roles runtime
ALTER TABLE memory_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_upload_intents ENABLE ROW LEVEL SECURITY;

-- Grants para haxr_edition_runtime, edition_runtime e haxrweb_runtime
GRANT SELECT ON events TO haxr_edition_runtime, edition_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON memory_experiences TO haxrweb_runtime, haxr_edition_runtime, edition_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON memory_share_links TO haxrweb_runtime, haxr_edition_runtime, edition_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON memory_participants TO haxrweb_runtime, haxr_edition_runtime, edition_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON memory_sessions TO haxrweb_runtime, haxr_edition_runtime, edition_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON wedding_photos TO haxrweb_runtime, haxr_edition_runtime, edition_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON photo_upload_intents TO haxrweb_runtime, haxr_edition_runtime, edition_runtime;

-- Policies RLS
DROP POLICY IF EXISTS memories_events_edition_read_policy ON events;
CREATE POLICY memories_events_edition_read_policy ON events
  FOR SELECT TO edition_runtime, haxr_edition_runtime
  USING (true);

DROP POLICY IF EXISTS memories_experiences_runtime_policy ON memory_experiences;
CREATE POLICY memories_experiences_runtime_policy ON memory_experiences
  FOR ALL TO haxrweb_runtime, haxr_edition_runtime, edition_runtime
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS memories_share_links_runtime_policy ON memory_share_links;
CREATE POLICY memories_share_links_runtime_policy ON memory_share_links
  FOR ALL TO haxrweb_runtime, haxr_edition_runtime, edition_runtime
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS memories_participants_runtime_policy ON memory_participants;
CREATE POLICY memories_participants_runtime_policy ON memory_participants
  FOR ALL TO haxrweb_runtime, haxr_edition_runtime, edition_runtime
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS memories_sessions_runtime_policy ON memory_sessions;
CREATE POLICY memories_sessions_runtime_policy ON memory_sessions
  FOR ALL TO haxrweb_runtime, haxr_edition_runtime, edition_runtime
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS memories_wedding_photos_runtime_policy ON wedding_photos;
CREATE POLICY memories_wedding_photos_runtime_policy ON wedding_photos
  FOR ALL TO haxrweb_runtime, haxr_edition_runtime, edition_runtime
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS memories_upload_intents_runtime_policy ON photo_upload_intents;
CREATE POLICY memories_upload_intents_runtime_policy ON photo_upload_intents
  FOR ALL TO haxrweb_runtime, haxr_edition_runtime, edition_runtime
  USING (true)
  WITH CHECK (true);
