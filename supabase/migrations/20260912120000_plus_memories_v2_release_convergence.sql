-- =====================================================================================
-- HAXR SIGNATURE — PLUS MEMORIES 2.0 CANONICAL RELEASE CONVERGENCE MIGRATION
-- Ficheiro: 20260912120000_plus_memories_v2_release_convergence.sql
-- Propósito: Migração canónica atómica de Produção (Fases 1B a 8 Consolidadas).
-- Alvo: Produção (br-wandering-bonus-ay2ex5lx) — EXECUTAR APENAS NA FASE 9B APÓS APROVAÇÃO.
-- =====================================================================================

BEGIN;

-- -------------------------------------------------------------------------------------
-- 0. TIMEOUTS DE SEGURANÇA E PRECONDIÇÕES
-- -------------------------------------------------------------------------------------
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

-- Tabela temporária de baseline para verificação intra-transaccional de integridade
CREATE TEMP TABLE _haxr_migration_baseline_check ON COMMIT DROP AS
SELECT 
  count(*)::integer as total_count,
  md5(string_agg(
    id::text || '|' || 
    invitation_slug || '|' || 
    storage_path || '|' || 
    COALESCE(original_filename, '') || '|' || 
    content_type || '|' || 
    file_size_bytes::text || '|' || 
    COALESCE(guest_name, '') || '|' || 
    COALESCE(caption, '') || '|' || 
    moderation_status,
    '#' ORDER BY id
  )) as legacy_hash
FROM wedding_photos;

DO $$
DECLARE
  v_count integer;
  v_exp_count integer;
  v_ev_count integer;
BEGIN
  -- 1. Assert baseline wedding_photos count is strictly 147
  SELECT total_count INTO v_count FROM _haxr_migration_baseline_check;
  IF v_count <> 147 THEN
    RAISE EXCEPTION 'SAFETY_GATE_TRIGGERED: wedding_photos baseline mismatch (count = %, expected 147). Se novos media legítimos foram submetidos, reauditar baseline.', v_count;
  END IF;

  -- 2. Assert events table exists e contém os eventos canónicos
  SELECT count(*)::integer INTO v_ev_count 
  FROM events 
  WHERE edition_registry_key IN ('jessica-samuel-wedding', 'traditional-wedding');
  IF v_ev_count < 2 THEN
    RAISE EXCEPTION 'SAFETY_GATE_TRIGGERED: Eventos canónicos Jessica & Samuel não encontrados em events (matches: %).', v_ev_count;
  END IF;

  -- 3. Assert memory_experiences table exists e possui a experiência correspondente
  SELECT count(*)::integer INTO v_exp_count 
  FROM memory_experiences 
  WHERE event_slug = 'jessicasamuelwedding';
  IF v_exp_count <> 1 THEN
    RAISE EXCEPTION 'SAFETY_GATE_TRIGGERED: memory_experiences de jessicasamuelwedding não encontrada ou ambígua (matches: %).', v_exp_count;
  END IF;
END $$;

-- -------------------------------------------------------------------------------------
-- 1. EVOLUÇÃO DE TABELAS EXISTENTES: memory_experiences
-- -------------------------------------------------------------------------------------
ALTER TABLE memory_experiences
  ADD COLUMN IF NOT EXISTS event_id uuid,
  ADD COLUMN IF NOT EXISTS access_mode text NOT NULL DEFAULT 'legacy',
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'moderated',
  ADD COLUMN IF NOT EXISTS uploads_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS competition_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS comments_auto_approve boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS live_wall_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS live_wall_mode text NOT NULL DEFAULT 'spotlight',
  ADD COLUMN IF NOT EXISTS auto_advance_seconds integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS show_reactions boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_comments boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_explorers boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_missions boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS stage_filter_id uuid,
  ADD COLUMN IF NOT EXISTS moderation_delay_seconds integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_wall_items integer NOT NULL DEFAULT 100;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'memory_experiences_event_id_fkey' AND conrelid = 'memory_experiences'::regclass) THEN
    ALTER TABLE memory_experiences ADD CONSTRAINT memory_experiences_event_id_fkey FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'memory_experiences_access_mode_check' AND conrelid = 'memory_experiences'::regclass) THEN
    ALTER TABLE memory_experiences ADD CONSTRAINT memory_experiences_access_mode_check CHECK (access_mode IN ('legacy', 'session'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'memory_experiences_visibility_check' AND conrelid = 'memory_experiences'::regclass) THEN
    ALTER TABLE memory_experiences ADD CONSTRAINT memory_experiences_visibility_check CHECK (visibility IN ('community', 'moderated', 'private_to_couple'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'memory_experiences_live_wall_mode_check' AND conrelid = 'memory_experiences'::regclass) THEN
    ALTER TABLE memory_experiences ADD CONSTRAINT memory_experiences_live_wall_mode_check CHECK (live_wall_mode IN ('spotlight', 'mosaic', 'moments'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'memory_experiences_id_event_id_key' AND conrelid = 'memory_experiences'::regclass) THEN
    ALTER TABLE memory_experiences ADD CONSTRAINT memory_experiences_id_event_id_key UNIQUE (id, event_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS memory_experiences_event_id_idx ON memory_experiences (event_id);

-- Backfill unívoco e autoritário de event_id para jessicasamuelwedding
UPDATE memory_experiences me
SET event_id = e.id
FROM events e
WHERE me.event_slug = 'jessicasamuelwedding'
  AND e.edition_registry_key = 'jessica-samuel-wedding'
  AND me.event_id IS NULL;

-- Inserção canónica da experiência de Casamento Tradicional (Lobolo) se inexistente (para as 85 fotos legacy)
INSERT INTO memory_experiences (
  id, event_id, event_slug, invitation_slug, storage_slug, display_name,
  event_type, package, memories_variant, status, source_type, features,
  access_mode, visibility, uploads_enabled, competition_enabled,
  comments_auto_approve, live_wall_enabled, live_wall_mode, auto_advance_seconds,
  show_reactions, show_comments, show_explorers, show_missions, moderation_delay_seconds, max_wall_items
)
SELECT
  '3c6a02a5-12c4-4cb6-acbb-5c86aeaee615'::uuid,
  e.id,
  'jessicaesamueltraditionalwedding',
  'jessicaesamueltraditionalwedding',
  'jessicaesamueltraditionalwedding',
  'Jessica & Samuel — Casamento Tradicional (Lobolo)',
  'traditional_wedding',
  'signature',
  'signature_plus',
  'active',
  'atelier',
  '{"live_wall": true, "challenges": true, "audio": true}'::jsonb,
  'legacy',
  'community',
  true,
  true,
  true,
  false,
  'spotlight',
  10,
  true,
  true,
  true,
  true,
  0,
  100
FROM events e
WHERE (e.edition_registry_key = 'traditional-wedding' OR e.id = 'de277c01-ce34-4765-8655-27307c674d5d')
  AND NOT EXISTS (
    SELECT 1 FROM memory_experiences WHERE event_slug = 'jessicaesamueltraditionalwedding'
  );

-- Assert de que ambas as experiências têm event_id preenchido
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM memory_experiences WHERE event_id IS NULL) THEN
    RAISE EXCEPTION 'SAFETY_GATE_TRIGGERED: memory_experiences possui registos com event_id NULL após backfill.';
  END IF;
END $$;

-- -------------------------------------------------------------------------------------
-- 2. CRIAÇÃO DE memory_stages
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS memory_stages (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  experience_id uuid NOT NULL,
  event_id uuid NOT NULL,
  slug text NOT NULL,
  label text NOT NULL,
  order_index integer DEFAULT 0 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  config jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT memory_stages_time_window_check CHECK (((starts_at IS NULL) OR (ends_at IS NULL) OR (starts_at < ends_at))),
  CONSTRAINT memory_stages_event_id_fkey FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT memory_stages_experience_event_fkey FOREIGN KEY (experience_id, event_id) REFERENCES memory_experiences(id, event_id) ON DELETE CASCADE,
  CONSTRAINT memory_stages_experience_id_fkey FOREIGN KEY (experience_id) REFERENCES memory_experiences(id) ON DELETE CASCADE,
  CONSTRAINT memory_stages_pkey PRIMARY KEY (id),
  CONSTRAINT memory_stages_composite_identity_key UNIQUE (id, event_id, experience_id),
  CONSTRAINT memory_stages_experience_slug_key UNIQUE (experience_id, slug),
  CONSTRAINT memory_stages_id_event_id_key UNIQUE (id, event_id)
);

CREATE INDEX IF NOT EXISTS memory_stages_event_active_idx ON memory_stages USING btree (event_id, is_active);
CREATE INDEX IF NOT EXISTS memory_stages_exp_order_idx ON memory_stages USING btree (experience_id, order_index);


DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'memory_experiences_stage_filter_fkey' AND conrelid = 'memory_experiences'::regclass) THEN
    ALTER TABLE memory_experiences
      ADD CONSTRAINT memory_experiences_stage_filter_fkey
      FOREIGN KEY (stage_filter_id, event_id, id) REFERENCES memory_stages(id, event_id, experience_id) ON DELETE SET NULL;
  END IF;
END $$;

-- -------------------------------------------------------------------------------------
-- 3. CRIAÇÃO DE memory_participants & memory_sessions
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS memory_participants (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  event_id uuid NOT NULL,
  experience_id uuid,
  guest_id uuid,
  assigned_table_id text,
  display_name text,
  revoked_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT memory_participants_event_id_fkey FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT memory_participants_experience_event_fkey FOREIGN KEY (experience_id, event_id) REFERENCES memory_experiences(id, event_id) ON DELETE CASCADE,
  CONSTRAINT memory_participants_experience_id_fkey FOREIGN KEY (experience_id) REFERENCES memory_experiences(id) ON DELETE CASCADE,
  CONSTRAINT memory_participants_guest_id_fkey FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE SET NULL,
  CONSTRAINT memory_participants_pkey PRIMARY KEY (id),
  CONSTRAINT memory_participants_id_event_experience_key UNIQUE (id, event_id, experience_id),
  CONSTRAINT memory_participants_id_event_id_key UNIQUE (id, event_id)
);

CREATE INDEX IF NOT EXISTS memory_participants_event_guest_idx ON memory_participants USING btree (event_id, guest_id);
CREATE INDEX IF NOT EXISTS memory_participants_experience_idx ON memory_participants USING btree (experience_id);

CREATE TABLE IF NOT EXISTS memory_sessions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  token_hash text NOT NULL,
  participant_id uuid NOT NULL,
  event_id uuid NOT NULL,
  experience_id uuid,
  access_link_id uuid,
  expires_at timestamp with time zone NOT NULL,
  revoked_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  last_seen_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT memory_sessions_access_link_id_fkey FOREIGN KEY (access_link_id) REFERENCES memory_share_links(id) ON DELETE SET NULL,
  CONSTRAINT memory_sessions_event_id_fkey FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT memory_sessions_experience_id_fkey FOREIGN KEY (experience_id) REFERENCES memory_experiences(id) ON DELETE CASCADE,
  CONSTRAINT memory_sessions_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES memory_participants(id) ON DELETE CASCADE,
  CONSTRAINT memory_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT memory_sessions_token_hash_key UNIQUE (token_hash)
);

CREATE INDEX IF NOT EXISTS memory_sessions_active_idx ON memory_sessions USING btree (expires_at) WHERE (revoked_at IS NULL);
CREATE INDEX IF NOT EXISTS memory_sessions_event_participant_idx ON memory_sessions USING btree (event_id, participant_id);


-- -------------------------------------------------------------------------------------
-- 4. EVOLUÇÃO DE TABELAS EXISTENTES: wedding_photos (20 NOVAS COLUNAS DO PREVIEW)
-- -------------------------------------------------------------------------------------
ALTER TABLE wedding_photos
  ADD COLUMN IF NOT EXISTS event_id uuid,
  ADD COLUMN IF NOT EXISTS captured_at timestamptz,
  ADD COLUMN IF NOT EXISTS stage_id uuid,
  ADD COLUMN IF NOT EXISTS width integer,
  ADD COLUMN IF NOT EXISTS height integer,
  ADD COLUMN IF NOT EXISTS orientation text,
  ADD COLUMN IF NOT EXISTS duration_seconds numeric,
  ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS thumbnail_storage_path text,
  ADD COLUMN IF NOT EXISTS poster_storage_path text,
  ADD COLUMN IF NOT EXISTS medium_storage_path text,
  ADD COLUMN IF NOT EXISTS derivatives_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS has_derivatives boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS derivatives_error text,
  ADD COLUMN IF NOT EXISTS derivatives_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS derivatives_processed_at timestamptz,
  ADD COLUMN IF NOT EXISTS derivatives_locked_at timestamptz,
  ADD COLUMN IF NOT EXISTS derivatives_locked_by text,
  ADD COLUMN IF NOT EXISTS derivatives_lease_token uuid,
  ADD COLUMN IF NOT EXISTS client_upload_id uuid;

-- Backfill autoritário de experience_id para os 85 registos de Lobolo
UPDATE wedding_photos wp
SET experience_id = me.id
FROM memory_experiences me
WHERE wp.invitation_slug = 'jessicaesamueltraditionalwedding'
  AND me.event_slug = 'jessicaesamueltraditionalwedding'
  AND wp.experience_id IS NULL;

-- Backfill autoritário de experience_id para os 62 registos de Casamento Religioso
UPDATE wedding_photos wp
SET experience_id = me.id
FROM memory_experiences me
WHERE wp.invitation_slug = 'jessicasamuelwedding'
  AND me.event_slug = 'jessicasamuelwedding'
  AND wp.experience_id IS NULL;

-- Backfill autoritário de event_id a partir de memory_experiences
UPDATE wedding_photos wp
SET event_id = me.event_id
FROM memory_experiences me
WHERE wp.experience_id = me.id
  AND wp.event_id IS NULL;

-- Assert de integridade para experience_id e event_id em wedding_photos
DO $$
DECLARE
  v_null_exp_count integer;
  v_null_event_count integer;
BEGIN
  SELECT count(*)::integer INTO v_null_exp_count FROM wedding_photos WHERE experience_id IS NULL;
  IF v_null_exp_count > 0 THEN
    RAISE EXCEPTION 'SAFETY_GATE_TRIGGERED: % registos em wedding_photos com experience_id NULL após backfill.', v_null_exp_count;
  END IF;

  SELECT count(*)::integer INTO v_null_event_count FROM wedding_photos WHERE event_id IS NULL;
  IF v_null_event_count > 0 THEN
    RAISE EXCEPTION 'SAFETY_GATE_TRIGGERED: % registos em wedding_photos com event_id NULL após backfill.', v_null_event_count;
  END IF;
END $$;

-- Classificação autoritária de media_type baseada no content_type real (122 imagens / 25 vídeos)
UPDATE wedding_photos
SET media_type = CASE 
  WHEN content_type ILIKE 'video/%' OR storage_path ILIKE '%.mp4' OR storage_path ILIKE '%.mov' THEN 'video'
  ELSE 'image'
END;

-- Assert de contagem autoritária de media_type (deve classificar exactamente 25 vídeos e 122 imagens)
DO $$
DECLARE
  v_video_count integer;
  v_image_count integer;
BEGIN
  SELECT count(*)::integer INTO v_video_count FROM wedding_photos WHERE media_type = 'video';
  SELECT count(*)::integer INTO v_image_count FROM wedding_photos WHERE media_type = 'image';
  IF v_video_count <> 25 OR v_image_count <> 122 THEN
    RAISE EXCEPTION 'SAFETY_GATE_TRIGGERED: Classificação de media_type incoerente (vídeos: %, imagens: %). Esperado: 25 vídeos e 122 imagens.', v_video_count, v_image_count;
  END IF;
END $$;

-- Constraints e Unique keys de wedding_photos
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wedding_photos_event_id_fkey' AND conrelid = 'wedding_photos'::regclass) THEN
    ALTER TABLE wedding_photos ADD CONSTRAINT wedding_photos_event_id_fkey FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wedding_photos_id_event_id_key' AND conrelid = 'wedding_photos'::regclass) THEN
    ALTER TABLE wedding_photos ADD CONSTRAINT wedding_photos_id_event_id_key UNIQUE (id, event_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wedding_photos_id_event_experience_key' AND conrelid = 'wedding_photos'::regclass) THEN
    ALTER TABLE wedding_photos ADD CONSTRAINT wedding_photos_id_event_experience_key UNIQUE (id, event_id, experience_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wedding_photos_storage_path_key' AND conrelid = 'wedding_photos'::regclass) THEN
    ALTER TABLE wedding_photos ADD CONSTRAINT wedding_photos_storage_path_key UNIQUE (storage_path);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wedding_photos_stage_event_experience_fkey' AND conrelid = 'wedding_photos'::regclass) THEN
    ALTER TABLE wedding_photos ADD CONSTRAINT wedding_photos_stage_event_experience_fkey
      FOREIGN KEY (stage_id, event_id, experience_id) REFERENCES memory_stages(id, event_id, experience_id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wedding_photos_caption_check' AND conrelid = 'wedding_photos'::regclass) THEN
    ALTER TABLE wedding_photos ADD CONSTRAINT wedding_photos_caption_check CHECK (caption IS NULL OR char_length(caption) <= 200);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wedding_photos_challenge_id_len' AND conrelid = 'wedding_photos'::regclass) THEN
    ALTER TABLE wedding_photos ADD CONSTRAINT wedding_photos_challenge_id_len CHECK (challenge_id IS NULL OR char_length(challenge_id) <= 64);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wedding_photos_client_upload_id_session_invariant' AND conrelid = 'wedding_photos'::regclass) THEN
    ALTER TABLE wedding_photos ADD CONSTRAINT wedding_photos_client_upload_id_session_invariant CHECK (client_upload_id IS NULL OR (event_id IS NOT NULL AND experience_id IS NOT NULL AND participant_id IS NOT NULL));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wedding_photos_content_type_check' AND conrelid = 'wedding_photos'::regclass) THEN
    ALTER TABLE wedding_photos ADD CONSTRAINT wedding_photos_content_type_check CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'video/mp4', 'video/quicktime', 'video/webm'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wedding_photos_derivatives_status_check' AND conrelid = 'wedding_photos'::regclass) THEN
    ALTER TABLE wedding_photos ADD CONSTRAINT wedding_photos_derivatives_status_check CHECK (derivatives_status IN ('pending', 'processing', 'ready', 'failed'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wedding_photos_derivatives_status_invariants' AND conrelid = 'wedding_photos'::regclass) THEN
    ALTER TABLE wedding_photos ADD CONSTRAINT wedding_photos_derivatives_status_invariants CHECK ((derivatives_status = 'ready' AND has_derivatives = true) OR (derivatives_status != 'ready' AND has_derivatives = false));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wedding_photos_derivatives_image_paths_check' AND conrelid = 'wedding_photos'::regclass) THEN
    ALTER TABLE wedding_photos ADD CONSTRAINT wedding_photos_derivatives_image_paths_check CHECK (media_type != 'image' OR derivatives_status != 'ready' OR (thumbnail_storage_path IS NOT NULL AND medium_storage_path IS NOT NULL));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wedding_photos_derivatives_video_paths_check' AND conrelid = 'wedding_photos'::regclass) THEN
    ALTER TABLE wedding_photos ADD CONSTRAINT wedding_photos_derivatives_video_paths_check CHECK (media_type != 'video' OR derivatives_status != 'ready' OR poster_storage_path IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wedding_photos_duration_seconds_check' AND conrelid = 'wedding_photos'::regclass) THEN
    ALTER TABLE wedding_photos ADD CONSTRAINT wedding_photos_duration_seconds_check CHECK (duration_seconds IS NULL OR duration_seconds >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wedding_photos_file_size_bytes_check' AND conrelid = 'wedding_photos'::regclass) THEN
    ALTER TABLE wedding_photos ADD CONSTRAINT wedding_photos_file_size_bytes_check CHECK (file_size_bytes > 0 AND file_size_bytes <= 104857600);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wedding_photos_guest_name_check' AND conrelid = 'wedding_photos'::regclass) THEN
    ALTER TABLE wedding_photos ADD CONSTRAINT wedding_photos_guest_name_check CHECK (guest_name IS NULL OR char_length(guest_name) <= 80);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wedding_photos_height_check' AND conrelid = 'wedding_photos'::regclass) THEN
    ALTER TABLE wedding_photos ADD CONSTRAINT wedding_photos_height_check CHECK (height IS NULL OR height > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wedding_photos_media_type_check' AND conrelid = 'wedding_photos'::regclass) THEN
    ALTER TABLE wedding_photos ADD CONSTRAINT wedding_photos_media_type_check CHECK (media_type IN ('image', 'video'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wedding_photos_moderation_status_check' AND conrelid = 'wedding_photos'::regclass) THEN
    ALTER TABLE wedding_photos ADD CONSTRAINT wedding_photos_moderation_status_check CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'deleted'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wedding_photos_slug_path_prefix' AND conrelid = 'wedding_photos'::regclass) THEN
    ALTER TABLE wedding_photos ADD CONSTRAINT wedding_photos_slug_path_prefix CHECK (storage_path LIKE (invitation_slug || '/%'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wedding_photos_stage_experience_check' AND conrelid = 'wedding_photos'::regclass) THEN
    ALTER TABLE wedding_photos ADD CONSTRAINT wedding_photos_stage_experience_check CHECK (stage_id IS NULL OR experience_id IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wedding_photos_table_id_len' AND conrelid = 'wedding_photos'::regclass) THEN
    ALTER TABLE wedding_photos ADD CONSTRAINT wedding_photos_table_id_len CHECK (table_id IS NULL OR char_length(table_id) <= 10);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wedding_photos_width_check' AND conrelid = 'wedding_photos'::regclass) THEN
    ALTER TABLE wedding_photos ADD CONSTRAINT wedding_photos_width_check CHECK (width IS NULL OR width > 0);
  END IF;
END $$;

-- Índices de wedding_photos
CREATE INDEX IF NOT EXISTS wedding_photos_challenge_idx 
  ON wedding_photos (invitation_slug, challenge_id) WHERE (challenge_id IS NOT NULL);

CREATE UNIQUE INDEX IF NOT EXISTS wedding_photos_client_upload_id_idx 
  ON wedding_photos (event_id, experience_id, participant_id, client_upload_id) WHERE (client_upload_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS wedding_photos_derivatives_status_idx 
  ON wedding_photos (derivatives_status, created_at);

CREATE INDEX IF NOT EXISTS wedding_photos_event_captured_idx 
  ON wedding_photos (event_id, COALESCE(captured_at, created_at) DESC);

CREATE INDEX IF NOT EXISTS wedding_photos_event_id_idx 
  ON wedding_photos (event_id);

CREATE INDEX IF NOT EXISTS wedding_photos_event_media_type_idx 
  ON wedding_photos (event_id, media_type);

CREATE INDEX IF NOT EXISTS wedding_photos_has_derivatives_event_idx 
  ON wedding_photos (has_derivatives, event_id);

CREATE INDEX IF NOT EXISTS wedding_photos_invitation_slug_created_idx 
  ON wedding_photos (invitation_slug, created_at DESC);

CREATE INDEX IF NOT EXISTS wedding_photos_moderation_idx 
  ON wedding_photos (invitation_slug, moderation_status, created_at DESC);

CREATE INDEX IF NOT EXISTS wedding_photos_participant_idx 
  ON wedding_photos (invitation_slug, participant_id) WHERE (participant_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS wedding_photos_public_gallery_idx 
  ON wedding_photos (invitation_slug, created_at DESC) WHERE (moderation_status = 'approved');

CREATE INDEX IF NOT EXISTS wedding_photos_stage_idx 
  ON wedding_photos (stage_id);

CREATE INDEX IF NOT EXISTS wedding_photos_table_idx 
  ON wedding_photos (invitation_slug, table_id) WHERE (table_id IS NOT NULL);

-- -------------------------------------------------------------------------------------
-- 5. CRIAÇÃO DE MISSIONS, ASSIGNMENTS, SUBMISSIONS, SCORES
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS memory_missions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  event_id uuid NOT NULL,
  experience_id uuid NOT NULL,
  slug text NOT NULL,
  title text NOT NULL,
  description text DEFAULT ''::text NOT NULL,
  category text DEFAULT 'general'::text NOT NULL,
  difficulty text DEFAULT 'medium'::text NOT NULL,
  points integer DEFAULT 100 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  stage_id uuid,
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  required_media_type text DEFAULT 'any'::text NOT NULL,
  max_submissions_per_participant integer DEFAULT 1 NOT NULL,
  config jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  submission_review_policy character varying DEFAULT 'auto_accept'::character varying NOT NULL,
  CONSTRAINT memory_missions_max_submissions_per_participant_check CHECK ((max_submissions_per_participant >= 1)),
  CONSTRAINT memory_missions_points_check CHECK (((points > 0) AND (points <= 10000))),
  CONSTRAINT memory_missions_required_media_type_check CHECK ((required_media_type = ANY (ARRAY['any'::text, 'image'::text, 'video'::text]))),
  CONSTRAINT memory_missions_submission_review_policy_check CHECK (((submission_review_policy)::text = ANY ((ARRAY['auto_accept'::character varying, 'manual_review'::character varying])::text[]))),
  CONSTRAINT memory_missions_time_window_check CHECK (((starts_at IS NULL) OR (ends_at IS NULL) OR (starts_at < ends_at))),
  CONSTRAINT memory_missions_event_id_fkey FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT memory_missions_experience_event_fkey FOREIGN KEY (experience_id, event_id) REFERENCES memory_experiences(id, event_id) ON DELETE CASCADE,
  CONSTRAINT memory_missions_experience_id_fkey FOREIGN KEY (experience_id) REFERENCES memory_experiences(id) ON DELETE CASCADE,
  CONSTRAINT memory_missions_stage_event_experience_fkey FOREIGN KEY (stage_id, event_id, experience_id) REFERENCES memory_stages(id, event_id, experience_id) ON DELETE SET NULL,
  CONSTRAINT memory_missions_pkey PRIMARY KEY (id),
  CONSTRAINT memory_missions_composite_identity_key UNIQUE (id, event_id, experience_id),
  CONSTRAINT memory_missions_experience_slug_key UNIQUE (experience_id, slug)
);


CREATE TABLE IF NOT EXISTS memory_mission_assignments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  event_id uuid NOT NULL,
  experience_id uuid NOT NULL,
  mission_id uuid NOT NULL,
  target_type text DEFAULT 'general'::text NOT NULL,
  target_id text,
  participant_id uuid,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT chk_mission_assignment_target CHECK ((((target_type = 'general'::text) AND (target_id IS NULL)) OR ((target_type = ANY (ARRAY['participant'::text, 'guest'::text, 'table'::text])) AND ((target_id IS NOT NULL) OR (participant_id IS NOT NULL))))),
  CONSTRAINT memory_mission_assignments_target_type_check CHECK ((target_type = ANY (ARRAY['general'::text, 'participant'::text, 'guest'::text, 'table'::text]))),
  CONSTRAINT memory_mission_assignments_event_id_fkey FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT memory_mission_assignments_experience_event_fkey FOREIGN KEY (experience_id, event_id) REFERENCES memory_experiences(id, event_id) ON DELETE CASCADE,
  CONSTRAINT memory_mission_assignments_experience_id_fkey FOREIGN KEY (experience_id) REFERENCES memory_experiences(id) ON DELETE CASCADE,
  CONSTRAINT memory_mission_assignments_mission_fkey FOREIGN KEY (mission_id, event_id, experience_id) REFERENCES memory_missions(id, event_id, experience_id) ON DELETE CASCADE,
  CONSTRAINT memory_mission_assignments_participant_fkey FOREIGN KEY (participant_id, event_id, experience_id) REFERENCES memory_participants(id, event_id, experience_id) ON DELETE CASCADE,
  CONSTRAINT memory_mission_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT memory_mission_assignments_composite_identity_key UNIQUE (id, event_id, experience_id),
  CONSTRAINT memory_mission_assignments_mission_target_key UNIQUE (mission_id, target_type, target_id),
  CONSTRAINT uq_memory_mission_assignments_composite UNIQUE (event_id, experience_id, mission_id, id)
);


CREATE TABLE IF NOT EXISTS memory_mission_submissions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  event_id uuid NOT NULL,
  experience_id uuid NOT NULL,
  mission_id uuid NOT NULL,
  assignment_id uuid,
  participant_id uuid NOT NULL,
  media_id uuid NOT NULL,
  points_awarded integer DEFAULT 0 NOT NULL,
  status text DEFAULT 'accepted'::text NOT NULL,
  moderation_notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  moderated_by uuid,
  moderated_at timestamp with time zone,
  rejection_reason text,
  CONSTRAINT memory_mission_submissions_points_awarded_check CHECK ((points_awarded >= 0)),
  CONSTRAINT memory_mission_submissions_status_check CHECK ((status = ANY (ARRAY['accepted'::text, 'pending'::text, 'rejected'::text]))),
  CONSTRAINT fk_mission_subs_assignment FOREIGN KEY (event_id, experience_id, mission_id, assignment_id) REFERENCES memory_mission_assignments(event_id, experience_id, mission_id, id) ON DELETE SET NULL,
  CONSTRAINT memory_mission_submissions_assignment_fkey FOREIGN KEY (assignment_id, event_id, experience_id) REFERENCES memory_mission_assignments(id, event_id, experience_id) ON DELETE SET NULL,
  CONSTRAINT memory_mission_submissions_event_id_fkey FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT memory_mission_submissions_experience_event_fkey FOREIGN KEY (experience_id, event_id) REFERENCES memory_experiences(id, event_id) ON DELETE CASCADE,
  CONSTRAINT memory_mission_submissions_experience_id_fkey FOREIGN KEY (experience_id) REFERENCES memory_experiences(id) ON DELETE CASCADE,
  CONSTRAINT memory_mission_submissions_media_fkey FOREIGN KEY (media_id, event_id, experience_id) REFERENCES wedding_photos(id, event_id, experience_id) ON DELETE CASCADE,
  CONSTRAINT memory_mission_submissions_mission_fkey FOREIGN KEY (mission_id, event_id, experience_id) REFERENCES memory_missions(id, event_id, experience_id) ON DELETE CASCADE,
  CONSTRAINT memory_mission_submissions_participant_fkey FOREIGN KEY (participant_id, event_id, experience_id) REFERENCES memory_participants(id, event_id, experience_id) ON DELETE CASCADE,
  CONSTRAINT memory_mission_submissions_pkey PRIMARY KEY (id),
  CONSTRAINT memory_mission_submissions_composite_identity_key UNIQUE (id, event_id, experience_id),
  CONSTRAINT memory_mission_submissions_mission_media_key UNIQUE (mission_id, media_id)
);


CREATE TABLE IF NOT EXISTS memory_participant_scores (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  event_id uuid NOT NULL,
  experience_id uuid NOT NULL,
  participant_id uuid NOT NULL,
  total_points integer DEFAULT 0 NOT NULL,
  missions_completed integer DEFAULT 0 NOT NULL,
  last_awarded_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT memory_participant_scores_missions_completed_check CHECK ((missions_completed >= 0)),
  CONSTRAINT memory_participant_scores_total_points_check CHECK ((total_points >= 0)),
  CONSTRAINT memory_participant_scores_event_id_fkey FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT memory_participant_scores_experience_event_fkey FOREIGN KEY (experience_id, event_id) REFERENCES memory_experiences(id, event_id) ON DELETE CASCADE,
  CONSTRAINT memory_participant_scores_experience_id_fkey FOREIGN KEY (experience_id) REFERENCES memory_experiences(id) ON DELETE CASCADE,
  CONSTRAINT memory_participant_scores_participant_fkey FOREIGN KEY (participant_id, event_id, experience_id) REFERENCES memory_participants(id, event_id, experience_id) ON DELETE CASCADE,
  CONSTRAINT memory_participant_scores_pkey PRIMARY KEY (id),
  CONSTRAINT memory_participant_scores_participant_key UNIQUE (participant_id),
  CONSTRAINT uq_memory_participant_scores_composite UNIQUE (event_id, experience_id, participant_id)
);

CREATE INDEX IF NOT EXISTS memory_participant_scores_leaderboard_idx ON memory_participant_scores USING btree (experience_id, total_points DESC, last_awarded_at);


-- -------------------------------------------------------------------------------------
-- 6. CRIAÇÃO DE SOCIAL: REACTIONS, COMMENTS, FAVORITES, VIEWS
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS memory_media_reactions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  event_id uuid NOT NULL,
  experience_id uuid NOT NULL,
  media_id uuid NOT NULL,
  participant_id uuid NOT NULL,
  reaction_type text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT memory_media_reactions_reaction_type_check CHECK ((reaction_type = ANY (ARRAY['love'::text, 'applause'::text, 'champagne'::text, 'elegance'::text, 'toast'::text]))),
  CONSTRAINT memory_media_reactions_event_id_fkey FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT memory_media_reactions_experience_event_fkey FOREIGN KEY (experience_id, event_id) REFERENCES memory_experiences(id, event_id) ON DELETE CASCADE,
  CONSTRAINT memory_media_reactions_media_event_experience_fkey FOREIGN KEY (media_id, event_id, experience_id) REFERENCES wedding_photos(id, event_id, experience_id) ON DELETE CASCADE,
  CONSTRAINT memory_media_reactions_participant_event_experience_fkey FOREIGN KEY (participant_id, event_id, experience_id) REFERENCES memory_participants(id, event_id, experience_id) ON DELETE CASCADE,
  CONSTRAINT memory_media_reactions_pkey PRIMARY KEY (id),
  CONSTRAINT memory_media_reactions_composite_identity_key UNIQUE (id, event_id, experience_id),
  CONSTRAINT memory_media_reactions_participant_media_key UNIQUE (participant_id, media_id)
);

CREATE INDEX IF NOT EXISTS memory_media_reactions_media_type_idx ON memory_media_reactions USING btree (media_id, reaction_type);
CREATE INDEX IF NOT EXISTS memory_media_reactions_participant_idx ON memory_media_reactions USING btree (participant_id, media_id);

CREATE TABLE IF NOT EXISTS memory_media_comments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  event_id uuid NOT NULL,
  experience_id uuid NOT NULL,
  media_id uuid NOT NULL,
  participant_id uuid NOT NULL,
  body text NOT NULL,
  status text DEFAULT 'approved'::text NOT NULL,
  moderated_at timestamp with time zone,
  moderated_by uuid,
  rejection_reason text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT memory_media_comments_body_check CHECK (((length(TRIM(BOTH FROM body)) >= 1) AND (length(body) <= 500))),
  CONSTRAINT memory_media_comments_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'hidden'::text, 'deleted'::text]))),
  CONSTRAINT memory_media_comments_event_id_fkey FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT memory_media_comments_experience_event_fkey FOREIGN KEY (experience_id, event_id) REFERENCES memory_experiences(id, event_id) ON DELETE CASCADE,
  CONSTRAINT memory_media_comments_media_event_experience_fkey FOREIGN KEY (media_id, event_id, experience_id) REFERENCES wedding_photos(id, event_id, experience_id) ON DELETE CASCADE,
  CONSTRAINT memory_media_comments_participant_event_experience_fkey FOREIGN KEY (participant_id, event_id, experience_id) REFERENCES memory_participants(id, event_id, experience_id) ON DELETE CASCADE,
  CONSTRAINT memory_media_comments_pkey PRIMARY KEY (id),
  CONSTRAINT memory_media_comments_composite_identity_key UNIQUE (id, event_id, experience_id)
);

CREATE INDEX IF NOT EXISTS memory_media_comments_media_approved_idx ON memory_media_comments USING btree (media_id, created_at) WHERE (status = 'approved'::text);
CREATE INDEX IF NOT EXISTS memory_media_comments_participant_idx ON memory_media_comments USING btree (participant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS memory_media_favorites (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  event_id uuid NOT NULL,
  experience_id uuid NOT NULL,
  media_id uuid NOT NULL,
  participant_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT memory_media_favorites_event_id_fkey FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT memory_media_favorites_experience_event_fkey FOREIGN KEY (experience_id, event_id) REFERENCES memory_experiences(id, event_id) ON DELETE CASCADE,
  CONSTRAINT memory_media_favorites_media_event_experience_fkey FOREIGN KEY (media_id, event_id, experience_id) REFERENCES wedding_photos(id, event_id, experience_id) ON DELETE CASCADE,
  CONSTRAINT memory_media_favorites_participant_event_experience_fkey FOREIGN KEY (participant_id, event_id, experience_id) REFERENCES memory_participants(id, event_id, experience_id) ON DELETE CASCADE,
  CONSTRAINT memory_media_favorites_pkey PRIMARY KEY (id),
  CONSTRAINT memory_media_favorites_composite_identity_key UNIQUE (id, event_id, experience_id),
  CONSTRAINT memory_media_favorites_participant_media_key UNIQUE (participant_id, media_id)
);

CREATE INDEX IF NOT EXISTS memory_media_favorites_participant_created_idx ON memory_media_favorites USING btree (participant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS memory_media_views (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  event_id uuid NOT NULL,
  experience_id uuid NOT NULL,
  media_id uuid NOT NULL,
  participant_id uuid NOT NULL,
  session_id uuid,
  seen_at timestamp with time zone DEFAULT now() NOT NULL,
  last_progress numeric DEFAULT 1.0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT memory_media_views_last_progress_check CHECK (((last_progress >= 0.0) AND (last_progress <= 1.0))),
  CONSTRAINT memory_media_views_event_id_fkey FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT memory_media_views_experience_id_fkey FOREIGN KEY (experience_id) REFERENCES memory_experiences(id) ON DELETE CASCADE,
  CONSTRAINT memory_media_views_media_event_experience_fkey FOREIGN KEY (media_id, event_id, experience_id) REFERENCES wedding_photos(id, event_id, experience_id) ON DELETE CASCADE,
  CONSTRAINT memory_media_views_participant_event_experience_fkey FOREIGN KEY (participant_id, event_id, experience_id) REFERENCES memory_participants(id, event_id, experience_id) ON DELETE CASCADE,
  CONSTRAINT memory_media_views_session_id_fkey FOREIGN KEY (session_id) REFERENCES memory_sessions(id) ON DELETE SET NULL,
  CONSTRAINT memory_media_views_pkey PRIMARY KEY (id),
  CONSTRAINT memory_media_views_participant_media_key UNIQUE (participant_id, media_id)
);

CREATE INDEX IF NOT EXISTS memory_media_views_media_idx ON memory_media_views USING btree (media_id);
CREATE INDEX IF NOT EXISTS memory_media_views_part_event_idx ON memory_media_views USING btree (participant_id, event_id);


-- -------------------------------------------------------------------------------------
-- 7. CRIAÇÃO DE LIVE WALL: DISPLAY SESSIONS, STREAM STATE, LIVE EVENTS
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS memory_display_sessions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  event_id uuid NOT NULL,
  experience_id uuid NOT NULL,
  token_hash text NOT NULL,
  device_label text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  revoked_at timestamp with time zone,
  last_seen_at timestamp with time zone,
  CONSTRAINT memory_display_sessions_event_id_fkey FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT memory_display_sessions_experience_fkey FOREIGN KEY (experience_id, event_id) REFERENCES memory_experiences(id, event_id) ON DELETE CASCADE,
  CONSTRAINT memory_display_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT memory_display_sessions_token_hash_key UNIQUE (token_hash)
);

CREATE INDEX IF NOT EXISTS memory_display_sessions_event_idx ON memory_display_sessions USING btree (event_id, experience_id);
CREATE INDEX IF NOT EXISTS memory_display_sessions_lookup_idx ON memory_display_sessions USING btree (token_hash, expires_at) WHERE (revoked_at IS NULL);

CREATE TABLE IF NOT EXISTS memory_live_stream_state (
  event_id uuid NOT NULL,
  experience_id uuid NOT NULL,
  last_sequence_no bigint DEFAULT 0 NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT memory_live_stream_state_fkey FOREIGN KEY (experience_id, event_id) REFERENCES memory_experiences(id, event_id) ON DELETE CASCADE,
  CONSTRAINT memory_live_stream_state_pkey PRIMARY KEY (event_id, experience_id)
);


CREATE SEQUENCE IF NOT EXISTS memory_live_events_id_seq;
CREATE TABLE IF NOT EXISTS memory_live_events (
  id bigint DEFAULT nextval('memory_live_events_id_seq'::regclass) NOT NULL,
  event_id uuid NOT NULL,
  experience_id uuid NOT NULL,
  sequence_no bigint NOT NULL,
  event_type text NOT NULL,
  subject_media_id uuid,
  payload jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  subject_stage_id uuid,
  CONSTRAINT memory_live_events_event_type_check CHECK ((event_type = ANY (ARRAY['media_approved'::text, 'media_hidden'::text, 'media_deleted'::text, 'derivatives_ready'::text, 'social_changed'::text, 'comment_approved'::text, 'stage_changed'::text]))),
  CONSTRAINT memory_live_events_subject_check CHECK ((((event_type = ANY (ARRAY['media_approved'::text, 'media_hidden'::text, 'media_deleted'::text, 'derivatives_ready'::text, 'social_changed'::text, 'comment_approved'::text])) AND (subject_media_id IS NOT NULL) AND (subject_stage_id IS NULL)) OR ((event_type = 'stage_changed'::text) AND (subject_media_id IS NULL) AND (subject_stage_id IS NOT NULL)) OR ((event_type <> ALL (ARRAY['media_approved'::text, 'media_hidden'::text, 'media_deleted'::text, 'derivatives_ready'::text, 'social_changed'::text, 'comment_approved'::text, 'stage_changed'::text])) AND (subject_media_id IS NULL) AND (subject_stage_id IS NULL)))),
  CONSTRAINT memory_live_events_event_id_fkey FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT memory_live_events_pkey PRIMARY KEY (id),
  CONSTRAINT memory_live_events_stream_sequence_key UNIQUE (event_id, experience_id, sequence_no)
);

CREATE INDEX IF NOT EXISTS memory_live_events_created_idx ON memory_live_events USING btree (event_id, experience_id, created_at);
CREATE INDEX IF NOT EXISTS memory_live_events_stream_idx ON memory_live_events USING btree (event_id, experience_id, sequence_no);


-- -------------------------------------------------------------------------------------
-- 8. CRIAÇÃO DE RECAP: PUBLICATIONS, ITEMS
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS memory_recap_publications (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  event_id uuid NOT NULL,
  experience_id uuid NOT NULL,
  version integer DEFAULT 1 NOT NULL,
  lock_version integer DEFAULT 1 NOT NULL,
  status text DEFAULT 'draft'::text NOT NULL,
  title text,
  welcome_message text,
  closing_message text,
  access_level text DEFAULT 'guests_only'::text NOT NULL,
  configuration jsonb DEFAULT '{}'::jsonb NOT NULL,
  published_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT memory_recap_publications_access_level_check CHECK ((access_level = ANY (ARRAY['guests_only'::text, 'share_link_only'::text, 'public'::text]))),
  CONSTRAINT memory_recap_publications_closing_message_check CHECK (((closing_message IS NULL) OR (char_length(closing_message) <= 1000))),
  CONSTRAINT memory_recap_publications_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text]))),
  CONSTRAINT memory_recap_publications_title_check CHECK (((title IS NULL) OR (char_length(title) <= 120))),
  CONSTRAINT memory_recap_publications_welcome_message_check CHECK (((welcome_message IS NULL) OR (char_length(welcome_message) <= 1000))),
  CONSTRAINT memory_recap_publications_experience_event_fkey FOREIGN KEY (experience_id, event_id) REFERENCES memory_experiences(id, event_id) ON DELETE CASCADE,
  CONSTRAINT memory_recap_publications_pkey PRIMARY KEY (id),
  CONSTRAINT memory_recap_publications_experience_version_key UNIQUE (experience_id, version),
  CONSTRAINT memory_recap_publications_identity_key UNIQUE (id, event_id, experience_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS memory_recap_draft_experience_idx ON memory_recap_publications USING btree (experience_id) WHERE (status = 'draft'::text);
CREATE UNIQUE INDEX IF NOT EXISTS memory_recap_published_experience_idx ON memory_recap_publications USING btree (experience_id) WHERE (status = 'published'::text);

CREATE TABLE IF NOT EXISTS memory_recap_items (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  publication_id uuid NOT NULL,
  event_id uuid NOT NULL,
  experience_id uuid NOT NULL,
  media_id uuid NOT NULL,
  section text NOT NULL,
  stage_id uuid,
  position integer DEFAULT 0 NOT NULL,
  editorial_caption text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT memory_recap_items_editorial_caption_check CHECK (((editorial_caption IS NULL) OR (char_length(editorial_caption) <= 300))),
  CONSTRAINT memory_recap_items_section_check CHECK ((section = ANY (ARRAY['hero'::text, 'story'::text, 'moments'::text, 'missions'::text, 'closing'::text]))),
  CONSTRAINT memory_recap_items_media_fkey FOREIGN KEY (media_id, event_id, experience_id) REFERENCES wedding_photos(id, event_id, experience_id) ON DELETE CASCADE,
  CONSTRAINT memory_recap_items_publication_fkey FOREIGN KEY (publication_id, event_id, experience_id) REFERENCES memory_recap_publications(id, event_id, experience_id) ON DELETE CASCADE,
  CONSTRAINT memory_recap_items_stage_fkey FOREIGN KEY (stage_id, event_id, experience_id) REFERENCES memory_stages(id, event_id, experience_id) ON DELETE SET NULL (stage_id),
  CONSTRAINT memory_recap_items_pkey PRIMARY KEY (id),
  CONSTRAINT memory_recap_items_publication_media_section_key UNIQUE (publication_id, media_id, section)
);

CREATE INDEX IF NOT EXISTS memory_recap_items_pub_sec_pos_idx ON memory_recap_items USING btree (publication_id, section, "position");
CREATE UNIQUE INDEX IF NOT EXISTS memory_recap_items_single_hero_idx ON memory_recap_items USING btree (publication_id) WHERE (section = 'hero'::text);


-- -------------------------------------------------------------------------------------
-- 9. SECURITY DEFINER FUNCTIONS & TRIGGER FUNCTIONS (CATÁLOGO CANÓNICO DO PREVIEW)
-- -------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.haxr_claim_media_derivative_job(p_media_id uuid, p_worker_id text, p_lease_timeout_seconds integer DEFAULT 300, p_force boolean DEFAULT false)
 RETURNS TABLE(claimed boolean, media_id uuid, invitation_slug text, storage_path text, content_type text, media_type text, poster_storage_path text, locked_at timestamp with time zone, attempts integer, lease_token uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_row wedding_photos%ROWTYPE;
  v_new_token uuid;
BEGIN
  SELECT * INTO v_row
  FROM wedding_photos
  WHERE id = p_media_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF v_row.derivatives_status = 'ready' AND NOT p_force THEN
    RETURN QUERY SELECT false, v_row.id, v_row.invitation_slug, v_row.storage_path, 
                        v_row.content_type, v_row.media_type, v_row.poster_storage_path, 
                        v_row.derivatives_locked_at, v_row.derivatives_attempts, v_row.derivatives_lease_token;
    RETURN;
  END IF;

  v_new_token := gen_random_uuid();

  -- Aquisição atómica do lease com token opaco
  UPDATE wedding_photos
  SET derivatives_status = 'processing',
      has_derivatives = false,
      derivatives_locked_by = p_worker_id,
      derivatives_locked_at = clock_timestamp(),
      derivatives_attempts = wedding_photos.derivatives_attempts + 1,
      derivatives_lease_token = v_new_token
  WHERE id = p_media_id
    AND (
      p_force = true
      OR derivatives_status IN ('pending', 'failed')
      OR (
        derivatives_status = 'processing'
        AND (
          derivatives_locked_at IS NULL 
          OR derivatives_locked_at < clock_timestamp() - (p_lease_timeout_seconds || ' seconds')::interval
        )
      )
    )
  RETURNING * INTO v_row;

  IF FOUND THEN
    RETURN QUERY SELECT true, v_row.id, v_row.invitation_slug, v_row.storage_path, 
                        v_row.content_type, v_row.media_type, v_row.poster_storage_path, 
                        v_row.derivatives_locked_at, v_row.derivatives_attempts, v_new_token;
  ELSE
    RETURN;
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION haxr_claim_media_derivative_job(uuid, text, integer, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION haxr_claim_media_derivative_job(uuid, text, integer, boolean) TO haxrweb_runtime;

CREATE OR REPLACE FUNCTION public.haxr_current_participant_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
      BEGIN
        RETURN NULLIF(current_setting('haxr.current_participant_id', true), '')::uuid;
      EXCEPTION WHEN OTHERS THEN
        RETURN NULL;
      END;
      $function$;

REVOKE ALL ON FUNCTION haxr_current_participant_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION haxr_current_participant_id() TO haxrweb_runtime, edition_runtime, haxr_edition_runtime;

CREATE OR REPLACE FUNCTION public.haxr_emit_live_event(p_event_id uuid, p_experience_id uuid, p_event_type text, p_subject_media_id uuid DEFAULT NULL::uuid, p_payload jsonb DEFAULT '{}'::jsonb, p_subject_stage_id uuid DEFAULT NULL::uuid)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
      DECLARE
        v_next_seq bigint;
      BEGIN
        -- Validação de subject de acordo com o tipo de evento (regras estritas de invariant)
        IF p_event_type IN ('media_approved', 'media_hidden', 'media_deleted', 'derivatives_ready', 'social_changed', 'comment_approved') THEN
          IF p_subject_media_id IS NULL OR p_subject_stage_id IS NOT NULL THEN
            RAISE EXCEPTION 'Eventos de mídia exigem subject_media_id NOT NULL e subject_stage_id NULL'
              USING ERRCODE = '23514';
          END IF;
        ELSIF p_event_type = 'stage_changed' THEN
          IF p_subject_stage_id IS NULL OR p_subject_media_id IS NOT NULL THEN
            RAISE EXCEPTION 'stage_changed exige subject_stage_id NOT NULL e subject_media_id NULL'
              USING ERRCODE = '23514';
          END IF;
        ELSE
          IF p_subject_media_id IS NOT NULL OR p_subject_stage_id IS NOT NULL THEN
            RAISE EXCEPTION 'Eventos genéricos exigem subject_media_id e subject_stage_id NULL'
              USING ERRCODE = '23514';
          END IF;
        END IF;

        -- Bloqueio row-level exclusivo por stream (event_id, experience_id) na tabela de estado
        INSERT INTO memory_live_stream_state (event_id, experience_id, last_sequence_no, updated_at)
        VALUES (p_event_id, p_experience_id, 1, now())
        ON CONFLICT (event_id, experience_id)
        DO UPDATE SET
          last_sequence_no = memory_live_stream_state.last_sequence_no + 1,
          updated_at = now()
        RETURNING last_sequence_no INTO v_next_seq;

        INSERT INTO memory_live_events (
          event_id, experience_id, sequence_no, event_type, subject_media_id, subject_stage_id, payload, created_at
        ) VALUES (
          p_event_id, p_experience_id, v_next_seq, p_event_type, p_subject_media_id, p_subject_stage_id, p_payload, now()
        );

        RETURN v_next_seq;
      END;
      $function$;

REVOKE ALL ON FUNCTION haxr_emit_live_event(uuid, uuid, text, uuid, jsonb, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION haxr_emit_live_event(uuid, uuid, text, uuid, jsonb, uuid) TO haxrweb_runtime;

CREATE OR REPLACE FUNCTION public.haxr_enforce_comment_insert_policy()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auto_approve boolean;
BEGIN
  IF session_user IN ('edition_runtime', 'haxr_edition_runtime') OR current_user IN ('edition_runtime', 'haxr_edition_runtime') THEN
    SELECT COALESCE(comments_auto_approve, true) INTO v_auto_approve
    FROM memory_experiences
    WHERE id = NEW.experience_id;

    IF v_auto_approve = false THEN
      NEW.status := 'pending';
    ELSE
      NEW.status := 'approved';
    END IF;

    NEW.moderated_at := NULL;
    NEW.moderated_by := NULL;
    NEW.rejection_reason := NULL;
  END IF;
  RETURN NEW;
END;
$function$;

GRANT EXECUTE ON FUNCTION haxr_enforce_comment_insert_policy() TO haxrweb_runtime;

CREATE OR REPLACE FUNCTION public.haxr_finalize_media_derivative_job(p_media_id uuid, p_lease_token uuid, p_status text, p_has_derivatives boolean, p_thumbnail_storage_path text DEFAULT NULL::text, p_medium_storage_path text DEFAULT NULL::text, p_poster_storage_path text DEFAULT NULL::text, p_width integer DEFAULT NULL::integer, p_height integer DEFAULT NULL::integer, p_orientation text DEFAULT NULL::text, p_duration_seconds numeric DEFAULT NULL::numeric, p_error text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_updated integer;
BEGIN
  IF p_lease_token IS NULL THEN
    RETURN false;
  END IF;

  UPDATE wedding_photos
  SET derivatives_status = p_status,
      has_derivatives = p_has_derivatives,
      thumbnail_storage_path = COALESCE(p_thumbnail_storage_path, thumbnail_storage_path),
      medium_storage_path = COALESCE(p_medium_storage_path, medium_storage_path),
      poster_storage_path = COALESCE(p_poster_storage_path, poster_storage_path),
      width = COALESCE(p_width, width),
      height = COALESCE(p_height, height),
      orientation = COALESCE(p_orientation, orientation),
      duration_seconds = COALESCE(p_duration_seconds, duration_seconds),
      derivatives_error = p_error,
      derivatives_processed_at = clock_timestamp(),
      derivatives_locked_at = NULL,
      derivatives_locked_by = NULL,
      derivatives_lease_token = NULL
  WHERE id = p_media_id
    AND derivatives_lease_token = p_lease_token;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$function$;

REVOKE ALL ON FUNCTION haxr_finalize_media_derivative_job(uuid, uuid, text, boolean, text, text, text, integer, integer, text, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION haxr_finalize_media_derivative_job(uuid, uuid, text, boolean, text, text, text, integer, integer, text, numeric, text) TO haxrweb_runtime;

CREATE OR REPLACE FUNCTION public.haxr_get_media_reaction_counts(p_media_ids uuid[])
 RETURNS TABLE(media_id uuid, reaction_type text, count integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT 
    r.media_id, 
    r.reaction_type, 
    count(*)::integer AS count
  FROM memory_participants mp
  JOIN memory_experiences me 
    ON me.id = mp.experience_id 
   AND me.event_id = mp.event_id
  JOIN wedding_photos wp 
    ON wp.id = ANY(p_media_ids)
   AND wp.event_id = mp.event_id 
   AND wp.experience_id = mp.experience_id
   AND wp.moderation_status = 'approved'
  JOIN memory_media_reactions r 
    ON r.media_id = wp.id 
   AND r.event_id = mp.event_id 
   AND r.experience_id = mp.experience_id
  WHERE mp.id = haxr_current_participant_id()
    AND mp.revoked_at IS NULL
    AND me.status = 'active'
    AND me.visibility IN ('community', 'moderated')
  GROUP BY r.media_id, r.reaction_type;
$function$;

REVOKE ALL ON FUNCTION haxr_get_media_reaction_counts(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION haxr_get_media_reaction_counts(uuid[]) TO haxrweb_runtime, edition_runtime, haxr_edition_runtime;

CREATE OR REPLACE FUNCTION public.haxr_moderate_media_comment(p_comment_id uuid, p_new_status text, p_moderated_by uuid DEFAULT NULL::uuid, p_rejection_reason text DEFAULT NULL::text)
 RETURNS TABLE(comment_id uuid, previous_status text, new_status text, is_transition boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_comment record;
  v_is_transition boolean := false;
BEGIN
  IF p_new_status NOT IN ('pending', 'approved', 'rejected', 'hidden', 'deleted') THEN
    RAISE EXCEPTION 'Estado de moderação de comentário inválido: %', p_new_status
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  SELECT * INTO v_comment
  FROM memory_media_comments
  WHERE id = p_comment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Comentário % não encontrado.', p_comment_id
      USING ERRCODE = 'no_data_found';
  END IF;

  IF v_comment.status <> p_new_status THEN
    v_is_transition := true;
  END IF;

  UPDATE memory_media_comments
  SET
    status = p_new_status,
    moderated_by = COALESCE(p_moderated_by, moderated_by),
    moderated_at = now(),
    rejection_reason = CASE WHEN p_new_status IN ('rejected', 'hidden') THEN COALESCE(p_rejection_reason, rejection_reason) ELSE NULL END,
    updated_at = now()
  WHERE id = p_comment_id;

  RETURN QUERY SELECT
    v_comment.id,
    v_comment.status::text,
    p_new_status::text,
    v_is_transition;
END;
$function$;

REVOKE ALL ON FUNCTION haxr_moderate_media_comment(uuid, text, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION haxr_moderate_media_comment(uuid, text, uuid, text) TO haxrweb_runtime;

CREATE OR REPLACE FUNCTION public.haxr_moderate_mission_submission(p_submission_id uuid, p_new_status text, p_moderated_by uuid DEFAULT NULL::uuid, p_rejection_reason text DEFAULT NULL::text)
 RETURNS TABLE(submission_id uuid, previous_status text, new_status text, points_delta integer, current_participant_points integer, current_missions_completed integer, is_transition boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_sub record;
  v_mission record;
  v_score record;
  v_points_to_award integer;
  v_points_delta integer := 0;
  v_completed_delta integer := 0;
  v_is_transition boolean := false;
BEGIN
  IF p_new_status NOT IN ('pending', 'accepted', 'rejected') THEN
    RAISE EXCEPTION 'Estado de moderação inválido: %', p_new_status
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  -- 1. Lock da submissão para evitar concorrência
  SELECT * INTO v_sub
  FROM memory_mission_submissions
  WHERE id = p_submission_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submissão de missão % não encontrada.', p_submission_id
      USING ERRCODE = 'no_data_found';
  END IF;

  -- 2. Lock no participante para serializar concorrência de moderação
  PERFORM pg_advisory_xact_lock(hashtext('moderate_submission:' || v_sub.participant_id::text));

  -- 3. Buscar pontos da missão
  SELECT points INTO v_mission
  FROM memory_missions
  WHERE id = v_sub.mission_id;

  v_points_to_award := COALESCE(v_mission.points, 0);

  -- 4. Avaliar transição de estado
  IF v_sub.status = p_new_status THEN
    -- Transição idempotente (mesmo estado)
    v_points_delta := 0;
    v_completed_delta := 0;
    v_is_transition := false;
  ELSIF v_sub.status = 'pending' AND p_new_status = 'accepted' THEN
    -- pending -> accepted (+pontos, +1 missão)
    v_points_delta := v_points_to_award;
    v_completed_delta := 1;
    v_is_transition := true;
  ELSIF v_sub.status = 'accepted' AND p_new_status = 'rejected' THEN
    -- accepted -> rejected (-pontos anteriormente atribuídos, -1 missão)
    v_points_delta := -v_sub.points_awarded;
    v_completed_delta := -1;
    v_is_transition := true;
  ELSIF v_sub.status = 'rejected' AND p_new_status = 'accepted' THEN
    -- rejected -> accepted (+pontos, +1 missão)
    v_points_delta := v_points_to_award;
    v_completed_delta := 1;
    v_is_transition := true;
  ELSIF v_sub.status = 'pending' AND p_new_status = 'rejected' THEN
    -- pending -> rejected (0 pontos, não altera contagem)
    v_points_delta := 0;
    v_completed_delta := 0;
    v_is_transition := true;
  ELSIF v_sub.status = 'rejected' AND p_new_status = 'pending' THEN
    -- rejected -> pending (0 pontos)
    v_points_delta := 0;
    v_completed_delta := 0;
    v_is_transition := true;
  ELSIF v_sub.status = 'accepted' AND p_new_status = 'pending' THEN
    -- accepted -> pending (-pontos, -1 missão)
    v_points_delta := -v_sub.points_awarded;
    v_completed_delta := -1;
    v_is_transition := true;
  END IF;

  -- 5. Actualizar submissão
  UPDATE memory_mission_submissions
  SET
    status = p_new_status,
    points_awarded = CASE WHEN p_new_status = 'accepted' THEN v_points_to_award ELSE 0 END,
    moderated_by = COALESCE(p_moderated_by, moderated_by),
    moderated_at = now(),
    rejection_reason = CASE WHEN p_new_status = 'rejected' THEN COALESCE(p_rejection_reason, rejection_reason) ELSE NULL END,
    updated_at = now()
  WHERE id = p_submission_id;

  -- 6. Actualizar scores do participante se houve alteração
  IF v_points_delta <> 0 OR v_completed_delta <> 0 THEN
    INSERT INTO memory_participant_scores (
      event_id, experience_id, participant_id, total_points, missions_completed, last_awarded_at, updated_at
    ) VALUES (
      v_sub.event_id, v_sub.experience_id, v_sub.participant_id,
      GREATEST(0, v_points_delta), GREATEST(0, v_completed_delta), now(), now()
    )
    ON CONFLICT (participant_id) DO UPDATE
    SET
      total_points = GREATEST(0, memory_participant_scores.total_points + v_points_delta),
      missions_completed = GREATEST(0, memory_participant_scores.missions_completed + v_completed_delta),
      last_awarded_at = CASE WHEN v_points_delta > 0 THEN now() ELSE memory_participant_scores.last_awarded_at END,
      updated_at = now();
  END IF;

  -- 7. Retornar dados actuais do score
  SELECT total_points, missions_completed INTO v_score
  FROM memory_participant_scores
  WHERE participant_id = v_sub.participant_id;

  RETURN QUERY SELECT
    v_sub.id,
    v_sub.status::text,
    p_new_status::text,
    v_points_delta,
    COALESCE(v_score.total_points, 0)::integer,
    COALESCE(v_score.missions_completed, 0)::integer,
    v_is_transition;
END;
$function$;

REVOKE ALL ON FUNCTION haxr_moderate_mission_submission(uuid, text, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION haxr_moderate_mission_submission(uuid, text, uuid, text) TO haxrweb_runtime, edition_runtime, haxr_edition_runtime;

CREATE OR REPLACE FUNCTION public.haxr_protect_comment_moderation()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF session_user IN ('edition_runtime', 'haxr_edition_runtime') OR current_user IN ('edition_runtime', 'haxr_edition_runtime') THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      RAISE EXCEPTION 'Participantes não têm permissão para alterar o estado de moderação de comentários.'
        USING ERRCODE = 'insufficient_privilege';
    END IF;

    IF OLD.moderated_at IS DISTINCT FROM NEW.moderated_at OR OLD.moderated_by IS DISTINCT FROM NEW.moderated_by THEN
      RAISE EXCEPTION 'Participantes não podem alterar metadados de moderação.'
        USING ERRCODE = 'insufficient_privilege';
    END IF;

    IF OLD.event_id IS DISTINCT FROM NEW.event_id 
       OR OLD.experience_id IS DISTINCT FROM NEW.experience_id 
       OR OLD.media_id IS DISTINCT FROM NEW.media_id 
       OR OLD.participant_id IS DISTINCT FROM NEW.participant_id THEN
      RAISE EXCEPTION 'Chaves relacionais de comentários são imutáveis.'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

GRANT EXECUTE ON FUNCTION haxr_protect_comment_moderation() TO haxrweb_runtime;

CREATE OR REPLACE FUNCTION public.haxr_protect_reaction_keys()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF session_user IN ('edition_runtime', 'haxr_edition_runtime') OR current_user IN ('edition_runtime', 'haxr_edition_runtime') THEN
    IF OLD.event_id IS DISTINCT FROM NEW.event_id 
       OR OLD.experience_id IS DISTINCT FROM NEW.experience_id 
       OR OLD.media_id IS DISTINCT FROM NEW.media_id 
       OR OLD.participant_id IS DISTINCT FROM NEW.participant_id THEN
      RAISE EXCEPTION 'Chaves relacionais de reacções são imutáveis.'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

GRANT EXECUTE ON FUNCTION haxr_protect_reaction_keys() TO haxrweb_runtime;

CREATE OR REPLACE FUNCTION public.haxr_prune_live_events(p_event_id uuid, p_experience_id uuid, p_retain_count integer DEFAULT 1000, p_max_age_hours integer DEFAULT 48)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_cutoff_seq bigint;
  v_deleted_rows integer;
BEGIN
  -- Identificar a menor sequência a reter
  SELECT sequence_no INTO v_cutoff_seq
  FROM memory_live_events
  WHERE event_id = p_event_id AND experience_id = p_experience_id
  ORDER BY sequence_no DESC
  OFFSET p_retain_count
  LIMIT 1;

  IF v_cutoff_seq IS NOT NULL THEN
    DELETE FROM memory_live_events
    WHERE event_id = p_event_id
      AND experience_id = p_experience_id
      AND sequence_no < v_cutoff_seq
      AND created_at < (now() - (p_max_age_hours || ' hours')::interval);
    GET DIAGNOSTICS v_deleted_rows = ROW_COUNT;
    RETURN v_deleted_rows;
  END IF;

  RETURN 0;
END;
$function$;

REVOKE ALL ON FUNCTION haxr_prune_live_events(uuid, uuid, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION haxr_prune_live_events(uuid, uuid, integer, integer) TO haxrweb_runtime;

CREATE OR REPLACE FUNCTION public.haxr_wedding_photos_live_events_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.event_id IS NOT NULL AND NEW.experience_id IS NOT NULL AND NEW.moderation_status = 'approved' THEN
      PERFORM haxr_emit_live_event(
        NEW.event_id, NEW.experience_id, 'media_approved', NEW.id,
        jsonb_build_object('moderation_status', NEW.moderation_status, 'has_derivatives', NEW.has_derivatives)
      );
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.event_id IS NOT NULL AND NEW.experience_id IS NOT NULL THEN
      -- Transição para aprovado
      IF (OLD.moderation_status IS DISTINCT FROM 'approved') AND (NEW.moderation_status = 'approved') THEN
        PERFORM haxr_emit_live_event(
          NEW.event_id, NEW.experience_id, 'media_approved', NEW.id,
          jsonb_build_object('moderation_status', NEW.moderation_status, 'has_derivatives', NEW.has_derivatives)
        );
      -- Transição de aprovado para rejeitado/oculto
      ELSIF (OLD.moderation_status = 'approved') AND (NEW.moderation_status IS DISTINCT FROM 'approved') THEN
        PERFORM haxr_emit_live_event(
          NEW.event_id, NEW.experience_id, 'media_hidden', NEW.id,
          jsonb_build_object('moderation_status', NEW.moderation_status)
        );
      -- Transição de derivados para ready
      ELSIF (OLD.derivatives_status IS DISTINCT FROM 'ready') AND (NEW.derivatives_status = 'ready') AND (NEW.moderation_status = 'approved') THEN
        PERFORM haxr_emit_live_event(
          NEW.event_id, NEW.experience_id, 'derivatives_ready', NEW.id,
          jsonb_build_object('has_derivatives', true)
        );
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.event_id IS NOT NULL AND OLD.experience_id IS NOT NULL THEN
      PERFORM haxr_emit_live_event(
        OLD.event_id, OLD.experience_id, 'media_deleted', OLD.id,
        jsonb_build_object('deleted', true)
      );
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$;

GRANT EXECUTE ON FUNCTION haxr_wedding_photos_live_events_trigger() TO haxrweb_runtime;

CREATE OR REPLACE FUNCTION public.trg_check_memory_mission_assignment_target()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uuid uuid;
  v_exists boolean;
BEGIN
  IF NEW.target_type = 'general' THEN
    IF NEW.target_id IS NOT NULL THEN
      RAISE EXCEPTION 'Target ID deve ser nulo para atribuição geral.'
        USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.target_type = 'participant' THEN
    IF NEW.target_id IS NULL AND NEW.participant_id IS NOT NULL THEN
      NEW.target_id := NEW.participant_id::text;
    END IF;
    IF NEW.target_id IS NULL THEN
      RAISE EXCEPTION 'Target ID deve ser especificado para atribuição de participante.'
        USING ERRCODE = 'check_violation';
    END IF;

    BEGIN
      v_uuid := NEW.target_id::uuid;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Target participant % não é um UUID válido.', NEW.target_id
        USING ERRCODE = 'invalid_text_representation';
    END;

    SELECT EXISTS (
      SELECT 1 FROM memory_participants
      WHERE id = v_uuid AND event_id = NEW.event_id AND experience_id = NEW.experience_id
    ) INTO v_exists;

    IF NOT v_exists THEN
      RAISE EXCEPTION 'Target participant % não encontrado para o evento % e experiência %.', NEW.target_id, NEW.event_id, NEW.experience_id
        USING ERRCODE = 'foreign_key_violation';
    END IF;
    NEW.participant_id := v_uuid;

  ELSIF NEW.target_type = 'guest' THEN
    IF NEW.target_id IS NULL THEN
      RAISE EXCEPTION 'Target ID deve ser especificado para atribuição de convidado.'
        USING ERRCODE = 'check_violation';
    END IF;

    BEGIN
      v_uuid := NEW.target_id::uuid;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Target guest % não é um UUID válido.', NEW.target_id
        USING ERRCODE = 'invalid_text_representation';
    END;

    SELECT EXISTS (
      SELECT 1 FROM guests
      WHERE id = v_uuid AND event_id = NEW.event_id AND deleted_at IS NULL
    ) INTO v_exists;

    IF NOT v_exists THEN
      RAISE EXCEPTION 'Target guest % não encontrado para o evento %.', NEW.target_id, NEW.event_id
        USING ERRCODE = 'foreign_key_violation';
    END IF;

  ELSIF NEW.target_type = 'table' THEN
    IF NEW.target_id IS NULL THEN
      RAISE EXCEPTION 'Target ID deve ser especificado para atribuição de mesa.'
        USING ERRCODE = 'check_violation';
    END IF;

    SELECT EXISTS (
      SELECT 1 FROM seats
      WHERE event_id = NEW.event_id AND (table_name = NEW.target_id OR id::text = NEW.target_id)
    ) INTO v_exists;

    IF NOT v_exists THEN
      RAISE EXCEPTION 'Target table % não encontrada para o evento %.', NEW.target_id, NEW.event_id
        USING ERRCODE = 'foreign_key_violation';
    END IF;

  ELSE
    RAISE EXCEPTION 'Tipo de target % desconhecido.', NEW.target_type
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  RETURN NEW;
END;
$function$;

GRANT EXECUTE ON FUNCTION trg_check_memory_mission_assignment_target() TO haxrweb_runtime;

-- -------------------------------------------------------------------------------------
-- 9.1 TRIGGERS DE INTEGRIDADE E REALTIME (CATÁLOGO CANÓNICO DO PREVIEW)
-- -------------------------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_enforce_comment_insert_policy ON memory_media_comments;
CREATE TRIGGER trg_enforce_comment_insert_policy BEFORE INSERT ON public.memory_media_comments FOR EACH ROW EXECUTE FUNCTION haxr_enforce_comment_insert_policy();

DROP TRIGGER IF EXISTS trg_protect_comment_moderation ON memory_media_comments;
CREATE TRIGGER trg_protect_comment_moderation BEFORE UPDATE ON public.memory_media_comments FOR EACH ROW EXECUTE FUNCTION haxr_protect_comment_moderation();

DROP TRIGGER IF EXISTS trg_protect_reaction_keys ON memory_media_reactions;
CREATE TRIGGER trg_protect_reaction_keys BEFORE UPDATE ON public.memory_media_reactions FOR EACH ROW EXECUTE FUNCTION haxr_protect_reaction_keys();

DROP TRIGGER IF EXISTS trg_validate_mission_assignment_target ON memory_mission_assignments;
CREATE TRIGGER trg_validate_mission_assignment_target BEFORE INSERT OR UPDATE ON public.memory_mission_assignments FOR EACH ROW EXECUTE FUNCTION trg_check_memory_mission_assignment_target();

DROP TRIGGER IF EXISTS trg_wedding_photos_live_events ON wedding_photos;
CREATE TRIGGER trg_wedding_photos_live_events AFTER INSERT OR DELETE OR UPDATE OF moderation_status, derivatives_status ON public.wedding_photos FOR EACH ROW EXECUTE FUNCTION haxr_wedding_photos_live_events_trigger();



-- -------------------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY & POLICIES DO PREVIEW
-- -------------------------------------------------------------------------------------
ALTER TABLE memory_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_mission_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_mission_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_participant_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_media_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_media_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_media_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_media_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_display_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_live_events ENABLE ROW LEVEL SECURITY;

-- Policies de memory_experiences
DROP POLICY IF EXISTS haxrweb_runtime_memory_experiences_all ON memory_experiences;
CREATE POLICY haxrweb_runtime_memory_experiences_all ON memory_experiences FOR ALL TO haxrweb_runtime USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS memories_experiences_runtime_policy ON memory_experiences;
CREATE POLICY memories_experiences_runtime_policy ON memory_experiences FOR ALL TO edition_runtime, haxr_edition_runtime, haxrweb_runtime USING (true) WITH CHECK (true);

-- Policies de wedding_photos
DROP POLICY IF EXISTS edition_runtime_photos_insert ON wedding_photos;
CREATE POLICY edition_runtime_photos_insert ON wedding_photos FOR INSERT TO edition_runtime WITH CHECK (true);

DROP POLICY IF EXISTS edition_runtime_photos_select ON wedding_photos;
CREATE POLICY edition_runtime_photos_select ON wedding_photos FOR SELECT TO edition_runtime USING (true);

DROP POLICY IF EXISTS edition_runtime_photos_update ON wedding_photos;
CREATE POLICY edition_runtime_photos_update ON wedding_photos FOR UPDATE TO edition_runtime USING (true);

DROP POLICY IF EXISTS haxr_edition_runtime_photos_insert ON wedding_photos;
CREATE POLICY haxr_edition_runtime_photos_insert ON wedding_photos FOR INSERT TO haxr_edition_runtime WITH CHECK (true);

DROP POLICY IF EXISTS haxr_edition_runtime_photos_select ON wedding_photos;
CREATE POLICY haxr_edition_runtime_photos_select ON wedding_photos FOR SELECT TO haxr_edition_runtime USING (true);

DROP POLICY IF EXISTS haxr_edition_runtime_photos_update ON wedding_photos;
CREATE POLICY haxr_edition_runtime_photos_update ON wedding_photos FOR UPDATE TO haxr_edition_runtime USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS memories_wedding_photos_runtime_policy ON wedding_photos;
CREATE POLICY memories_wedding_photos_runtime_policy ON wedding_photos FOR ALL TO edition_runtime, haxr_edition_runtime, haxrweb_runtime USING (true) WITH CHECK (true);

-- Policies de memory_stages
DROP POLICY IF EXISTS memory_stages_admin_write_policy ON memory_stages;
CREATE POLICY memory_stages_admin_write_policy ON memory_stages FOR ALL TO haxrweb_runtime USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS memory_stages_read_policy ON memory_stages;
CREATE POLICY memory_stages_read_policy ON memory_stages FOR SELECT TO edition_runtime, haxr_edition_runtime, haxrweb_runtime USING (((is_active = true) OR (CURRENT_USER = 'haxrweb_runtime'::name)));

-- Policies de memory_participants
DROP POLICY IF EXISTS memories_participants_runtime_policy ON memory_participants;
CREATE POLICY memories_participants_runtime_policy ON memory_participants FOR ALL TO edition_runtime, haxr_edition_runtime, haxrweb_runtime USING (true) WITH CHECK (true);

-- Policies de memory_sessions
DROP POLICY IF EXISTS memories_sessions_runtime_policy ON memory_sessions;
CREATE POLICY memories_sessions_runtime_policy ON memory_sessions FOR ALL TO edition_runtime, haxr_edition_runtime, haxrweb_runtime USING (true) WITH CHECK (true);

-- Policies de memory_missions
DROP POLICY IF EXISTS memory_missions_admin_write_policy ON memory_missions;
CREATE POLICY memory_missions_admin_write_policy ON memory_missions FOR ALL TO haxrweb_runtime USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS memory_missions_read_policy ON memory_missions;
CREATE POLICY memory_missions_read_policy ON memory_missions FOR SELECT TO edition_runtime, haxr_edition_runtime, haxrweb_runtime USING (((is_active = true) OR (CURRENT_USER = 'haxrweb_runtime'::name)));

-- Policies de memory_mission_assignments
DROP POLICY IF EXISTS memory_mission_assignments_admin_write_policy ON memory_mission_assignments;
CREATE POLICY memory_mission_assignments_admin_write_policy ON memory_mission_assignments FOR ALL TO haxrweb_runtime USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS memory_mission_assignments_read_policy ON memory_mission_assignments;
CREATE POLICY memory_mission_assignments_read_policy ON memory_mission_assignments FOR SELECT TO edition_runtime, haxr_edition_runtime, haxrweb_runtime USING (((is_active = true) OR (CURRENT_USER = 'haxrweb_runtime'::name)));

-- Policies de memory_mission_submissions
DROP POLICY IF EXISTS memory_mission_submissions_admin_policy ON memory_mission_submissions;
CREATE POLICY memory_mission_submissions_admin_policy ON memory_mission_submissions FOR ALL TO haxrweb_runtime USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS memory_mission_submissions_guest_insert_policy ON memory_mission_submissions;
CREATE POLICY memory_mission_submissions_guest_insert_policy ON memory_mission_submissions FOR INSERT TO edition_runtime, haxr_edition_runtime WITH CHECK ((participant_id = haxr_current_participant_id()));

DROP POLICY IF EXISTS memory_mission_submissions_guest_select_policy ON memory_mission_submissions;
CREATE POLICY memory_mission_submissions_guest_select_policy ON memory_mission_submissions FOR SELECT TO edition_runtime, haxr_edition_runtime USING ((participant_id = haxr_current_participant_id()));

DROP POLICY IF EXISTS memory_mission_submissions_guest_update_policy ON memory_mission_submissions;
CREATE POLICY memory_mission_submissions_guest_update_policy ON memory_mission_submissions FOR UPDATE TO edition_runtime, haxr_edition_runtime USING ((participant_id = haxr_current_participant_id())) WITH CHECK ((participant_id = haxr_current_participant_id()));

-- Policies de memory_participant_scores
DROP POLICY IF EXISTS memory_participant_scores_admin_policy ON memory_participant_scores;
CREATE POLICY memory_participant_scores_admin_policy ON memory_participant_scores FOR ALL TO haxrweb_runtime USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS memory_participant_scores_guest_select_policy ON memory_participant_scores;
CREATE POLICY memory_participant_scores_guest_select_policy ON memory_participant_scores FOR SELECT TO edition_runtime, haxr_edition_runtime USING (true);

-- Policies de memory_media_reactions
DROP POLICY IF EXISTS memory_media_reactions_admin_policy ON memory_media_reactions;
CREATE POLICY memory_media_reactions_admin_policy ON memory_media_reactions FOR ALL TO haxrweb_runtime USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS memory_media_reactions_guest_delete_policy ON memory_media_reactions;
CREATE POLICY memory_media_reactions_guest_delete_policy ON memory_media_reactions FOR DELETE TO edition_runtime, haxr_edition_runtime USING ((participant_id = haxr_current_participant_id()));

DROP POLICY IF EXISTS memory_media_reactions_guest_insert_policy ON memory_media_reactions;
CREATE POLICY memory_media_reactions_guest_insert_policy ON memory_media_reactions FOR INSERT TO edition_runtime, haxr_edition_runtime WITH CHECK ((participant_id = haxr_current_participant_id()));

DROP POLICY IF EXISTS memory_media_reactions_guest_select_policy ON memory_media_reactions;
CREATE POLICY memory_media_reactions_guest_select_policy ON memory_media_reactions FOR SELECT TO edition_runtime, haxr_edition_runtime USING ((participant_id = haxr_current_participant_id()));

DROP POLICY IF EXISTS memory_media_reactions_guest_update_policy ON memory_media_reactions;
CREATE POLICY memory_media_reactions_guest_update_policy ON memory_media_reactions FOR UPDATE TO edition_runtime, haxr_edition_runtime USING ((participant_id = haxr_current_participant_id())) WITH CHECK ((participant_id = haxr_current_participant_id()));

-- Policies de memory_media_comments
DROP POLICY IF EXISTS memory_media_comments_admin_policy ON memory_media_comments;
CREATE POLICY memory_media_comments_admin_policy ON memory_media_comments FOR ALL TO haxrweb_runtime USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS memory_media_comments_guest_delete_policy ON memory_media_comments;
CREATE POLICY memory_media_comments_guest_delete_policy ON memory_media_comments FOR DELETE TO edition_runtime, haxr_edition_runtime USING ((participant_id = haxr_current_participant_id()));

DROP POLICY IF EXISTS memory_media_comments_guest_insert_policy ON memory_media_comments;
CREATE POLICY memory_media_comments_guest_insert_policy ON memory_media_comments FOR INSERT TO edition_runtime, haxr_edition_runtime WITH CHECK ((participant_id = haxr_current_participant_id()));

DROP POLICY IF EXISTS memory_media_comments_guest_select_policy ON memory_media_comments;
CREATE POLICY memory_media_comments_guest_select_policy ON memory_media_comments FOR SELECT TO edition_runtime, haxr_edition_runtime USING (((status = 'approved'::text) OR (participant_id = haxr_current_participant_id())));

DROP POLICY IF EXISTS memory_media_comments_guest_update_policy ON memory_media_comments;
CREATE POLICY memory_media_comments_guest_update_policy ON memory_media_comments FOR UPDATE TO edition_runtime, haxr_edition_runtime USING ((participant_id = haxr_current_participant_id())) WITH CHECK ((participant_id = haxr_current_participant_id()));

-- Policies de memory_media_favorites
DROP POLICY IF EXISTS memory_media_favorites_admin_policy ON memory_media_favorites;
CREATE POLICY memory_media_favorites_admin_policy ON memory_media_favorites FOR ALL TO haxrweb_runtime USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS memory_media_favorites_guest_delete_policy ON memory_media_favorites;
CREATE POLICY memory_media_favorites_guest_delete_policy ON memory_media_favorites FOR DELETE TO edition_runtime, haxr_edition_runtime USING ((participant_id = haxr_current_participant_id()));

DROP POLICY IF EXISTS memory_media_favorites_guest_insert_policy ON memory_media_favorites;
CREATE POLICY memory_media_favorites_guest_insert_policy ON memory_media_favorites FOR INSERT TO edition_runtime, haxr_edition_runtime WITH CHECK ((participant_id = haxr_current_participant_id()));

DROP POLICY IF EXISTS memory_media_favorites_guest_select_policy ON memory_media_favorites;
CREATE POLICY memory_media_favorites_guest_select_policy ON memory_media_favorites FOR SELECT TO edition_runtime, haxr_edition_runtime USING ((participant_id = haxr_current_participant_id()));

-- Policies de memory_media_views
DROP POLICY IF EXISTS memory_media_views_admin_policy ON memory_media_views;
CREATE POLICY memory_media_views_admin_policy ON memory_media_views FOR ALL TO haxrweb_runtime USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS memory_media_views_guest_insert_policy ON memory_media_views;
CREATE POLICY memory_media_views_guest_insert_policy ON memory_media_views FOR INSERT TO edition_runtime, haxr_edition_runtime WITH CHECK ((participant_id = haxr_current_participant_id()));

DROP POLICY IF EXISTS memory_media_views_guest_select_policy ON memory_media_views;
CREATE POLICY memory_media_views_guest_select_policy ON memory_media_views FOR SELECT TO edition_runtime, haxr_edition_runtime USING ((participant_id = haxr_current_participant_id()));

DROP POLICY IF EXISTS memory_media_views_guest_update_policy ON memory_media_views;
CREATE POLICY memory_media_views_guest_update_policy ON memory_media_views FOR UPDATE TO edition_runtime, haxr_edition_runtime USING ((participant_id = haxr_current_participant_id())) WITH CHECK ((participant_id = haxr_current_participant_id()));

-- Policies de memory_display_sessions & memory_live_events
DROP POLICY IF EXISTS memory_display_sessions_runtime_policy ON memory_display_sessions;
CREATE POLICY memory_display_sessions_runtime_policy ON memory_display_sessions FOR ALL TO haxrweb_runtime, neondb_owner USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS memory_live_events_runtime_policy ON memory_live_events;
CREATE POLICY memory_live_events_runtime_policy ON memory_live_events FOR ALL TO haxrweb_runtime, neondb_owner USING (true) WITH CHECK (true);

-- -------------------------------------------------------------------------------------
-- 11. GRANTS DE RUNTIME PARA ROLES HAXR
-- -------------------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO haxrweb_runtime;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO edition_runtime, haxr_edition_runtime;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO haxrweb_runtime, edition_runtime, haxr_edition_runtime;
GRANT INSERT, UPDATE, DELETE ON memory_media_reactions, memory_media_comments, memory_media_favorites, memory_media_views, memory_mission_submissions, memory_participant_scores TO edition_runtime, haxr_edition_runtime;
GRANT INSERT, UPDATE ON wedding_photos TO edition_runtime, haxr_edition_runtime;

-- -------------------------------------------------------------------------------------
-- 12. POST-CONDITIONS SAFETY ASSERTIONS
-- -------------------------------------------------------------------------------------
DO $$
DECLARE
  v_count integer;
  v_expected_count integer;
  v_expected_hash text;
  v_actual_hash text;
BEGIN
  -- 1. Assert strictly expected wedding_photos count (exactamente 147)
  SELECT total_count, legacy_hash INTO v_expected_count, v_expected_hash 
  FROM _haxr_migration_baseline_check;

  SELECT count(*)::integer INTO v_count FROM wedding_photos;
  IF v_count <> v_expected_count THEN
    RAISE EXCEPTION 'SAFETY_GATE_TRIGGERED: wedding_photos count altered during migration (now %, expected %). Rolling back.', v_count, v_expected_count;
  END IF;

  -- 2. Assert legacy columns hash matches exact pre-migration hash
  SELECT md5(string_agg(
    id::text || '|' || 
    invitation_slug || '|' || 
    storage_path || '|' || 
    COALESCE(original_filename, '') || '|' || 
    content_type || '|' || 
    file_size_bytes::text || '|' || 
    COALESCE(guest_name, '') || '|' || 
    COALESCE(caption, '') || '|' || 
    moderation_status,
    '#' ORDER BY id
  )) INTO v_actual_hash
  FROM wedding_photos;

  IF v_actual_hash <> v_expected_hash THEN
    RAISE EXCEPTION 'SAFETY_GATE_TRIGGERED: Legacy media checksum mutated (hash: %, expected %). Rolling back.', v_actual_hash, v_expected_hash;
  END IF;
END $$;

COMMIT;
-- =====================================================================================
-- FIM DA MIGRAÇÃO CANÓNICA DE CONVERGÊNCIA
-- =====================================================================================
