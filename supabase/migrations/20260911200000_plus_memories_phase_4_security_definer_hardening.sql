-- ==============================================================================
-- HAXR PLUS MEMORIES — FASE 4: SECURITY DEFINER HARDENING DE CONTAGENS DE REACÇÃO
-- 1. Restringe haxr_get_media_reaction_counts estritamente ao contexto do participante actual:
--    haxr_current_participant_id() -> participant -> event_id & experience_id -> wedding_photos
-- 2. photo.event_id = participant.event_id E photo.experience_id = participant.experience_id
-- 3. Regra canónica de publicação: photo.moderation_status = 'approved' E experience.status = 'active'
-- 4. Isolamento estrito cross-event e cross-experience (Zero vazamento entre eventos/experiências)
-- 5. Revogação de EXECUTE para PUBLIC; concessão restrita a edition_runtime, haxr_edition_runtime, haxrweb_runtime
-- ==============================================================================

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
$$;

REVOKE ALL ON FUNCTION haxr_get_media_reaction_counts(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION haxr_get_media_reaction_counts(uuid[]) TO edition_runtime, haxr_edition_runtime, haxrweb_runtime;
