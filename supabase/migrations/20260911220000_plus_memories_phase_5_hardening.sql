-- ==============================================================================
-- HAXR PLUS MEMORIES — FASE 5: HARDENING DE SEGURANÇA E LEASE DE DERIVADOS
--
-- 1. Remoção de UPDATE genérico em wedding_photos de edition_runtime e haxr_edition_runtime.
--    Concessão restrita a UPDATE(challenge_id) para submissões de missões.
-- 2. Invariantes estritos de estado:
--    - derivatives_status = 'ready' <-> has_derivatives = true
--    - media_type = 'image' AND derivatives_status = 'ready' -> thumbnail e medium obrigatórios
-- 3. Máquina de Lease Atómica e Recuperação de Falhas (Worker Lease / Crash Recovery):
--    - haxr_claim_media_derivative_job
--    - haxr_finalize_media_derivative_job
-- ==============================================================================

-- 1. Remoção de UPDATE genérico de wedding_photos
REVOKE UPDATE ON wedding_photos FROM edition_runtime, haxr_edition_runtime, haxrweb_runtime;

-- Concessão cirúrgica de UPDATE apenas na coluna legada challenge_id
GRANT UPDATE (challenge_id) ON wedding_photos TO edition_runtime, haxr_edition_runtime, haxrweb_runtime;

-- 2. Invariantes de Estado e Integridade de Derivados
ALTER TABLE wedding_photos
  DROP CONSTRAINT IF EXISTS wedding_photos_derivatives_status_invariants;

ALTER TABLE wedding_photos
  ADD CONSTRAINT wedding_photos_derivatives_status_invariants CHECK (
    (derivatives_status = 'ready' AND has_derivatives = true) OR
    (derivatives_status != 'ready' AND has_derivatives = false)
  );

ALTER TABLE wedding_photos
  DROP CONSTRAINT IF EXISTS wedding_photos_derivatives_image_paths_check;

ALTER TABLE wedding_photos
  ADD CONSTRAINT wedding_photos_derivatives_image_paths_check CHECK (
    (media_type != 'image') OR
    (derivatives_status != 'ready') OR
    (thumbnail_storage_path IS NOT NULL AND medium_storage_path IS NOT NULL)
  );

-- 3. Funções de Lease e Finalização Segura

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
  attempts integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_row wedding_photos%ROWTYPE;
BEGIN
  -- Se já estiver pronto e não for forçado, não reclama
  SELECT * INTO v_row
  FROM wedding_photos
  WHERE id = p_media_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF v_row.derivatives_status = 'ready' AND NOT p_force THEN
    RETURN QUERY SELECT false, v_row.id, v_row.invitation_slug, v_row.storage_path, 
                        v_row.content_type, v_row.media_type, v_row.poster_storage_path, 
                        v_row.derivatives_locked_at, v_row.derivatives_attempts;
    RETURN;
  END IF;

  -- Aquisição atómica do lease com truncamento a milissegundos
  UPDATE wedding_photos
  SET derivatives_status = 'processing',
      derivatives_locked_by = p_worker_id,
      derivatives_locked_at = date_trunc('milliseconds', clock_timestamp()),
      derivatives_attempts = wedding_photos.derivatives_attempts + 1
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
                        v_row.derivatives_locked_at, v_row.derivatives_attempts;
  ELSE
    RETURN;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION haxr_finalize_media_derivative_job(
  p_media_id uuid,
  p_worker_id text,
  p_locked_at timestamptz,
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
      derivatives_locked_by = NULL
  WHERE id = p_media_id
    AND derivatives_locked_by = p_worker_id
    AND (
      p_locked_at IS NULL
      OR abs(extract(epoch from (derivatives_locked_at - p_locked_at))) < 1.0
    );

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

-- Revogar execução pública e de convidados; conceder apenas ao runtime administrativo
REVOKE ALL ON FUNCTION haxr_claim_media_derivative_job(uuid, text, integer, boolean) FROM PUBLIC, edition_runtime, haxr_edition_runtime;
REVOKE ALL ON FUNCTION haxr_finalize_media_derivative_job(uuid, text, timestamptz, text, boolean, text, text, text, integer, integer, text, numeric, text) FROM PUBLIC, edition_runtime, haxr_edition_runtime;

GRANT EXECUTE ON FUNCTION haxr_claim_media_derivative_job(uuid, text, integer, boolean) TO haxrweb_runtime;
GRANT EXECUTE ON FUNCTION haxr_finalize_media_derivative_job(uuid, text, timestamptz, text, boolean, text, text, text, integer, integer, text, numeric, text) TO haxrweb_runtime;
