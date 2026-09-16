-- ==============================================================================
-- HAXR PLUS MEMORIES — FASE 7: LIVE WALL & REAL-TIME EVENT EXPERIENCE
-- 1. Configuração por experiência em memory_experiences (live_wall_enabled default FALSE)
-- 2. Sessões de display dedicadas com privilégio mínimo (memory_display_sessions)
-- 3. Sequenciador monotónico de stream transaccional (memory_live_stream_state)
-- 4. Event log append-only com tombstone para mídias apagadas (memory_live_events)
-- 5. Triggers automáticos de moderação, derivados e remoção em tempo real
-- 6. Políticas RLS e privilégios estritos (zero acesso directo para edition_runtime)
-- ==============================================================================

-- 1. memory_experiences: colunas aditivas para configuração do Live Wall
ALTER TABLE memory_experiences
  ADD COLUMN IF NOT EXISTS live_wall_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS live_wall_mode text NOT NULL DEFAULT 'spotlight',
  ADD COLUMN IF NOT EXISTS auto_advance_seconds integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS show_reactions boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_comments boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_explorers boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_missions boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS stage_filter_id uuid NULL,
  ADD COLUMN IF NOT EXISTS moderation_delay_seconds integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_wall_items integer NOT NULL DEFAULT 100;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'memory_experiences_live_wall_mode_check') THEN
    ALTER TABLE memory_experiences
      ADD CONSTRAINT memory_experiences_live_wall_mode_check
      CHECK (live_wall_mode IN ('spotlight', 'mosaic', 'moments'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'memory_experiences_stage_filter_fkey') THEN
    ALTER TABLE memory_experiences
      ADD CONSTRAINT memory_experiences_stage_filter_fkey
      FOREIGN KEY (stage_filter_id, event_id, id)
      REFERENCES memory_stages(id, event_id, experience_id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- 2. memory_display_sessions: credenciais dedicadas para displays de ecrã grande
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
  CONSTRAINT memory_display_sessions_experience_fkey
    FOREIGN KEY (experience_id, event_id)
    REFERENCES memory_experiences(id, event_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS memory_display_sessions_lookup_idx
  ON memory_display_sessions (token_hash, expires_at)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS memory_display_sessions_event_idx
  ON memory_display_sessions (event_id, experience_id);

-- Privilégios mínimos estritos para memory_display_sessions
REVOKE ALL ON memory_display_sessions FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'haxr_edition_runtime') THEN
    REVOKE ALL ON memory_display_sessions FROM haxr_edition_runtime;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'edition_runtime') THEN
    REVOKE ALL ON memory_display_sessions FROM edition_runtime;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'haxrweb_runtime') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON memory_display_sessions TO haxrweb_runtime;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'neondb_owner') THEN
    GRANT ALL ON memory_display_sessions TO neondb_owner;
  END IF;
END $$;

ALTER TABLE memory_display_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS memory_display_sessions_runtime_policy ON memory_display_sessions;
CREATE POLICY memory_display_sessions_runtime_policy ON memory_display_sessions
  FOR ALL
  TO haxrweb_runtime, neondb_owner
  USING (true)
  WITH CHECK (true);

-- 3. memory_live_stream_state: coordenação monotónica por stream (event_id, experience_id)
CREATE TABLE IF NOT EXISTS memory_live_stream_state (
  event_id uuid NOT NULL,
  experience_id uuid NOT NULL,
  last_sequence_no bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, experience_id),
  CONSTRAINT memory_live_stream_state_fkey
    FOREIGN KEY (experience_id, event_id)
    REFERENCES memory_experiences(id, event_id)
    ON DELETE CASCADE
);

REVOKE ALL ON memory_live_stream_state FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'haxr_edition_runtime') THEN
    REVOKE ALL ON memory_live_stream_state FROM haxr_edition_runtime;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'edition_runtime') THEN
    REVOKE ALL ON memory_live_stream_state FROM edition_runtime;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'haxrweb_runtime') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON memory_live_stream_state TO haxrweb_runtime;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'neondb_owner') THEN
    GRANT ALL ON memory_live_stream_state TO neondb_owner;
  END IF;
END $$;

-- 4. memory_live_events: event log append-only com subject_media_id (sem cascade) para tombstones
CREATE TABLE IF NOT EXISTS memory_live_events (
  id bigserial PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  experience_id uuid NOT NULL,
  sequence_no bigint NOT NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'media_approved', 'media_hidden', 'media_deleted',
    'derivatives_ready', 'social_changed', 'comment_approved', 'stage_changed'
  )),
  subject_media_id uuid NULL,
  subject_stage_id uuid NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT memory_live_events_stream_sequence_key UNIQUE (event_id, experience_id, sequence_no),
  CONSTRAINT memory_live_events_subject_check CHECK (
    (event_type IN ('media_approved', 'media_hidden', 'media_deleted', 'derivatives_ready', 'social_changed', 'comment_approved')
      AND subject_media_id IS NOT NULL AND subject_stage_id IS NULL)
    OR
    (event_type = 'stage_changed'
      AND subject_media_id IS NULL AND subject_stage_id IS NOT NULL)
    OR
    (event_type NOT IN ('media_approved', 'media_hidden', 'media_deleted', 'derivatives_ready', 'social_changed', 'comment_approved', 'stage_changed')
      AND subject_media_id IS NULL AND subject_stage_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS memory_live_events_stream_idx
  ON memory_live_events (event_id, experience_id, sequence_no);

CREATE INDEX IF NOT EXISTS memory_live_events_created_idx
  ON memory_live_events (event_id, experience_id, created_at);

REVOKE ALL ON memory_live_events FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'haxr_edition_runtime') THEN
    REVOKE ALL ON memory_live_events FROM haxr_edition_runtime;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'edition_runtime') THEN
    REVOKE ALL ON memory_live_events FROM edition_runtime;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'haxrweb_runtime') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON memory_live_events TO haxrweb_runtime;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'neondb_owner') THEN
    GRANT ALL ON memory_live_events TO neondb_owner;
  END IF;
END $$;

ALTER TABLE memory_live_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS memory_live_events_runtime_policy ON memory_live_events;
CREATE POLICY memory_live_events_runtime_policy ON memory_live_events
  FOR ALL
  TO haxrweb_runtime, neondb_owner
  USING (true)
  WITH CHECK (true);

-- 5. Função atómica haxr_emit_live_event: atomicidade de sequence_no por stream
CREATE OR REPLACE FUNCTION haxr_emit_live_event(
  p_event_id uuid,
  p_experience_id uuid,
  p_event_type text,
  p_subject_media_id uuid DEFAULT NULL,
  p_payload jsonb DEFAULT '{}'::jsonb,
  p_subject_stage_id uuid DEFAULT NULL
) RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
$$;

REVOKE ALL ON FUNCTION haxr_emit_live_event(uuid, uuid, text, uuid, jsonb, uuid) FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'haxrweb_runtime') THEN
    GRANT EXECUTE ON FUNCTION haxr_emit_live_event(uuid, uuid, text, uuid, jsonb, uuid) TO haxrweb_runtime;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'neondb_owner') THEN
    GRANT EXECUTE ON FUNCTION haxr_emit_live_event(uuid, uuid, text, uuid, jsonb, uuid) TO neondb_owner;
  END IF;
END $$;

-- 6. Triggers em wedding_photos para captura automática de mudanças de moderação e remoção
CREATE OR REPLACE FUNCTION haxr_wedding_photos_live_events_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
$$;

DROP TRIGGER IF EXISTS trg_wedding_photos_live_events ON wedding_photos;
CREATE TRIGGER trg_wedding_photos_live_events
  AFTER INSERT OR UPDATE OF moderation_status, derivatives_status OR DELETE
  ON wedding_photos
  FOR EACH ROW
  EXECUTE FUNCTION haxr_wedding_photos_live_events_trigger();

-- 7. Função de poda segura de eventos com retenção configurável
CREATE OR REPLACE FUNCTION haxr_prune_live_events(
  p_event_id uuid,
  p_experience_id uuid,
  p_retain_count integer DEFAULT 1000,
  p_max_age_hours integer DEFAULT 48
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
$$;

REVOKE ALL ON FUNCTION haxr_prune_live_events(uuid, uuid, integer, integer) FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'haxrweb_runtime') THEN
    GRANT EXECUTE ON FUNCTION haxr_prune_live_events(uuid, uuid, integer, integer) TO haxrweb_runtime;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'neondb_owner') THEN
    GRANT EXECUTE ON FUNCTION haxr_prune_live_events(uuid, uuid, integer, integer) TO neondb_owner;
  END IF;
END $$;
