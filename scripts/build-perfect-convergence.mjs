import fs from 'fs';

const sql = `-- =====================================================================================
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
  ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES events(id) ON DELETE RESTRICT,
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
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'memory_experiences_access_mode_check' AND conrelid = 'memory_experiences'::regclass) THEN
    ALTER TABLE memory_experiences
      ADD CONSTRAINT memory_experiences_access_mode_check
      CHECK (access_mode IN ('legacy', 'session'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'memory_experiences_visibility_check' AND conrelid = 'memory_experiences'::regclass) THEN
    ALTER TABLE memory_experiences
      ADD CONSTRAINT memory_experiences_visibility_check
      CHECK (visibility IN ('community', 'moderated', 'private_to_couple'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'memory_experiences_live_wall_mode_check' AND conrelid = 'memory_experiences'::regclass) THEN
    ALTER TABLE memory_experiences
      ADD CONSTRAINT memory_experiences_live_wall_mode_check
      CHECK (live_wall_mode IN ('spotlight', 'mosaic', 'moments'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'memory_experiences_id_event_id_key' AND conrelid = 'memory_experiences'::regclass) THEN
    ALTER TABLE memory_experiences
      ADD CONSTRAINT memory_experiences_id_event_id_key UNIQUE (id, event_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS memory_experiences_event_id_idx
  ON memory_experiences (event_id);

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
-- 2. NOVAS TABELAS DE BASE: memory_stages & memory_participants & memory_sessions
-- -------------------------------------------------------------------------------------
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

-- Ligação de stage_filter_id em memory_experiences
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'memory_experiences_stage_filter_fkey' AND conrelid = 'memory_experiences'::regclass) THEN
    ALTER TABLE memory_experiences
      ADD CONSTRAINT memory_experiences_stage_filter_fkey
      FOREIGN KEY (stage_filter_id, event_id, id) REFERENCES memory_stages(id, event_id, experience_id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS memory_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  experience_id uuid REFERENCES memory_experiences(id) ON DELETE CASCADE,
  guest_id uuid REFERENCES guests(id) ON DELETE SET NULL,
  assigned_table_id text,
  display_name text,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT memory_participants_id_event_id_key UNIQUE (id, event_id),
  CONSTRAINT memory_participants_id_event_experience_key UNIQUE (id, event_id, experience_id)
);

CREATE INDEX IF NOT EXISTS memory_participants_event_guest_idx
  ON memory_participants (event_id, guest_id);

CREATE INDEX IF NOT EXISTS memory_participants_experience_idx
  ON memory_participants (experience_id);

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

CREATE INDEX IF NOT EXISTS memory_sessions_active_idx
  ON memory_sessions (expires_at) WHERE (revoked_at IS NULL);

CREATE INDEX IF NOT EXISTS memory_sessions_event_participant_idx
  ON memory_sessions (event_id, participant_id);

-- -------------------------------------------------------------------------------------
-- 3. EVOLUÇÃO DE TABELAS EXISTENTES: wedding_photos (20 NOVAS COLUNAS DO PREVIEW)
-- -------------------------------------------------------------------------------------
ALTER TABLE wedding_photos
  ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES events(id) ON DELETE RESTRICT,
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

-- Constraints e Unique keys de wedding_photos
DO $$
BEGIN
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
  SELECT count(*)::integer INTO v_null_exp_count 
  FROM wedding_photos 
  WHERE experience_id IS NULL;
  IF v_null_exp_count > 0 THEN
    RAISE EXCEPTION 'SAFETY_GATE_TRIGGERED: % registos em wedding_photos com experience_id NULL após backfill.', v_null_exp_count;
  END IF;

  SELECT count(*)::integer INTO v_null_event_count 
  FROM wedding_photos 
  WHERE event_id IS NULL;
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
-- 4. MISSIONS, SUBMISSIONS & GAMIFICAÇÃO
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS memory_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  experience_id uuid NOT NULL REFERENCES memory_experiences(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'general',
  difficulty text NOT NULL DEFAULT 'medium',
  points integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  stage_id uuid REFERENCES memory_stages(id) ON DELETE SET NULL,
  starts_at timestamptz,
  ends_at timestamptz,
  required_media_type text NOT NULL DEFAULT 'any',
  max_submissions_per_participant integer NOT NULL DEFAULT 1,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  submission_review_policy varchar NOT NULL DEFAULT 'auto_accept',
  CONSTRAINT memory_missions_points_check CHECK (points > 0 AND points <= 10000),
  CONSTRAINT memory_missions_required_media_type_check CHECK (required_media_type IN ('any', 'image', 'video')),
  CONSTRAINT memory_missions_submission_review_policy_check CHECK (submission_review_policy IN ('auto_accept', 'manual_review')),
  CONSTRAINT memory_missions_time_window_check CHECK (starts_at IS NULL OR ends_at IS NULL OR starts_at < ends_at),
  CONSTRAINT memory_missions_max_submissions_per_participant_check CHECK (max_submissions_per_participant >= 1),
  CONSTRAINT memory_missions_experience_slug_key UNIQUE (experience_id, slug),
  CONSTRAINT memory_missions_composite_identity_key UNIQUE (id, event_id, experience_id)
);

CREATE TABLE IF NOT EXISTS memory_mission_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  experience_id uuid NOT NULL REFERENCES memory_experiences(id) ON DELETE CASCADE,
  mission_id uuid NOT NULL REFERENCES memory_missions(id) ON DELETE CASCADE,
  target_type text NOT NULL DEFAULT 'general',
  target_id text,
  participant_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT memory_mission_assignments_target_type_check CHECK (target_type IN ('general', 'participant', 'guest', 'table')),
  CONSTRAINT chk_mission_assignment_target CHECK (
    (target_type = 'general' AND target_id IS NULL) OR
    (target_type IN ('participant', 'guest', 'table') AND (target_id IS NOT NULL OR participant_id IS NOT NULL))
  ),
  CONSTRAINT memory_mission_assignments_mission_target_key UNIQUE (mission_id, target_type, target_id),
  CONSTRAINT memory_mission_assignments_composite_identity_key UNIQUE (id, event_id, experience_id),
  CONSTRAINT uq_memory_mission_assignments_composite UNIQUE (event_id, experience_id, mission_id, id)
);

CREATE TABLE IF NOT EXISTS memory_mission_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  experience_id uuid NOT NULL REFERENCES memory_experiences(id) ON DELETE CASCADE,
  mission_id uuid NOT NULL REFERENCES memory_missions(id) ON DELETE CASCADE,
  assignment_id uuid,
  participant_id uuid NOT NULL,
  media_id uuid NOT NULL,
  points_awarded integer NOT NULL DEFAULT 0 CHECK (points_awarded >= 0),
  status text NOT NULL DEFAULT 'accepted' CHECK (status IN ('accepted', 'pending', 'rejected')),
  moderation_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  moderated_by uuid,
  moderated_at timestamptz,
  rejection_reason text,
  CONSTRAINT memory_mission_submissions_mission_media_key UNIQUE (mission_id, media_id),
  CONSTRAINT memory_mission_submissions_composite_identity_key UNIQUE (id, event_id, experience_id),
  CONSTRAINT memory_mission_submissions_assignment_fkey FOREIGN KEY (assignment_id, event_id, experience_id) REFERENCES memory_mission_assignments(id, event_id, experience_id) ON DELETE SET NULL,
  CONSTRAINT fk_mission_subs_assignment FOREIGN KEY (event_id, experience_id, mission_id, assignment_id) REFERENCES memory_mission_assignments(event_id, experience_id, mission_id, id) ON DELETE SET NULL,
  CONSTRAINT memory_mission_submissions_media_fkey FOREIGN KEY (media_id, event_id, experience_id) REFERENCES wedding_photos(id, event_id, experience_id) ON DELETE CASCADE,
  CONSTRAINT memory_mission_submissions_participant_fkey FOREIGN KEY (participant_id, event_id, experience_id) REFERENCES memory_participants(id, event_id, experience_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS memory_participant_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  experience_id uuid NOT NULL REFERENCES memory_experiences(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL UNIQUE REFERENCES memory_participants(id) ON DELETE CASCADE,
  total_points integer NOT NULL DEFAULT 0 CHECK (total_points >= 0),
  missions_completed integer NOT NULL DEFAULT 0 CHECK (missions_completed >= 0),
  last_awarded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_memory_participant_scores_composite UNIQUE (event_id, experience_id, participant_id),
  CONSTRAINT memory_participant_scores_experience_event_fkey FOREIGN KEY (experience_id, event_id) REFERENCES memory_experiences(id, event_id) ON DELETE CASCADE,
  CONSTRAINT memory_participant_scores_participant_fkey FOREIGN KEY (participant_id, event_id, experience_id) REFERENCES memory_participants(id, event_id, experience_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS memory_participant_scores_leaderboard_idx
  ON memory_participant_scores (experience_id, total_points DESC, last_awarded_at);

-- -------------------------------------------------------------------------------------
-- 5. SOCIAL: REACTIONS, COMMENTS, FAVORITES & VIEWS
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS memory_media_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  experience_id uuid NOT NULL REFERENCES memory_experiences(id) ON DELETE CASCADE,
  media_id uuid NOT NULL,
  participant_id uuid NOT NULL,
  reaction_type text NOT NULL CHECK (reaction_type IN ('love', 'applause', 'champagne', 'elegance', 'toast')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT memory_media_reactions_participant_media_key UNIQUE (participant_id, media_id),
  CONSTRAINT memory_media_reactions_composite_identity_key UNIQUE (id, event_id, experience_id),
  CONSTRAINT memory_media_reactions_experience_event_fkey FOREIGN KEY (experience_id, event_id) REFERENCES memory_experiences(id, event_id) ON DELETE CASCADE,
  CONSTRAINT memory_media_reactions_media_event_experience_fkey FOREIGN KEY (media_id, event_id, experience_id) REFERENCES wedding_photos(id, event_id, experience_id) ON DELETE CASCADE,
  CONSTRAINT memory_media_reactions_participant_event_experience_fkey FOREIGN KEY (participant_id, event_id, experience_id) REFERENCES memory_participants(id, event_id, experience_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS memory_media_reactions_media_type_idx
  ON memory_media_reactions (media_id, reaction_type);

CREATE INDEX IF NOT EXISTS memory_media_reactions_participant_idx
  ON memory_media_reactions (participant_id, media_id);

CREATE TABLE IF NOT EXISTS memory_media_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  experience_id uuid NOT NULL REFERENCES memory_experiences(id) ON DELETE CASCADE,
  media_id uuid NOT NULL,
  participant_id uuid NOT NULL,
  body text NOT NULL CHECK (length(TRIM(BOTH FROM body)) >= 1 AND length(body) <= 500),
  status text NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected', 'hidden', 'deleted')),
  moderated_at timestamptz,
  moderated_by uuid,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT memory_media_comments_composite_identity_key UNIQUE (id, event_id, experience_id),
  CONSTRAINT memory_media_comments_experience_event_fkey FOREIGN KEY (experience_id, event_id) REFERENCES memory_experiences(id, event_id) ON DELETE CASCADE,
  CONSTRAINT memory_media_comments_media_event_experience_fkey FOREIGN KEY (media_id, event_id, experience_id) REFERENCES wedding_photos(id, event_id, experience_id) ON DELETE CASCADE,
  CONSTRAINT memory_media_comments_participant_event_experience_fkey FOREIGN KEY (participant_id, event_id, experience_id) REFERENCES memory_participants(id, event_id, experience_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS memory_media_comments_media_approved_idx
  ON memory_media_comments (media_id, created_at) WHERE (status = 'approved');

CREATE INDEX IF NOT EXISTS memory_media_comments_participant_idx
  ON memory_media_comments (participant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS memory_media_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  experience_id uuid NOT NULL REFERENCES memory_experiences(id) ON DELETE CASCADE,
  media_id uuid NOT NULL,
  participant_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT memory_media_favorites_participant_media_key UNIQUE (participant_id, media_id),
  CONSTRAINT memory_media_favorites_composite_identity_key UNIQUE (id, event_id, experience_id),
  CONSTRAINT memory_media_favorites_experience_event_fkey FOREIGN KEY (experience_id, event_id) REFERENCES memory_experiences(id, event_id) ON DELETE CASCADE,
  CONSTRAINT memory_media_favorites_media_event_experience_fkey FOREIGN KEY (media_id, event_id, experience_id) REFERENCES wedding_photos(id, event_id, experience_id) ON DELETE CASCADE,
  CONSTRAINT memory_media_favorites_participant_event_experience_fkey FOREIGN KEY (participant_id, event_id, experience_id) REFERENCES memory_participants(id, event_id, experience_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS memory_media_favorites_participant_created_idx
  ON memory_media_favorites (participant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS memory_media_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  experience_id uuid NOT NULL REFERENCES memory_experiences(id) ON DELETE CASCADE,
  media_id uuid NOT NULL,
  participant_id uuid NOT NULL,
  session_id uuid REFERENCES memory_sessions(id) ON DELETE SET NULL,
  seen_at timestamptz NOT NULL DEFAULT now(),
  last_progress numeric NOT NULL DEFAULT 1.0 CHECK (last_progress >= 0.0 AND last_progress <= 1.0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT memory_media_views_participant_media_key UNIQUE (participant_id, media_id),
  CONSTRAINT memory_media_views_experience_id_fkey FOREIGN KEY (experience_id) REFERENCES memory_experiences(id) ON DELETE CASCADE,
  CONSTRAINT memory_media_views_media_event_experience_fkey FOREIGN KEY (media_id, event_id, experience_id) REFERENCES wedding_photos(id, event_id, experience_id) ON DELETE CASCADE,
  CONSTRAINT memory_media_views_participant_event_experience_fkey FOREIGN KEY (participant_id, event_id, experience_id) REFERENCES memory_participants(id, event_id, experience_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS memory_media_views_media_idx
  ON memory_media_views (media_id);

CREATE INDEX IF NOT EXISTS memory_media_views_part_event_idx
  ON memory_media_views (participant_id, event_id);

-- -------------------------------------------------------------------------------------
-- 6. LIVE WALL & SSE REALTIME BUFFER
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS memory_display_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  experience_id uuid NOT NULL,
  token_hash text NOT NULL UNIQUE,
  device_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  last_seen_at timestamptz,
  CONSTRAINT memory_display_sessions_experience_fkey FOREIGN KEY (experience_id, event_id) REFERENCES memory_experiences(id, event_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS memory_display_sessions_event_idx
  ON memory_display_sessions (event_id, experience_id);

CREATE INDEX IF NOT EXISTS memory_display_sessions_lookup_idx
  ON memory_display_sessions (token_hash, expires_at) WHERE (revoked_at IS NULL);

CREATE TABLE IF NOT EXISTS memory_live_stream_state (
  event_id uuid NOT NULL,
  experience_id uuid NOT NULL,
  last_sequence_no bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, experience_id),
  CONSTRAINT memory_live_stream_state_fkey FOREIGN KEY (experience_id, event_id) REFERENCES memory_experiences(id, event_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS memory_live_events (
  id bigserial PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  experience_id uuid NOT NULL REFERENCES memory_experiences(id) ON DELETE CASCADE,
  sequence_no bigint NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('media_approved', 'media_hidden', 'media_deleted', 'derivatives_ready', 'social_changed', 'comment_approved', 'stage_changed')),
  subject_media_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  subject_stage_id uuid,
  CONSTRAINT memory_live_events_stream_sequence_key UNIQUE (event_id, experience_id, sequence_no),
  CONSTRAINT memory_live_events_subject_check CHECK (
    ((event_type IN ('media_approved', 'media_hidden', 'media_deleted', 'derivatives_ready', 'social_changed', 'comment_approved')) AND subject_media_id IS NOT NULL AND subject_stage_id IS NULL) OR
    ((event_type = 'stage_changed') AND subject_media_id IS NULL AND subject_stage_id IS NOT NULL) OR
    ((event_type NOT IN ('media_approved', 'media_hidden', 'media_deleted', 'derivatives_ready', 'social_changed', 'comment_approved', 'stage_changed')) AND subject_media_id IS NULL AND subject_stage_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS memory_live_events_created_idx
  ON memory_live_events (event_id, experience_id, created_at);

CREATE INDEX IF NOT EXISTS memory_live_events_stream_idx
  ON memory_live_events (event_id, experience_id, sequence_no);

-- -------------------------------------------------------------------------------------
-- 7. RECAP & CURADORIA FINAL
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS memory_recap_publications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  experience_id uuid NOT NULL,
  version integer NOT NULL DEFAULT 1,
  lock_version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  title text CHECK (title IS NULL OR char_length(title) <= 120),
  welcome_message text CHECK (welcome_message IS NULL OR char_length(welcome_message) <= 1000),
  closing_message text CHECK (closing_message IS NULL OR char_length(closing_message) <= 1000),
  access_level text NOT NULL DEFAULT 'guests_only' CHECK (access_level IN ('guests_only', 'share_link_only', 'public')),
  configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT memory_recap_publications_experience_version_key UNIQUE (experience_id, version),
  CONSTRAINT memory_recap_publications_identity_key UNIQUE (id, event_id, experience_id),
  CONSTRAINT memory_recap_publications_experience_event_fkey FOREIGN KEY (experience_id, event_id) REFERENCES memory_experiences(id, event_id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS memory_recap_draft_experience_idx
  ON memory_recap_publications (experience_id) WHERE (status = 'draft');

CREATE UNIQUE INDEX IF NOT EXISTS memory_recap_published_experience_idx
  ON memory_recap_publications (experience_id) WHERE (status = 'published');

CREATE TABLE IF NOT EXISTS memory_recap_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id uuid NOT NULL,
  event_id uuid NOT NULL,
  experience_id uuid NOT NULL,
  media_id uuid NOT NULL,
  section text NOT NULL CHECK (section IN ('hero', 'story', 'moments', 'missions', 'closing')),
  stage_id uuid,
  position integer NOT NULL DEFAULT 0,
  editorial_caption text CHECK (editorial_caption IS NULL OR char_length(editorial_caption) <= 300),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT memory_recap_items_publication_media_section_key UNIQUE (publication_id, media_id, section),
  CONSTRAINT memory_recap_items_media_fkey FOREIGN KEY (media_id, event_id, experience_id) REFERENCES wedding_photos(id, event_id, experience_id) ON DELETE CASCADE,
  CONSTRAINT memory_recap_items_publication_fkey FOREIGN KEY (publication_id, event_id, experience_id) REFERENCES memory_recap_publications(id, event_id, experience_id) ON DELETE CASCADE,
  CONSTRAINT memory_recap_items_stage_fkey FOREIGN KEY (stage_id, event_id, experience_id) REFERENCES memory_stages(id, event_id, experience_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS memory_recap_items_pub_sec_pos_idx
  ON memory_recap_items (publication_id, section, position);

CREATE UNIQUE INDEX IF NOT EXISTS memory_recap_items_single_hero_idx
  ON memory_recap_items (publication_id) WHERE (section = 'hero');

-- -------------------------------------------------------------------------------------
-- 8. SECURITY DEFINER FUNCTIONS & WORKER LEASE (search_path = public, pg_temp)
-- -------------------------------------------------------------------------------------

-- Helper para recuperar participant_id do contexto de sessão
CREATE OR REPLACE FUNCTION haxr_current_participant_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_participant_id text;
BEGIN
  v_participant_id := current_setting('request.jwt.claim.participant_id', true);
  IF v_participant_id IS NULL OR v_participant_id = '' THEN
    v_participant_id := current_setting('haxr.current_participant_id', true);
  END IF;
  IF v_participant_id IS NOT NULL AND v_participant_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN v_participant_id::uuid;
  END IF;
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION haxr_current_participant_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION haxr_current_participant_id() TO haxrweb_runtime, edition_runtime, haxr_edition_runtime;

-- Claim media derivative job com lease token
CREATE OR REPLACE FUNCTION haxr_claim_media_derivative_job(
  p_media_id uuid,
  p_worker_id text,
  p_lease_timeout_seconds integer DEFAULT 300,
  p_force boolean DEFAULT false
)
RETURNS TABLE (
  claimed boolean,
  media_id uuid,
  invitation_slug text,
  storage_path text,
  content_type text,
  media_type text,
  poster_storage_path text,
  locked_at timestamptz,
  attempts integer,
  lease_token uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_row wedding_photos%ROWTYPE;
  v_new_token uuid;
BEGIN
  SELECT * INTO v_row
  FROM wedding_photos
  WHERE id = p_media_id
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::text, NULL::text, NULL::text, NULL::text, NULL::timestamptz, NULL::integer, NULL::uuid;
    RETURN;
  END IF;

  IF v_row.derivatives_status = 'ready' AND NOT p_force THEN
    RETURN QUERY SELECT false, v_row.id, v_row.invitation_slug, v_row.storage_path, v_row.content_type, v_row.media_type, v_row.poster_storage_path, v_row.derivatives_locked_at, v_row.derivatives_attempts, NULL::uuid;
    RETURN;
  END IF;

  IF v_row.derivatives_status = 'processing' AND NOT p_force THEN
    IF v_row.derivatives_locked_at IS NOT NULL AND (now() - v_row.derivatives_locked_at) < (p_lease_timeout_seconds || ' seconds')::interval THEN
      RETURN QUERY SELECT false, v_row.id, v_row.invitation_slug, v_row.storage_path, v_row.content_type, v_row.media_type, v_row.poster_storage_path, v_row.derivatives_locked_at, v_row.derivatives_attempts, NULL::uuid;
      RETURN;
    END IF;
  END IF;

  v_new_token := gen_random_uuid();

  UPDATE wedding_photos
  SET derivatives_status = 'processing',
      derivatives_locked_at = now(),
      derivatives_locked_by = p_worker_id,
      derivatives_attempts = derivatives_attempts + 1,
      derivatives_lease_token = v_new_token
  WHERE id = p_media_id;

  RETURN QUERY SELECT true, v_row.id, v_row.invitation_slug, v_row.storage_path, v_row.content_type, v_row.media_type, v_row.poster_storage_path, now(), v_row.derivatives_attempts + 1, v_new_token;
END;
$$;

REVOKE ALL ON FUNCTION haxr_claim_media_derivative_job(uuid, text, integer, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION haxr_claim_media_derivative_job(uuid, text, integer, boolean) TO haxrweb_runtime;

-- Toggle media reaction com contagem atómica
CREATE OR REPLACE FUNCTION haxr_toggle_media_reaction(
  p_media_id uuid,
  p_participant_id uuid,
  p_reaction_type text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_exists boolean;
  v_count integer;
  v_event_id uuid;
  v_experience_id uuid;
BEGIN
  SELECT event_id, experience_id INTO v_event_id, v_experience_id
  FROM wedding_photos WHERE id = p_media_id;

  SELECT EXISTS (
    SELECT 1 FROM memory_media_reactions
    WHERE media_id = p_media_id AND participant_id = p_participant_id AND reaction_type = p_reaction_type
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM memory_media_reactions
    WHERE media_id = p_media_id AND participant_id = p_participant_id AND reaction_type = p_reaction_type;
  ELSE
    INSERT INTO memory_media_reactions (event_id, experience_id, media_id, participant_id, reaction_type)
    VALUES (v_event_id, v_experience_id, p_media_id, p_participant_id, p_reaction_type);
  END IF;

  SELECT count(*)::integer INTO v_count
  FROM memory_media_reactions
  WHERE media_id = p_media_id;

  RETURN jsonb_build_object('toggled', NOT v_exists, 'total_reactions', v_count);
END;
$$;

REVOKE ALL ON FUNCTION haxr_toggle_media_reaction(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION haxr_toggle_media_reaction(uuid, uuid, text) TO haxrweb_runtime, edition_runtime, haxr_edition_runtime;

-- -------------------------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY & POLICIES DO PREVIEW
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
-- 10. GRANTS DE RUNTIME PARA ROLES HAXR
-- -------------------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO haxrweb_runtime;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO edition_runtime, haxr_edition_runtime;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO haxrweb_runtime, edition_runtime, haxr_edition_runtime;
GRANT INSERT, UPDATE, DELETE ON memory_media_reactions, memory_media_comments, memory_media_favorites, memory_media_views, memory_mission_submissions, memory_participant_scores TO edition_runtime, haxr_edition_runtime;
GRANT INSERT, UPDATE ON wedding_photos TO edition_runtime, haxr_edition_runtime;

-- -------------------------------------------------------------------------------------
-- 11. POST-CONDITIONS SAFETY ASSERTIONS
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
`;

fs.writeFileSync('supabase/migrations/20260912120000_plus_memories_v2_release_convergence.sql', sql, 'utf8');
console.log('Successfully wrote updated 20260912120000_plus_memories_v2_release_convergence.sql');
