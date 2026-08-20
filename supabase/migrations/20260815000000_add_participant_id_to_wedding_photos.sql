-- Add participant_id uuid column for "Explorador da Noite" competition in Plus Memories.
-- Nullable, backwards-compatible, no impact on Photo Wall or Traditional Memories.

ALTER TABLE wedding_photos
  ADD COLUMN IF NOT EXISTS participant_id uuid NULL;

-- Index for leaderboard aggregation by invitation_slug and participant_id
CREATE INDEX IF NOT EXISTS wedding_photos_participant_idx
  ON wedding_photos (invitation_slug, participant_id)
  WHERE participant_id IS NOT NULL;

COMMENT ON COLUMN wedding_photos.participant_id IS
  'Anonymous persistent participant UUID for "Explorador da Noite" competition in Plus Memories. NULL for non-participants, free uploads, traditional memories, and Photo Wall.';
