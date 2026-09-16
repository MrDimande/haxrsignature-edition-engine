-- ==============================================================================
-- HAXR PLUS MEMORIES — FASE 5: LEASE TOKEN OPACO & INVARIANTES DE VÍDEO
--
-- 1. derivatives_lease_token uuid único para garantir exclusividade criptográfica.
-- 2. Constrangimento estrito de integridade para vídeo:
--    media_type = 'video' AND derivatives_status = 'ready' exige poster_storage_path IS NOT NULL.
-- 3. haxr_claim_media_derivative_job gera e devolve lease_token uuid.
-- 4. haxr_finalize_media_derivative_job valida atomicamente media_id + lease_token.
-- 5. Restrição estrita de EXECUTE: apenas haxrweb_runtime (worker role operacional) e neondb_owner.
--    edition_runtime e haxr_edition_runtime e PUBLIC têm EXECUTE revogado.
-- ==============================================================================

-- 1. Coluna de token opaco de lease
ALTER TABLE wedding_photos
  ADD COLUMN IF NOT EXISTS derivatives_lease_token uuid;

-- 2. Invariante de integridade para vídeos
ALTER TABLE wedding_photos
  DROP CONSTRAINT IF EXISTS wedding_photos_derivatives_video_paths_check;

ALTER TABLE wedding_photos
  ADD CONSTRAINT wedding_photos_derivatives_video_paths_check CHECK (
    media_type != 'video' OR derivatives_status != 'ready' OR poster_storage_path IS NOT NULL
  );

-- Dropar funções prévias para permitir alteração de assinatura de OUT parameters e tipos
DROP FUNCTION IF EXISTS haxr_claim_media_derivative_job(uuid, text, integer, boolean);
DROP FUNCTION IF EXISTS haxr_finalize_media_derivative_job(uuid, text, timestamptz, text, boolean, text, text, text, integer, integer, text, numeric, text);
DROP FUNCTION IF EXISTS haxr_finalize_media_derivative_job(uuid, uuid, text, boolean, text, text, text, integer, integer, text, numeric, text);

-- 3. Função de Claim com Lease Token Opaco
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
$$;

-- 4. Função de Finalização Condicionada a Media ID + Lease Token
CREATE OR REPLACE FUNCTION haxr_finalize_media_derivative_job(
  p_media_id uuid,
  p_lease_token uuid,
  p_status text,
  p_has_derivatives boolean,
  p_thumbnail_storage_path text DEFAULT NULL,
  p_medium_storage_path text DEFAULT NULL,
  p_poster_storage_path text DEFAULT NULL,
  p_width integer DEFAULT NULL,
  p_height integer DEFAULT NULL,
  p_orientation text DEFAULT NULL,
  p_duration_seconds numeric DEFAULT NULL,
  p_error text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
$$;

-- 5. Governação de Privilégios (Worker Role Operational)
REVOKE ALL ON FUNCTION haxr_claim_media_derivative_job(uuid, text, integer, boolean) FROM PUBLIC, edition_runtime, haxr_edition_runtime;
REVOKE ALL ON FUNCTION haxr_finalize_media_derivative_job(uuid, uuid, text, boolean, text, text, text, integer, integer, text, numeric, text) FROM PUBLIC, edition_runtime, haxr_edition_runtime;

GRANT EXECUTE ON FUNCTION haxr_claim_media_derivative_job(uuid, text, integer, boolean) TO haxrweb_runtime;
GRANT EXECUTE ON FUNCTION haxr_finalize_media_derivative_job(uuid, uuid, text, boolean, text, text, text, integer, integer, text, numeric, text) TO haxrweb_runtime;
