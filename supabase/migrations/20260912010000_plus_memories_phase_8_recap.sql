-- HAXR PLUS MEMORIES 2.0 — FASE 8: PÓS-EVENTO / RECAP EXPERIENCE
-- Migration: 20260912010000_plus_memories_phase_8_recap.sql
-- Ambiente: Neon Preview (little-band-06036174 / br-flat-block-ayfks0so)
-- 
-- Princípio: wedding_photos é a ÚNICA fonte canónica de media.
-- Não criar recap_photos ou duplicação de ficheiros.
-- Publicações são projecções editoriais versionadas e determinísticas.

BEGIN;

-- 1. TABELA DE PUBLICAÇÕES DE RECAP
CREATE TABLE IF NOT EXISTS memory_recap_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  experience_id UUID NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  lock_version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  title TEXT CHECK (title IS NULL OR char_length(title) <= 120),
  welcome_message TEXT CHECK (welcome_message IS NULL OR char_length(welcome_message) <= 1000),
  closing_message TEXT CHECK (closing_message IS NULL OR char_length(closing_message) <= 1000),
  access_level TEXT NOT NULL DEFAULT 'guests_only' CHECK (access_level IN ('guests_only', 'share_link_only', 'public')),
  configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Hardening 1: Selar event_id + experience_id com integridade composta
  CONSTRAINT memory_recap_publications_experience_event_fkey
    FOREIGN KEY (experience_id, event_id)
    REFERENCES memory_experiences(id, event_id)
    ON DELETE CASCADE,
  -- Versão editorial única por experiência
  CONSTRAINT memory_recap_publications_experience_version_key
    UNIQUE (experience_id, version),
  -- Identidade composta para FKs filhas
  CONSTRAINT memory_recap_publications_identity_key
    UNIQUE (id, event_id, experience_id)
);

-- Hardening 7: No máximo 1 publicação activa ('published') por experiência
CREATE UNIQUE INDEX IF NOT EXISTS memory_recap_published_experience_idx
  ON memory_recap_publications(experience_id)
  WHERE status = 'published';

-- Hardening 7: No máximo 1 rascunho ('draft') por experiência
CREATE UNIQUE INDEX IF NOT EXISTS memory_recap_draft_experience_idx
  ON memory_recap_publications(experience_id)
  WHERE status = 'draft';

-- 2. TABELA DE ITENS DE RECAP (REFERÊNCIAS EDITORIAIS A MEDIA CANÓNICA)
CREATE TABLE IF NOT EXISTS memory_recap_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id UUID NOT NULL,
  event_id UUID NOT NULL,
  experience_id UUID NOT NULL,
  media_id UUID NOT NULL,
  section TEXT NOT NULL CHECK (section IN ('hero', 'story', 'moments', 'missions', 'closing')),
  stage_id UUID,
  position INTEGER NOT NULL DEFAULT 0,
  editorial_caption TEXT CHECK (editorial_caption IS NULL OR char_length(editorial_caption) <= 300),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Vínculo à publicação
  CONSTRAINT memory_recap_items_publication_fkey
    FOREIGN KEY (publication_id, event_id, experience_id)
    REFERENCES memory_recap_publications(id, event_id, experience_id)
    ON DELETE CASCADE,
  -- Hardening 4 (Opção A): Referência multi-tenant ao Media Core canónico com cascade
  CONSTRAINT memory_recap_items_media_fkey
    FOREIGN KEY (media_id, event_id, experience_id)
    REFERENCES wedding_photos(id, event_id, experience_id)
    ON DELETE CASCADE,
  -- Hardening 3: Stage multi-tenant isolado por experiência e evento
  CONSTRAINT memory_recap_items_stage_fkey
    FOREIGN KEY (stage_id, event_id, experience_id)
    REFERENCES memory_stages(id, event_id, experience_id)
    ON DELETE SET NULL (stage_id),
  -- Não duplicar a mesma foto na mesma secção da mesma publicação
  CONSTRAINT memory_recap_items_publication_media_section_key
    UNIQUE (publication_id, media_id, section)
);

-- Hardening 2: Exclusividade do Hero — exactamente no máximo um item 'hero' por publicação
CREATE UNIQUE INDEX IF NOT EXISTS memory_recap_items_single_hero_idx
  ON memory_recap_items(publication_id)
  WHERE section = 'hero';

-- Índice de ordenação por secção e posição
CREATE INDEX IF NOT EXISTS memory_recap_items_pub_sec_pos_idx
  ON memory_recap_items(publication_id, section, position ASC);

-- 3. EXPANSÃO DE SCOPES DE SHARE LINK
-- Hardening 10 & 11: Suportar 'recap:view' mantendo isolamento estrito
ALTER TABLE memory_share_links DROP CONSTRAINT IF EXISTS memory_share_links_scope_type_check;
ALTER TABLE memory_share_links ADD CONSTRAINT memory_share_links_scope_type_check
  CHECK (scope_type = ANY (ARRAY['general'::text, 'guest'::text, 'table'::text, 'recap:view'::text]));

-- 4. PRIVILÉGIOS LEAST-PRIVILEGE
GRANT SELECT, INSERT, UPDATE, DELETE ON memory_recap_publications TO neondb_owner;
GRANT SELECT, INSERT, UPDATE, DELETE ON memory_recap_items TO neondb_owner;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'haxrweb_runtime') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON memory_recap_publications TO haxrweb_runtime;
    GRANT SELECT, INSERT, UPDATE, DELETE ON memory_recap_items TO haxrweb_runtime;
  END IF;
END $$;

COMMIT;
