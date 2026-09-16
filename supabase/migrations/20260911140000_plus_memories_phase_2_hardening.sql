-- ==============================================================================
-- HAXR PLUS MEMORIES — FASE 2: HARDENING DE SEGURANÇA E INTEGRIDADE RELACIONAL
--
-- Objectivos Obrigatórios:
-- 1. Isolamento Cross-Experience ao nível relacional do PostgreSQL (não apenas TypeScript):
--    - memory_stages: vinculação estrita a (experience_id, event_id).
--    - wedding_photos: FK composta (stage_id, event_id, experience_id) -> memory_stages(id, event_id, experience_id).
--    - photo_upload_intents: FK composta (stage_id, event_id, experience_id) -> memory_stages(id, event_id, experience_id).
--    - memory_media_views: FKs compostas garantem que mídia, participante e visualização pertençam à mesma experiência e evento.
-- 2. RLS do Seen State (memory_media_views):
--    - Como edition_runtime e haxr_edition_runtime são papéis partilhados, a RLS distingue
--      participantes via contexto seguro de transacção: haxr_current_participant_id().
--    - SELECT, INSERT, UPDATE restringidos ao participante autenticado.
--    - Acesso administrativo (haxrweb_runtime) preservado.
-- 3. Backfill canónico da experiência de casamento tradicional e 100% de integridade.
-- ==============================================================================

-- 1. Backfill da experiência de casamento tradicional se inexistente
INSERT INTO memory_experiences (
  id, event_id, event_slug, invitation_slug, storage_slug, display_name,
  event_type, package, memories_variant, status, source_type, features,
  access_mode, visibility, uploads_enabled, competition_enabled
)
SELECT
  gen_random_uuid(),
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
  true
FROM events e
WHERE e.edition_registry_key = 'traditional-wedding'
   OR e.id = 'de277c01-ce34-4765-8655-27307c674d5d'
ON CONFLICT (event_slug) DO NOTHING;

UPDATE wedding_photos wp
SET experience_id = me.id
FROM memory_experiences me
WHERE wp.invitation_slug = 'jessicaesamueltraditionalwedding'
  AND me.event_slug = 'jessicaesamueltraditionalwedding'
  AND wp.experience_id IS NULL;

-- 2. Integridade composta em memory_experiences
ALTER TABLE memory_experiences
  DROP CONSTRAINT IF EXISTS memory_experiences_id_event_id_key;
ALTER TABLE memory_experiences
  ADD CONSTRAINT memory_experiences_id_event_id_key UNIQUE (id, event_id);

-- 3. Integridade em memory_stages
ALTER TABLE memory_stages
  DROP CONSTRAINT IF EXISTS memory_stages_experience_event_fkey;
ALTER TABLE memory_stages
  ADD CONSTRAINT memory_stages_experience_event_fkey
  FOREIGN KEY (experience_id, event_id)
  REFERENCES memory_experiences(id, event_id)
  ON DELETE CASCADE;

-- 4. Integridade em wedding_photos
ALTER TABLE wedding_photos
  DROP CONSTRAINT IF EXISTS wedding_photos_id_event_experience_key;
ALTER TABLE wedding_photos
  ADD CONSTRAINT wedding_photos_id_event_experience_key UNIQUE (id, event_id, experience_id);

ALTER TABLE wedding_photos
  DROP CONSTRAINT IF EXISTS wedding_photos_stage_event_fkey,
  DROP CONSTRAINT IF EXISTS wedding_photos_stage_event_experience_fkey;

ALTER TABLE wedding_photos
  ADD CONSTRAINT wedding_photos_stage_event_experience_fkey
  FOREIGN KEY (stage_id, event_id, experience_id)
  REFERENCES memory_stages(id, event_id, experience_id)
  ON DELETE SET NULL;

ALTER TABLE wedding_photos
  DROP CONSTRAINT IF EXISTS wedding_photos_stage_experience_check;
ALTER TABLE wedding_photos
  ADD CONSTRAINT wedding_photos_stage_experience_check
  CHECK (stage_id IS NULL OR experience_id IS NOT NULL);

-- 5. Integridade em photo_upload_intents
ALTER TABLE photo_upload_intents
  DROP CONSTRAINT IF EXISTS photo_upload_intents_stage_event_fkey,
  DROP CONSTRAINT IF EXISTS photo_upload_intents_stage_event_experience_fkey;

ALTER TABLE photo_upload_intents
  ADD CONSTRAINT photo_upload_intents_stage_event_experience_fkey
  FOREIGN KEY (stage_id, event_id, experience_id)
  REFERENCES memory_stages(id, event_id, experience_id)
  ON DELETE SET NULL;

-- 6. Integridade em memory_participants
ALTER TABLE memory_participants
  DROP CONSTRAINT IF EXISTS memory_participants_id_event_experience_key;
ALTER TABLE memory_participants
  ADD CONSTRAINT memory_participants_id_event_experience_key UNIQUE (id, event_id, experience_id);

ALTER TABLE memory_participants
  DROP CONSTRAINT IF EXISTS memory_participants_experience_event_fkey;
ALTER TABLE memory_participants
  ADD CONSTRAINT memory_participants_experience_event_fkey
  FOREIGN KEY (experience_id, event_id)
  REFERENCES memory_experiences(id, event_id)
  ON DELETE CASCADE;

-- 7. Integridade em memory_media_views
ALTER TABLE memory_media_views
  DROP CONSTRAINT IF EXISTS memory_media_views_media_event_fkey,
  DROP CONSTRAINT IF EXISTS memory_media_views_participant_event_fkey,
  DROP CONSTRAINT IF EXISTS memory_media_views_media_event_experience_fkey,
  DROP CONSTRAINT IF EXISTS memory_media_views_participant_event_experience_fkey;

ALTER TABLE memory_media_views
  ADD CONSTRAINT memory_media_views_media_event_experience_fkey
  FOREIGN KEY (media_id, event_id, experience_id)
  REFERENCES wedding_photos(id, event_id, experience_id)
  ON DELETE CASCADE,
  ADD CONSTRAINT memory_media_views_participant_event_experience_fkey
  FOREIGN KEY (participant_id, event_id, experience_id)
  REFERENCES memory_participants(id, event_id, experience_id)
  ON DELETE CASCADE;

-- 8. Função de contexto e RLS em memory_media_views
CREATE OR REPLACE FUNCTION haxr_current_participant_id() RETURNS uuid AS $$
BEGIN
  RETURN NULLIF(current_setting('haxr.current_participant_id', true), '')::uuid;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

DROP POLICY IF EXISTS memory_media_views_runtime_policy ON memory_media_views;
DROP POLICY IF EXISTS memory_media_views_admin_policy ON memory_media_views;
DROP POLICY IF EXISTS memory_media_views_guest_select_policy ON memory_media_views;
DROP POLICY IF EXISTS memory_media_views_guest_insert_policy ON memory_media_views;
DROP POLICY IF EXISTS memory_media_views_guest_update_policy ON memory_media_views;

CREATE POLICY memory_media_views_admin_policy
  ON memory_media_views
  FOR ALL
  TO haxrweb_runtime
  USING (true)
  WITH CHECK (true);

CREATE POLICY memory_media_views_guest_select_policy
  ON memory_media_views
  FOR SELECT
  TO edition_runtime, haxr_edition_runtime
  USING (
    participant_id = haxr_current_participant_id()
  );

CREATE POLICY memory_media_views_guest_insert_policy
  ON memory_media_views
  FOR INSERT
  TO edition_runtime, haxr_edition_runtime
  WITH CHECK (
    participant_id = haxr_current_participant_id()
  );

CREATE POLICY memory_media_views_guest_update_policy
  ON memory_media_views
  FOR UPDATE
  TO edition_runtime, haxr_edition_runtime
  USING (
    participant_id = haxr_current_participant_id()
  )
  WITH CHECK (
    participant_id = haxr_current_participant_id()
  );
