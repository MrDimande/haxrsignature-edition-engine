-- Add structured metadata for "Memórias do Nosso Dia" challenges and table tracking.
-- Both columns are nullable — existing rows and the Photo Wall of jessicasamuelwedding
-- are unaffected.

ALTER TABLE wedding_photos
  ADD COLUMN IF NOT EXISTS challenge_id text,
  ADD COLUMN IF NOT EXISTS table_id text;

-- Constraints para limitação de tamanho sem IF NOT EXISTS (compatível com PG < 17)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'wedding_photos_challenge_id_len'
    ) THEN
        ALTER TABLE wedding_photos
          ADD CONSTRAINT wedding_photos_challenge_id_len
            CHECK (challenge_id IS NULL OR char_length(challenge_id) <= 20);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'wedding_photos_table_id_len'
    ) THEN
        ALTER TABLE wedding_photos
          ADD CONSTRAINT wedding_photos_table_id_len
            CHECK (table_id IS NULL OR char_length(table_id) <= 10);
    END IF;
END $$;

-- Indexes para estatísticas e filtragem por desafio e mesa
CREATE INDEX IF NOT EXISTS wedding_photos_challenge_idx
  ON wedding_photos (invitation_slug, challenge_id)
  WHERE challenge_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS wedding_photos_table_idx
  ON wedding_photos (invitation_slug, table_id)
  WHERE table_id IS NOT NULL;

COMMENT ON COLUMN wedding_photos.challenge_id IS
  'Optional challenge identifier for "Memórias" experiences (e.g. "01", "02"). NULL for free uploads and Photo Wall.';

COMMENT ON COLUMN wedding_photos.table_id IS
  'Optional table identifier from QR code (e.g. "01", "12"). NULL when not applicable.';
