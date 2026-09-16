-- ==============================================================================
-- HAXR PLUS MEMORIES — FASE 4: SOCIAL PRIVADO & ENGAJAMENTO
-- 1. REACÇÕES PRIVADAS AO EVENTO (memory_media_reactions)
-- 2. FAVORITOS ESTREITAMENTE PRIVADOS (memory_media_favorites)
-- 3. COMENTÁRIOS MODERADOS (memory_media_comments)
-- 4. POLÍTICA DE MODERAÇÃO DE COMENTÁRIOS EM memory_experiences
-- 5. POLÍTICAS RLS ROBUSTAS POR PAPEL RUNTIME
-- ==============================================================================

-- 0. Evolução em memory_experiences: política de moderação de comentários
ALTER TABLE memory_experiences
  ADD COLUMN IF NOT EXISTS comments_auto_approve boolean NOT NULL DEFAULT true;

-- 1. Tabela memory_media_reactions
CREATE TABLE IF NOT EXISTS memory_media_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  experience_id uuid NOT NULL,
  media_id uuid NOT NULL,
  participant_id uuid NOT NULL,
  reaction_type text NOT NULL CHECK (reaction_type IN ('love', 'applause', 'champagne', 'elegance', 'toast')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT memory_media_reactions_participant_media_key UNIQUE (participant_id, media_id),
  CONSTRAINT memory_media_reactions_composite_identity_key UNIQUE (id, event_id, experience_id),
  CONSTRAINT memory_media_reactions_media_event_experience_fkey
    FOREIGN KEY (media_id, event_id, experience_id)
    REFERENCES wedding_photos(id, event_id, experience_id)
    ON DELETE CASCADE,
  CONSTRAINT memory_media_reactions_participant_event_experience_fkey
    FOREIGN KEY (participant_id, event_id, experience_id)
    REFERENCES memory_participants(id, event_id, experience_id)
    ON DELETE CASCADE,
  CONSTRAINT memory_media_reactions_experience_event_fkey
    FOREIGN KEY (experience_id, event_id)
    REFERENCES memory_experiences(id, event_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS memory_media_reactions_media_type_idx
  ON memory_media_reactions (media_id, reaction_type);

CREATE INDEX IF NOT EXISTS memory_media_reactions_participant_idx
  ON memory_media_reactions (participant_id, media_id);

-- 2. Tabela memory_media_favorites (ESTRITAMENTE PRIVADA)
CREATE TABLE IF NOT EXISTS memory_media_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  experience_id uuid NOT NULL,
  media_id uuid NOT NULL,
  participant_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT memory_media_favorites_participant_media_key UNIQUE (participant_id, media_id),
  CONSTRAINT memory_media_favorites_composite_identity_key UNIQUE (id, event_id, experience_id),
  CONSTRAINT memory_media_favorites_media_event_experience_fkey
    FOREIGN KEY (media_id, event_id, experience_id)
    REFERENCES wedding_photos(id, event_id, experience_id)
    ON DELETE CASCADE,
  CONSTRAINT memory_media_favorites_participant_event_experience_fkey
    FOREIGN KEY (participant_id, event_id, experience_id)
    REFERENCES memory_participants(id, event_id, experience_id)
    ON DELETE CASCADE,
  CONSTRAINT memory_media_favorites_experience_event_fkey
    FOREIGN KEY (experience_id, event_id)
    REFERENCES memory_experiences(id, event_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS memory_media_favorites_participant_created_idx
  ON memory_media_favorites (participant_id, created_at DESC);

-- 3. Tabela memory_media_comments
CREATE TABLE IF NOT EXISTS memory_media_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  experience_id uuid NOT NULL,
  media_id uuid NOT NULL,
  participant_id uuid NOT NULL,
  body text NOT NULL CHECK (length(trim(body)) >= 1 AND length(body) <= 500),
  status text NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected', 'hidden', 'deleted')),
  moderated_at timestamptz NULL,
  moderated_by uuid NULL,
  rejection_reason text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT memory_media_comments_composite_identity_key UNIQUE (id, event_id, experience_id),
  CONSTRAINT memory_media_comments_media_event_experience_fkey
    FOREIGN KEY (media_id, event_id, experience_id)
    REFERENCES wedding_photos(id, event_id, experience_id)
    ON DELETE CASCADE,
  CONSTRAINT memory_media_comments_participant_event_experience_fkey
    FOREIGN KEY (participant_id, event_id, experience_id)
    REFERENCES memory_participants(id, event_id, experience_id)
    ON DELETE CASCADE,
  CONSTRAINT memory_media_comments_experience_event_fkey
    FOREIGN KEY (experience_id, event_id)
    REFERENCES memory_experiences(id, event_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS memory_media_comments_media_approved_idx
  ON memory_media_comments (media_id, created_at ASC)
  WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS memory_media_comments_participant_idx
  ON memory_media_comments (participant_id, created_at DESC);

-- 4. Permissões e RLS: memory_media_reactions
GRANT SELECT, INSERT, UPDATE, DELETE ON memory_media_reactions TO edition_runtime, haxr_edition_runtime;
GRANT ALL ON memory_media_reactions TO haxrweb_runtime;
ALTER TABLE memory_media_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS memory_media_reactions_admin_policy ON memory_media_reactions;
CREATE POLICY memory_media_reactions_admin_policy
  ON memory_media_reactions
  FOR ALL
  TO haxrweb_runtime
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS memory_media_reactions_guest_select_policy ON memory_media_reactions;
CREATE POLICY memory_media_reactions_guest_select_policy
  ON memory_media_reactions
  FOR SELECT
  TO edition_runtime, haxr_edition_runtime
  USING (true);

DROP POLICY IF EXISTS memory_media_reactions_guest_insert_policy ON memory_media_reactions;
CREATE POLICY memory_media_reactions_guest_insert_policy
  ON memory_media_reactions
  FOR INSERT
  TO edition_runtime, haxr_edition_runtime
  WITH CHECK (participant_id = haxr_current_participant_id());

DROP POLICY IF EXISTS memory_media_reactions_guest_update_policy ON memory_media_reactions;
CREATE POLICY memory_media_reactions_guest_update_policy
  ON memory_media_reactions
  FOR UPDATE
  TO edition_runtime, haxr_edition_runtime
  USING (participant_id = haxr_current_participant_id())
  WITH CHECK (participant_id = haxr_current_participant_id());

DROP POLICY IF EXISTS memory_media_reactions_guest_delete_policy ON memory_media_reactions;
CREATE POLICY memory_media_reactions_guest_delete_policy
  ON memory_media_reactions
  FOR DELETE
  TO edition_runtime, haxr_edition_runtime
  USING (participant_id = haxr_current_participant_id());

-- 5. Permissões e RLS: memory_media_favorites (100% PRIVADOS)
GRANT SELECT, INSERT, DELETE ON memory_media_favorites TO edition_runtime, haxr_edition_runtime;
GRANT ALL ON memory_media_favorites TO haxrweb_runtime;
ALTER TABLE memory_media_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS memory_media_favorites_admin_policy ON memory_media_favorites;
CREATE POLICY memory_media_favorites_admin_policy
  ON memory_media_favorites
  FOR ALL
  TO haxrweb_runtime
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS memory_media_favorites_guest_select_policy ON memory_media_favorites;
CREATE POLICY memory_media_favorites_guest_select_policy
  ON memory_media_favorites
  FOR SELECT
  TO edition_runtime, haxr_edition_runtime
  USING (participant_id = haxr_current_participant_id());

DROP POLICY IF EXISTS memory_media_favorites_guest_insert_policy ON memory_media_favorites;
CREATE POLICY memory_media_favorites_guest_insert_policy
  ON memory_media_favorites
  FOR INSERT
  TO edition_runtime, haxr_edition_runtime
  WITH CHECK (participant_id = haxr_current_participant_id());

DROP POLICY IF EXISTS memory_media_favorites_guest_delete_policy ON memory_media_favorites;
CREATE POLICY memory_media_favorites_guest_delete_policy
  ON memory_media_favorites
  FOR DELETE
  TO edition_runtime, haxr_edition_runtime
  USING (participant_id = haxr_current_participant_id());

-- 6. Permissões e RLS: memory_media_comments
GRANT SELECT, INSERT, UPDATE, DELETE ON memory_media_comments TO edition_runtime, haxr_edition_runtime;
GRANT ALL ON memory_media_comments TO haxrweb_runtime;
ALTER TABLE memory_media_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS memory_media_comments_admin_policy ON memory_media_comments;
CREATE POLICY memory_media_comments_admin_policy
  ON memory_media_comments
  FOR ALL
  TO haxrweb_runtime
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS memory_media_comments_guest_select_policy ON memory_media_comments;
CREATE POLICY memory_media_comments_guest_select_policy
  ON memory_media_comments
  FOR SELECT
  TO edition_runtime, haxr_edition_runtime
  USING (status = 'approved' OR participant_id = haxr_current_participant_id());

DROP POLICY IF EXISTS memory_media_comments_guest_insert_policy ON memory_media_comments;
CREATE POLICY memory_media_comments_guest_insert_policy
  ON memory_media_comments
  FOR INSERT
  TO edition_runtime, haxr_edition_runtime
  WITH CHECK (participant_id = haxr_current_participant_id());

DROP POLICY IF EXISTS memory_media_comments_guest_update_policy ON memory_media_comments;
CREATE POLICY memory_media_comments_guest_update_policy
  ON memory_media_comments
  FOR UPDATE
  TO edition_runtime, haxr_edition_runtime
  USING (participant_id = haxr_current_participant_id())
  WITH CHECK (participant_id = haxr_current_participant_id());

DROP POLICY IF EXISTS memory_media_comments_guest_delete_policy ON memory_media_comments;
CREATE POLICY memory_media_comments_guest_delete_policy
  ON memory_media_comments
  FOR DELETE
  TO edition_runtime, haxr_edition_runtime
  USING (participant_id = haxr_current_participant_id());

-- 7. Função de Moderação de Comentários
DROP FUNCTION IF EXISTS haxr_moderate_media_comment(uuid, text, uuid, text);
CREATE OR REPLACE FUNCTION haxr_moderate_media_comment(
  p_comment_id uuid,
  p_new_status text,
  p_moderated_by uuid DEFAULT NULL,
  p_rejection_reason text DEFAULT NULL
)
RETURNS TABLE (
  comment_id uuid,
  previous_status text,
  new_status text,
  is_transition boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
$$;

REVOKE ALL ON FUNCTION haxr_moderate_media_comment(uuid, text, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION haxr_moderate_media_comment(uuid, text, uuid, text) TO edition_runtime, haxr_edition_runtime, haxrweb_runtime;
