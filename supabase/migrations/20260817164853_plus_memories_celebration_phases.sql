-- Celebration chapters for Plus Memories.
-- Nullable columns keep all existing Traditional Memories and Photo Wall rows valid.

ALTER TABLE wedding_photos
  ADD COLUMN IF NOT EXISTS experience_id uuid,
  ADD COLUMN IF NOT EXISTS phase_id text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname = 'wedding_photos_experience_id_fkey'
  ) THEN
    ALTER TABLE wedding_photos
      ADD CONSTRAINT wedding_photos_experience_id_fkey
      FOREIGN KEY (experience_id)
      REFERENCES memory_experiences(id)
      ON DELETE SET NULL
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname = 'wedding_photos_phase_id_format'
  ) THEN
    ALTER TABLE wedding_photos
      ADD CONSTRAINT wedding_photos_phase_id_format
      CHECK (
        phase_id IS NULL
        OR (
          char_length(phase_id) BETWEEN 1 AND 40
          AND phase_id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
        )
      );
  END IF;
END $$;

ALTER TABLE wedding_photos
  VALIDATE CONSTRAINT wedding_photos_experience_id_fkey;

CREATE INDEX IF NOT EXISTS wedding_photos_experience_idx
  ON wedding_photos (experience_id, created_at DESC)
  WHERE experience_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS wedding_photos_phase_idx
  ON wedding_photos (invitation_slug, phase_id, created_at DESC)
  WHERE phase_id IS NOT NULL;

ALTER TABLE photo_upload_intents
  ADD COLUMN IF NOT EXISTS experience_id uuid
    REFERENCES memory_experiences(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS photo_upload_intents_experience_idx
  ON photo_upload_intents (experience_id, created_at DESC)
  WHERE experience_id IS NOT NULL;

COMMENT ON COLUMN wedding_photos.experience_id IS
  'Optional Plus Memories project identity. NULL preserves pre-project and Photo Wall rows.';
COMMENT ON COLUMN wedding_photos.phase_id IS
  'Server-derived celebration phase. NULL for legacy rows and memories without a selected phase.';
