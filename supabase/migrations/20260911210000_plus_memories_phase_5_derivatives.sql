-- ==============================================================================
-- HAXR PLUS MEMORIES — FASE 5: MEDIA DERIVATIVES PIPELINE & PERFORMANCE HARDENING
--
-- 1. wedding_photos continua como Media Core (sem tabela paralela de media).
-- 2. Suporte estrutural a derivados de alta-costura digital:
--    - thumbnail_storage_path: grid e previews de baixa largura de banda (WebP)
--    - medium_storage_path: visualização de alta qualidade no Story Viewer (WebP)
--    - poster_storage_path: poster frame de vídeos
-- 3. Máquina de estados explícita: pending | processing | ready | failed
-- 4. Suporte a bloqueio atómico (pessimistic lock) para processamento assíncrono e retry
-- 5. Preservação estrita das 147 mídias legadas (has_derivatives=false)
-- ==============================================================================

ALTER TABLE wedding_photos
  ADD COLUMN IF NOT EXISTS medium_storage_path text,
  ADD COLUMN IF NOT EXISTS derivatives_status text NOT NULL DEFAULT 'pending' 
    CHECK (derivatives_status IN ('pending', 'processing', 'ready', 'failed')),
  ADD COLUMN IF NOT EXISTS has_derivatives boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS derivatives_error text,
  ADD COLUMN IF NOT EXISTS derivatives_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS derivatives_processed_at timestamptz,
  ADD COLUMN IF NOT EXISTS derivatives_locked_at timestamptz,
  ADD COLUMN IF NOT EXISTS derivatives_locked_by text;

-- Índices de alta performance para consulta em lote e fila assíncrona de derivados
CREATE INDEX IF NOT EXISTS wedding_photos_derivatives_status_idx 
  ON wedding_photos(derivatives_status, created_at);

CREATE INDEX IF NOT EXISTS wedding_photos_has_derivatives_event_idx 
  ON wedding_photos(has_derivatives, event_id);

-- Permissões para as roles de runtime da plataforma
GRANT SELECT, UPDATE ON wedding_photos TO edition_runtime, haxr_edition_runtime, haxrweb_runtime;
