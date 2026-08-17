-- Plus Memories product layer.
-- Keeps invitation-backed and standalone projects on the same operational engine.

CREATE TABLE IF NOT EXISTS memory_experiences (
  id uuid PRIMARY KEY,
  event_slug text NOT NULL UNIQUE,
  invitation_slug text UNIQUE,
  source_type text NOT NULL
    CHECK (source_type IN ('haxr-invitation', 'standalone')),
  display_name text NOT NULL
    CHECK (char_length(display_name) BETWEEN 1 AND 120),
  event_type text NOT NULL
    CHECK (char_length(event_type) BETWEEN 1 AND 80),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'disabled', 'archived')),
  package text NOT NULL
    CHECK (package IN ('collection', 'couture', 'signature')),
  memories_variant text NOT NULL DEFAULT 'plus-memories'
    CHECK (memories_variant = 'plus-memories'),
  estimated_guest_count integer
    CHECK (estimated_guest_count IS NULL OR estimated_guest_count > 0),
  storage_slug text NOT NULL UNIQUE,
  features jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(features) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT memory_experiences_event_slug_format
    CHECK (
      char_length(event_slug) BETWEEN 3 AND 80
      AND event_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    ),
  CONSTRAINT memory_experiences_storage_slug_format
    CHECK (
      char_length(storage_slug) BETWEEN 3 AND 80
      AND storage_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    ),
  CONSTRAINT memory_experiences_source_binding
    CHECK (
      (source_type = 'haxr-invitation' AND invitation_slug IS NOT NULL)
      OR (source_type = 'standalone' AND invitation_slug IS NULL)
    )
);

CREATE TABLE IF NOT EXISTS memory_share_links (
  id uuid PRIMARY KEY,
  experience_id uuid NOT NULL
    REFERENCES memory_experiences(id) ON DELETE CASCADE,
  invitation_slug text,
  event_slug text NOT NULL,
  short_code text NOT NULL UNIQUE,
  label text,
  destination_path text,
  enabled boolean NOT NULL DEFAULT true,
  scan_count bigint NOT NULL DEFAULT 0
    CHECK (scan_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT memory_share_links_short_code_format
    CHECK (
      char_length(short_code) BETWEEN 7 AND 16
      AND short_code ~ '^[A-Za-z0-9]+$'
    ),
  CONSTRAINT memory_share_links_label_length
    CHECK (label IS NULL OR char_length(label) <= 80),
  CONSTRAINT memory_share_links_destination_length
    CHECK (destination_path IS NULL OR char_length(destination_path) <= 240),
  CONSTRAINT memory_share_links_event_slug_format
    CHECK (
      char_length(event_slug) BETWEEN 3 AND 80
      AND event_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    )
);

CREATE INDEX IF NOT EXISTS memory_share_links_experience_idx
  ON memory_share_links (experience_id, created_at DESC);

CREATE INDEX IF NOT EXISTS memory_share_links_active_lookup_idx
  ON memory_share_links (short_code)
  WHERE enabled = true;

ALTER TABLE memory_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_share_links ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON memory_experiences FROM anon, authenticated, PUBLIC;
REVOKE ALL ON memory_share_links FROM anon, authenticated, PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON memory_experiences TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON memory_share_links TO service_role;

-- Atomic scan counter and resolver. It intentionally counts scans, not people.
CREATE OR REPLACE FUNCTION public.record_memory_share_link_scan(
  p_short_code text
)
RETURNS TABLE (
  share_link_id uuid,
  experience_id uuid,
  event_slug text,
  invitation_slug text,
  source_type text,
  display_name text,
  event_type text,
  experience_status text,
  package text,
  memories_variant text,
  estimated_guest_count integer,
  storage_slug text,
  features jsonb,
  destination_path text,
  scan_count bigint
)
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  WITH bumped AS (
    UPDATE public.memory_share_links AS share_link
       SET scan_count = share_link.scan_count + 1,
           updated_at = now()
     WHERE share_link.short_code = p_short_code
       AND share_link.enabled = true
       AND EXISTS (
         SELECT 1
           FROM public.memory_experiences AS experience
          WHERE experience.id = share_link.experience_id
            AND experience.status = 'active'
       )
    RETURNING share_link.*
  )
  SELECT
    bumped.id,
    experience.id,
    experience.event_slug,
    experience.invitation_slug,
    experience.source_type,
    experience.display_name,
    experience.event_type,
    experience.status,
    experience.package,
    experience.memories_variant,
    experience.estimated_guest_count,
    experience.storage_slug,
    experience.features,
    bumped.destination_path,
    bumped.scan_count
  FROM bumped
  JOIN public.memory_experiences AS experience
    ON experience.id = bumped.experience_id;
$$;

REVOKE ALL ON FUNCTION public.record_memory_share_link_scan(text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_memory_share_link_scan(text)
  TO service_role;

-- Transactional control-plane primitive used only by the Bearer-protected API.
CREATE OR REPLACE FUNCTION public.create_memory_experience_with_share_link(
  p_experience_id uuid,
  p_event_slug text,
  p_invitation_slug text,
  p_source_type text,
  p_display_name text,
  p_event_type text,
  p_package text,
  p_estimated_guest_count integer,
  p_storage_slug text,
  p_features jsonb,
  p_share_link_id uuid,
  p_short_code text,
  p_label text,
  p_destination_path text
)
RETURNS TABLE (
  experience_id uuid,
  share_link_id uuid,
  short_code text
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.memory_experiences (
    id,
    event_slug,
    invitation_slug,
    source_type,
    display_name,
    event_type,
    status,
    package,
    memories_variant,
    estimated_guest_count,
    storage_slug,
    features
  ) VALUES (
    p_experience_id,
    p_event_slug,
    p_invitation_slug,
    p_source_type,
    p_display_name,
    p_event_type,
    'active',
    p_package,
    'plus-memories',
    p_estimated_guest_count,
    p_storage_slug,
    p_features
  );

  INSERT INTO public.memory_share_links (
    id,
    experience_id,
    invitation_slug,
    event_slug,
    short_code,
    label,
    destination_path,
    enabled
  ) VALUES (
    p_share_link_id,
    p_experience_id,
    p_invitation_slug,
    p_event_slug,
    p_short_code,
    p_label,
    p_destination_path,
    true
  );

  RETURN QUERY SELECT p_experience_id, p_share_link_id, p_short_code;
END;
$$;

REVOKE ALL ON FUNCTION public.create_memory_experience_with_share_link(
  uuid, text, text, text, text, text, text, integer, text, jsonb,
  uuid, text, text, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_memory_experience_with_share_link(
  uuid, text, text, text, text, text, text, integer, text, jsonb,
  uuid, text, text, text
) TO service_role;

COMMENT ON TABLE memory_experiences IS
  'Plus Memories projects shared by invitation-backed and standalone customers.';
COMMENT ON TABLE memory_share_links IS
  'Rotatable public entry links. scan_count records scans and is not a unique-person metric.';

-- Jessica & Samuel: official main ShareLink. The URL contains no customer PII.
INSERT INTO memory_experiences (
  id,
  event_slug,
  invitation_slug,
  source_type,
  display_name,
  event_type,
  status,
  package,
  memories_variant,
  storage_slug,
  features
) VALUES (
  '0559261a-e07c-4f94-8bf6-3230e6731f2f',
  'jessicasamuelwedding',
  'jessicasamuelwedding',
  'haxr-invitation',
  'Jessica Muege & Samuel Govene',
  'Casamento',
  'active',
  'signature',
  'plus-memories',
  'jessicasamuelwedding',
  '{"phases":true,"challenges":true,"competition":true,"voiceMessages":true,"gallery":true,"offline":true}'::jsonb
)
ON CONFLICT (event_slug) DO UPDATE SET
  invitation_slug = EXCLUDED.invitation_slug,
  source_type = EXCLUDED.source_type,
  display_name = EXCLUDED.display_name,
  event_type = EXCLUDED.event_type,
  status = EXCLUDED.status,
  package = EXCLUDED.package,
  memories_variant = EXCLUDED.memories_variant,
  storage_slug = EXCLUDED.storage_slug,
  features = EXCLUDED.features,
  updated_at = now();

INSERT INTO memory_share_links (
  id,
  experience_id,
  invitation_slug,
  event_slug,
  short_code,
  label,
  destination_path,
  enabled
) VALUES (
  '13f091ca-2b48-48fb-9458-cbff82e29ae0',
  (SELECT id FROM memory_experiences WHERE event_slug = 'jessicasamuelwedding'),
  'jessicasamuelwedding',
  'jessicasamuelwedding',
  'TsnVHSb',
  'QR Principal',
  '/jessicasamuelwedding/memorias',
  true
)
ON CONFLICT (short_code) DO NOTHING;
