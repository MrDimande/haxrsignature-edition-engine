-- Allow the existing private memories bucket to receive the voice formats
-- already accepted and validated by the Plus Memories API.

UPDATE storage.buckets
SET allowed_mime_types = (
  SELECT array_agg(mime_type ORDER BY mime_type)
  FROM (
    SELECT DISTINCT unnest(
      COALESCE(allowed_mime_types, ARRAY[]::text[])
      || ARRAY['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/mpeg']::text[]
    ) AS mime_type
  ) AS allowed_types
)
WHERE id = 'wedding-photos';
