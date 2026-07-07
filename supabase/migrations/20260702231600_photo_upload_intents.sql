-- Durable Photo Wall upload intents.
-- Review only: do not apply remotely from this workspace phase.
--
-- The application issues private Supabase Storage signed upload URLs from
-- server-side route handlers. Completion must not depend on an in-memory Map,
-- because Vercel serverless instances and cold starts cannot share that state.
-- This table is intentionally service-role only: clients never choose bucket,
-- storage path, moderation state, or final gallery records directly.

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

-- No public direct access. All insert/consume operations use server-side
-- service-role code that resolves the canonical slug, bucket, and path.
REVOKE ALL ON photo_upload_intents FROM anon, authenticated, PUBLIC;

COMMENT ON TABLE photo_upload_intents IS
  'Server-side durable upload intents for private Photo Wall uploads. No client direct writes.';

COMMENT ON COLUMN photo_upload_intents.storage_path IS
  'Server-resolved Supabase Storage path. Client-provided paths are never accepted.';

COMMENT ON COLUMN photo_upload_intents.status IS
  'pending intents are atomically consumed once during upload completion.';
