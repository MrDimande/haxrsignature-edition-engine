-- ==============================================================================
-- HAXR PLUS MEMORIES 2.0 — FASE 6: OFFLINE RESILIENCE & RELIABLE UPLOAD QUEUE
-- Migração: Idempotência Server-side via client_upload_id UUID
--
-- Target Neon Preview Branch: preview/plus-memories-2-phase-1b (br-flat-block-ayfks0so)
-- Baseline preservado: 147 media items
-- ==============================================================================

-- 1. Coluna client_upload_id em photo_upload_intents
ALTER TABLE photo_upload_intents
  ADD COLUMN IF NOT EXISTS client_upload_id uuid NULL;

-- 2. Índice único parcial para photo_upload_intents (Session Mode)
-- Garante exactamente 1 intent por tuplo (event_id, experience_id, participant_id, client_upload_id)
CREATE UNIQUE INDEX IF NOT EXISTS photo_upload_intents_client_upload_id_idx
  ON photo_upload_intents (event_id, experience_id, participant_id, client_upload_id)
  WHERE client_upload_id IS NOT NULL;

-- 3. Coluna client_upload_id em wedding_photos
ALTER TABLE wedding_photos
  ADD COLUMN IF NOT EXISTS client_upload_id uuid NULL;

-- 4. Índice único parcial para wedding_photos (Session Mode)
-- Barreira física de integridade relacional: previne duplicação mesmo sob concorrência multi-tab
CREATE UNIQUE INDEX IF NOT EXISTS wedding_photos_client_upload_id_idx
  ON wedding_photos (event_id, experience_id, participant_id, client_upload_id)
  WHERE client_upload_id IS NOT NULL;

-- 5. Privilégios mínimos para a role operacional haxrweb_runtime
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'haxrweb_runtime') THEN
    GRANT SELECT (client_upload_id), INSERT (client_upload_id) ON photo_upload_intents TO haxrweb_runtime;
    GRANT UPDATE (expires_at) ON photo_upload_intents TO haxrweb_runtime;
    GRANT SELECT (client_upload_id), INSERT (client_upload_id) ON wedding_photos TO haxrweb_runtime;
  END IF;
END $$;

-- 6. Ajustar limite de wedding_photos_challenge_id_len para suportar missões modernas (UUID / slugs até 64 caracteres)
ALTER TABLE wedding_photos
  DROP CONSTRAINT IF EXISTS wedding_photos_challenge_id_len;

ALTER TABLE wedding_photos
  ADD CONSTRAINT wedding_photos_challenge_id_len
    CHECK (challenge_id IS NULL OR char_length(challenge_id) <= 64);

-- 7. Defesa de integridade: client_upload_id pertence exclusivamente ao session mode
ALTER TABLE photo_upload_intents
  DROP CONSTRAINT IF EXISTS photo_upload_intents_client_upload_id_session_invariant;

ALTER TABLE photo_upload_intents
  ADD CONSTRAINT photo_upload_intents_client_upload_id_session_invariant
    CHECK (client_upload_id IS NULL OR (event_id IS NOT NULL AND experience_id IS NOT NULL AND participant_id IS NOT NULL));

ALTER TABLE wedding_photos
  DROP CONSTRAINT IF EXISTS wedding_photos_client_upload_id_session_invariant;

ALTER TABLE wedding_photos
  ADD CONSTRAINT wedding_photos_client_upload_id_session_invariant
    CHECK (client_upload_id IS NULL OR (event_id IS NOT NULL AND experience_id IS NOT NULL AND participant_id IS NOT NULL));


