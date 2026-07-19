-- Expand Photo Wall to phone photos (incl. HEIC) and short videos (MP4/MOV/WebM).
-- Limits: images <= 25MB, videos <= 100MB (bucket ceiling).

ALTER TABLE photo_upload_intents
  DROP CONSTRAINT IF EXISTS photo_upload_intents_content_type_check;

ALTER TABLE photo_upload_intents
  ADD CONSTRAINT photo_upload_intents_content_type_check
  CHECK (content_type IN (
    'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
    'video/mp4', 'video/quicktime', 'video/webm'
  ));

ALTER TABLE photo_upload_intents
  DROP CONSTRAINT IF EXISTS photo_upload_intents_declared_file_size_bytes_check;

ALTER TABLE photo_upload_intents
  ADD CONSTRAINT photo_upload_intents_declared_file_size_bytes_check
  CHECK (declared_file_size_bytes > 0 AND declared_file_size_bytes <= 104857600);

ALTER TABLE wedding_photos
  DROP CONSTRAINT IF EXISTS wedding_photos_content_type_check;

ALTER TABLE wedding_photos
  ADD CONSTRAINT wedding_photos_content_type_check
  CHECK (content_type IN (
    'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
    'video/mp4', 'video/quicktime', 'video/webm'
  ));

ALTER TABLE wedding_photos
  DROP CONSTRAINT IF EXISTS wedding_photos_file_size_bytes_check;

ALTER TABLE wedding_photos
  ADD CONSTRAINT wedding_photos_file_size_bytes_check
  CHECK (file_size_bytes > 0 AND file_size_bytes <= 104857600);

UPDATE storage.buckets
SET
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
    'video/mp4', 'video/quicktime', 'video/webm'
  ]
WHERE id = 'wedding-photos';
