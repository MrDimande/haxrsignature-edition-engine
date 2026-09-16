-- ==============================================================================
-- HAXR PLUS MEMORIES — FASE 4: HARDENING DE PRIVACIDADE DE REACÇÕES
-- 1. Restrição de SELECT em memory_media_reactions para a reacção do próprio participante
-- 2. Função segura haxr_get_media_reaction_counts para agregação de contagens sem expor IDs
-- ==============================================================================

-- 1. Restringir SELECT de linhas individuais em memory_media_reactions
DROP POLICY IF EXISTS memory_media_reactions_guest_select_policy ON memory_media_reactions;
CREATE POLICY memory_media_reactions_guest_select_policy
  ON memory_media_reactions
  FOR SELECT
  TO edition_runtime, haxr_edition_runtime
  USING (participant_id = haxr_current_participant_id());

-- 2. Função segura e indexada para contagens agregadas de reacções por mídia (Zero vazamento de PII)
CREATE OR REPLACE FUNCTION haxr_get_media_reaction_counts(p_media_ids uuid[])
RETURNS TABLE (
  media_id uuid,
  reaction_type text,
  count integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT r.media_id, r.reaction_type, count(*)::integer
  FROM memory_media_reactions r
  JOIN wedding_photos wp ON wp.id = r.media_id AND wp.moderation_status = 'approved'
  WHERE r.media_id = ANY(p_media_ids)
  GROUP BY r.media_id, r.reaction_type;
$$;

REVOKE ALL ON FUNCTION haxr_get_media_reaction_counts(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION haxr_get_media_reaction_counts(uuid[]) TO edition_runtime, haxr_edition_runtime, haxrweb_runtime;
