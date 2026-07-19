-- Durable Photo Wall upload intents + wedding_photos gallery.
-- Service-role only: clients never write directly.

CREATE TABLE IF NOT EXISTS photo_upload_intents (
  id uuid PRIMARY KEY,
  invitation_slug text NOT NULL,
  bucket_name text NOT NULL,
  storage_path text NOT NULL UNIQUE,
  content_type text NOT NULL
    CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp')),
  declared_file_size_bytes integer NOT NULL
    CHECK (declared_file_size_bytes > 0 AND declared_file_size_bytes <= 5242880),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'consumed', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  CONSTRAINT photo_upload_intents_slug_path_prefix
    CHECK (storage_path LIKE invitation_slug || '/%'),
  CONSTRAINT photo_upload_intents_consumed_at_status
    CHECK (
      (status = 'consumed' AND consumed_at IS NOT NULL)
      OR (status <> 'consumed' AND consumed_at IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS photo_upload_intents_pending_lookup_idx
  ON photo_upload_intents (id, invitation_slug, bucket_name, expires_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS photo_upload_intents_expiry_idx
  ON photo_upload_intents (expires_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS photo_upload_intents_slug_created_idx
  ON photo_upload_intents (invitation_slug, created_at DESC);

ALTER TABLE photo_upload_intents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON photo_upload_intents FROM anon, authenticated, PUBLIC;

COMMENT ON TABLE photo_upload_intents IS
  'Server-side durable upload intents for private Photo Wall uploads. No client direct writes.';

CREATE TABLE IF NOT EXISTS wedding_photos (
  id uuid PRIMARY KEY,
  invitation_slug text NOT NULL,
  storage_path text NOT NULL UNIQUE,
  original_filename text NOT NULL,
  content_type text NOT NULL
    CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp')),
  file_size_bytes integer NOT NULL
    CHECK (file_size_bytes > 0 AND file_size_bytes <= 5242880),
  guest_name text,
  caption text,
  moderation_status text NOT NULL DEFAULT 'pending'
    CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'deleted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  rejected_at timestamptz,
  CONSTRAINT wedding_photos_slug_path_prefix
    CHECK (storage_path LIKE invitation_slug || '/%'),
  CONSTRAINT wedding_photos_guest_name_len
    CHECK (guest_name IS NULL OR char_length(guest_name) <= 80),
  CONSTRAINT wedding_photos_caption_len
    CHECK (caption IS NULL OR char_length(caption) <= 200)
);

CREATE INDEX IF NOT EXISTS wedding_photos_public_gallery_idx
  ON wedding_photos (invitation_slug, created_at DESC)
  WHERE moderation_status = 'approved';

CREATE INDEX IF NOT EXISTS wedding_photos_moderation_idx
  ON wedding_photos (invitation_slug, moderation_status, created_at DESC);

ALTER TABLE wedding_photos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON wedding_photos FROM anon, authenticated, PUBLIC;

COMMENT ON TABLE wedding_photos IS
  'Guest wedding photos for Jessica & Samuel Photo Wall. Public reads only via approved signed URLs.';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'wedding-photos',
  'wedding-photos',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
