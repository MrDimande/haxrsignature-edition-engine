import fs from 'fs';

const dump = JSON.parse(fs.readFileSync('scripts/preview-schema-dump.json', 'utf8'));

// Helper to generate CREATE TABLE statement from dump
function generateCreateTable(tableName) {
  const t = dump[tableName];
  if (!t) throw new Error(`Table ${tableName} not found in dump`);

  const lines = [];
  // Columns
  for (const c of t.columns) {
    let colDef = `  ${c.column_name} `;
    if (c.data_type === 'USER-DEFINED') colDef += c.udt_name;
    else if (c.data_type === 'ARRAY') colDef += `${c.udt_name.replace(/^_/, '')}[]`;
    else colDef += c.data_type;

    if (c.column_default) colDef += ` DEFAULT ${c.column_default}`;
    if (c.is_nullable === 'NO') colDef += ' NOT NULL';
    lines.push(colDef);
  }

  // Constraints (PK, UNIQUE, CHECK, FK)
  for (const con of t.constraints) {
    if (con.contype === 'n') continue; // Not nulls are in column defs
    lines.push(`  CONSTRAINT ${con.conname} ${con.def}`);
  }

  let out = `CREATE TABLE IF NOT EXISTS ${tableName} (\n${lines.join(',\n')}\n);\n\n`;

  // Indexes
  for (const idx of t.indexes) {
    if (t.constraints.some(c => c.conname === idx.indexname)) continue; // Already created by PK or UNIQUE constraint
    // Replace "CREATE INDEX ... ON public.tableName" with "CREATE INDEX IF NOT EXISTS ... ON tableName"
    let idxDef = idx.indexdef.replace('CREATE INDEX ', 'CREATE INDEX IF NOT EXISTS ');
    idxDef = idxDef.replace('CREATE UNIQUE INDEX ', 'CREATE UNIQUE INDEX IF NOT EXISTS ');
    idxDef = idxDef.replace('public.', '');
    out += `${idxDef};\n`;
  }

  return out;
}

const ftDump = JSON.parse(fs.readFileSync('scripts/preview-functions-triggers.json', 'utf8'));

function generateFunctionsAndTriggers() {
  let out = `-- -------------------------------------------------------------------------------------\n`;
  out += `-- 9. SECURITY DEFINER FUNCTIONS & TRIGGER FUNCTIONS (CATÁLOGO CANÓNICO DO PREVIEW)\n`;
  out += `-- -------------------------------------------------------------------------------------\n\n`;

  const memFunctions = ftDump.functions.filter(f => f.function_name.startsWith('haxr_') || f.function_name.startsWith('trg_'));
  for (const f of memFunctions) {
    let def = f.definition.trim();
    if (!def.endsWith(';')) def += ';';
    out += `${def}\n\n`;

    const typesOnly = f.arguments.split(',').map(arg => {
      const trimmed = arg.trim();
      if (!trimmed) return '';
      const parts = trimmed.split(' ');
      const defIdx = parts.indexOf('DEFAULT');
      const typeParts = defIdx > -1 ? parts.slice(1, defIdx) : parts.slice(1);
      return typeParts.join(' ');
    }).filter(Boolean).join(', ');

    const clean = (f.acl || '').replace(/^\{|\}$/g, '');
    const parts = clean ? clean.split(',') : [];
    const roles = [];
    for (const part of parts) {
      const match = part.match(/^([^=]+)=/);
      if (match && match[1] && match[1] !== 'neondb_owner') {
        roles.push(match[1]);
      }
    }

    if (!f.public_execute) {
      out += `REVOKE ALL ON FUNCTION ${f.function_name}(${typesOnly}) FROM PUBLIC;\n`;
    }
    if (roles.length > 0) {
      out += `GRANT EXECUTE ON FUNCTION ${f.function_name}(${typesOnly}) TO ${roles.join(', ')};\n\n`;
    } else {
      out += `\n`;
    }
  }

  out += `-- -------------------------------------------------------------------------------------\n`;
  out += `-- 9.1 TRIGGERS DE INTEGRIDADE E REALTIME (CATÁLOGO CANÓNICO DO PREVIEW)\n`;
  out += `-- -------------------------------------------------------------------------------------\n\n`;

  const memTriggers = ftDump.triggers.filter(t => t.table_name.startsWith('memory_') || t.table_name === 'wedding_photos');
  for (const t of memTriggers) {
    let tDef = t.trigger_def.trim();
    if (!tDef.endsWith(';')) tDef += ';';
    out += `DROP TRIGGER IF EXISTS ${t.trigger_name} ON ${t.table_name};\n`;
    out += `${tDef}\n\n`;
  }

  return out;
}

let sql = `-- =====================================================================================
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
${generateCreateTable('memory_stages')}

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
${generateCreateTable('memory_participants')}
${generateCreateTable('memory_sessions')}

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
${generateCreateTable('memory_missions')}
${generateCreateTable('memory_mission_assignments')}
${generateCreateTable('memory_mission_submissions')}
${generateCreateTable('memory_participant_scores')}

-- -------------------------------------------------------------------------------------
-- 6. CRIAÇÃO DE SOCIAL: REACTIONS, COMMENTS, FAVORITES, VIEWS
-- -------------------------------------------------------------------------------------
${generateCreateTable('memory_media_reactions')}
${generateCreateTable('memory_media_comments')}
${generateCreateTable('memory_media_favorites')}
${generateCreateTable('memory_media_views')}

-- -------------------------------------------------------------------------------------
-- 7. CRIAÇÃO DE LIVE WALL: DISPLAY SESSIONS, STREAM STATE, LIVE EVENTS
-- -------------------------------------------------------------------------------------
${generateCreateTable('memory_display_sessions')}
${generateCreateTable('memory_live_stream_state')}
CREATE SEQUENCE IF NOT EXISTS memory_live_events_id_seq;
${generateCreateTable('memory_live_events')}

-- -------------------------------------------------------------------------------------
-- 8. CRIAÇÃO DE RECAP: PUBLICATIONS, ITEMS
-- -------------------------------------------------------------------------------------
${generateCreateTable('memory_recap_publications')}
${generateCreateTable('memory_recap_items')}

${generateFunctionsAndTriggers()}

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
`;

fs.writeFileSync('supabase/migrations/20260912120000_plus_memories_v2_release_convergence.sql', sql, 'utf8');
console.log('Successfully written exact convergence migration SQL from catalog dump!');
