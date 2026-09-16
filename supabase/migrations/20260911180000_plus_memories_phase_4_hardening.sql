-- ==============================================================================
-- HAXR PLUS MEMORIES — FASE 4: SOCIAL PRIVADO & ENGAJAMENTO (HARDENING)
-- 1. Revogação de privilégios de moderação para papéis de convidados (edition_runtime)
-- 2. Triggers de integridade de moderação e protecção contra bypass de status
-- 3. Imutabilidade de chaves relacionais em reacções e comentários
-- 4. Garantia de search_path seguro em todas as funções da Fase 4
-- ==============================================================================

-- 1. Restrição de execução da função de moderação exclusivamente a administradores
REVOKE ALL ON FUNCTION haxr_moderate_media_comment(uuid, text, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION haxr_moderate_media_comment(uuid, text, uuid, text) FROM edition_runtime, haxr_edition_runtime;
GRANT EXECUTE ON FUNCTION haxr_moderate_media_comment(uuid, text, uuid, text) TO haxrweb_runtime;

-- 2. Trigger para garantir que inserções de convidados respeitam comments_auto_approve
CREATE OR REPLACE FUNCTION haxr_enforce_comment_insert_policy()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
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
$$;

DROP TRIGGER IF EXISTS trg_enforce_comment_insert_policy ON memory_media_comments;
CREATE TRIGGER trg_enforce_comment_insert_policy
  BEFORE INSERT ON memory_media_comments
  FOR EACH ROW
  EXECUTE FUNCTION haxr_enforce_comment_insert_policy();

-- 3. Trigger para impedir que convidados alterem o status de moderação de comentários existentes
CREATE OR REPLACE FUNCTION haxr_protect_comment_moderation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
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
$$;

DROP TRIGGER IF EXISTS trg_protect_comment_moderation ON memory_media_comments;
CREATE TRIGGER trg_protect_comment_moderation
  BEFORE UPDATE ON memory_media_comments
  FOR EACH ROW
  EXECUTE FUNCTION haxr_protect_comment_moderation();

-- 4. Trigger para imutabilidade de chaves relacionais em reacções
CREATE OR REPLACE FUNCTION haxr_protect_reaction_keys()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
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
$$;

DROP TRIGGER IF EXISTS trg_protect_reaction_keys ON memory_media_reactions;
CREATE TRIGGER trg_protect_reaction_keys
  BEFORE UPDATE ON memory_media_reactions
  FOR EACH ROW
  EXECUTE FUNCTION haxr_protect_reaction_keys();

-- 5. Revogar UPDATE em favoritos para edition_runtime (favoritos são apenas toggle INSERT/DELETE)
REVOKE UPDATE ON memory_media_favorites FROM edition_runtime, haxr_edition_runtime;
