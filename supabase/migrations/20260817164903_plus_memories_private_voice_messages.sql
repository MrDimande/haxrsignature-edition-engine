-- Private host-only voice messages associated with an existing memory.

CREATE TABLE IF NOT EXISTS memory_voice_upload_intents (
  id uuid PRIMARY KEY,
  experience_id uuid NOT NULL
    REFERENCES memory_experiences(id) ON DELETE CASCADE,
  event_slug text NOT NULL,
  invitation_slug text,
  photo_id uuid NOT NULL
    REFERENCES wedding_photos(id) ON DELETE CASCADE,
  participant_id uuid,
  guest_name text,
  bucket_name text NOT NULL,
  storage_path text NOT NULL UNIQUE,
  content_type text NOT NULL
    CHECK (content_type IN ('audio/webm', 'audio/mp4', 'audio/ogg', 'audio/mpeg')),
  declared_file_size_bytes bigint NOT NULL
    CHECK (declared_file_size_bytes > 0 AND declared_file_size_bytes <= 10485760),
  declared_duration_seconds integer NOT NULL
    CHECK (declared_duration_seconds BETWEEN 1 AND 45),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'consumed', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  CONSTRAINT memory_voice_upload_intents_path_prefix
    CHECK (storage_path LIKE event_slug || '/voice/%'),
  CONSTRAINT memory_voice_upload_intents_guest_name_length
    CHECK (guest_name IS NULL OR char_length(guest_name) <= 80),
  CONSTRAINT memory_voice_upload_intents_consumed_status
    CHECK (
      (status = 'consumed' AND consumed_at IS NOT NULL)
      OR (status <> 'consumed' AND consumed_at IS NULL)
    )
);

CREATE TABLE IF NOT EXISTS memory_voice_messages (
  id uuid PRIMARY KEY,
  experience_id uuid NOT NULL
    REFERENCES memory_experiences(id) ON DELETE CASCADE,
  event_slug text NOT NULL,
  invitation_slug text,
  photo_id uuid NOT NULL
    REFERENCES wedding_photos(id) ON DELETE CASCADE,
  participant_id uuid,
  guest_name text,
  storage_path text NOT NULL UNIQUE,
  content_type text NOT NULL
    CHECK (content_type IN ('audio/webm', 'audio/mp4', 'audio/ogg', 'audio/mpeg')),
  duration_seconds integer
    CHECK (duration_seconds IS NULL OR duration_seconds BETWEEN 1 AND 45),
  file_size_bytes bigint NOT NULL
    CHECK (file_size_bytes > 0 AND file_size_bytes <= 10485760),
  visibility text NOT NULL DEFAULT 'hosts-only'
    CHECK (visibility = 'hosts-only'),
  moderation_status text NOT NULL DEFAULT 'pending'
    CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT memory_voice_messages_guest_name_length
    CHECK (guest_name IS NULL OR char_length(guest_name) <= 80)
);

CREATE INDEX IF NOT EXISTS memory_voice_upload_intents_pending_idx
  ON memory_voice_upload_intents (id, experience_id, expires_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS memory_voice_messages_experience_idx
  ON memory_voice_messages (experience_id, created_at DESC);

CREATE INDEX IF NOT EXISTS memory_voice_messages_photo_idx
  ON memory_voice_messages (photo_id, created_at DESC);

CREATE INDEX IF NOT EXISTS memory_voice_messages_moderation_idx
  ON memory_voice_messages (experience_id, moderation_status, created_at DESC);

ALTER TABLE memory_voice_upload_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_voice_messages ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON memory_voice_upload_intents FROM anon, authenticated, PUBLIC;
REVOKE ALL ON memory_voice_messages FROM anon, authenticated, PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON memory_voice_upload_intents TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON memory_voice_messages TO service_role;

COMMENT ON TABLE memory_voice_upload_intents IS
  'Durable server-issued upload intents for private Plus Memories voice messages.';
COMMENT ON TABLE memory_voice_messages IS
  'Host-only voice memories. These rows must never be returned by the public gallery API.';
COMMENT ON COLUMN memory_voice_messages.photo_id IS
  'Required parent memory. Cross-event associations are validated server-side before upload.';
