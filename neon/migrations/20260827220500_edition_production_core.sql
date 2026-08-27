-- HAXR Signature Edition — surgical Neon Production core
--
-- PREPARED ONLY. Do not apply to Neon Production without an explicit cutover approval.
-- This migration intentionally contains only the database objects required by
-- the current Edition runtime (RSVP, Gifts, Memories / Photo Wall).
--
-- Deliberately NOT included:
-- - Neon Auth / Data API;
-- - Client Portal, Suppliers, Concierge, Finance, or other Business Suite objects;
-- - memory_experiences / voice memories;
-- - haxr_edition_runtime role creation or password management;
-- - Vercel environment changes.
--
-- Assumptions already true in Neon Production and verified by the Preview-vs-parent audit:
-- - public.events, public.guests, public.guest_audit_log and public.api_rate_limits exist;
-- - public.edition_gift_reservations exists;
-- - public.check_api_rate_limit(text, integer, integer) exists;
-- - public.guest_status and public.guest_source include the values used below.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Durable Memories upload intents
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.photo_upload_intents (
  id uuid PRIMARY KEY,
  invitation_slug text NOT NULL,
  bucket_name text NOT NULL,
  storage_path text NOT NULL UNIQUE,
  content_type text NOT NULL,
  declared_file_size_bytes integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  CONSTRAINT photo_upload_intents_content_type_check
    CHECK (
      content_type IN (
        'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
        'video/mp4', 'video/quicktime', 'video/webm'
      )
    ),
  CONSTRAINT photo_upload_intents_declared_file_size_bytes_check
    CHECK (
      declared_file_size_bytes > 0
      AND declared_file_size_bytes <= 104857600
    ),
  CONSTRAINT photo_upload_intents_status_check
    CHECK (status IN ('pending', 'consumed', 'expired')),
  CONSTRAINT photo_upload_intents_slug_path_prefix
    CHECK (storage_path LIKE invitation_slug || '/%'),
  CONSTRAINT photo_upload_intents_consumed_at_status
    CHECK (
      (status = 'consumed' AND consumed_at IS NOT NULL)
      OR (status <> 'consumed' AND consumed_at IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS photo_upload_intents_pending_lookup_idx
  ON public.photo_upload_intents (id, invitation_slug, bucket_name, expires_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS photo_upload_intents_expiry_idx
  ON public.photo_upload_intents (expires_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS photo_upload_intents_slug_created_idx
  ON public.photo_upload_intents (invitation_slug, created_at DESC);

ALTER TABLE public.photo_upload_intents ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.photo_upload_intents IS
  'Server-side durable upload intents for HAXR Edition Memories / Photo Wall.';

-- ---------------------------------------------------------------------------
-- 2. Memories / Photo Wall metadata
-- ---------------------------------------------------------------------------
-- This is the smallest schema required by the currently active Edition code.
-- It intentionally does not add a dependency on public.memory_experiences.

CREATE TABLE IF NOT EXISTS public.wedding_photos (
  id uuid PRIMARY KEY,
  invitation_slug text NOT NULL,
  storage_path text NOT NULL UNIQUE,
  original_filename text NOT NULL,
  content_type text NOT NULL,
  file_size_bytes integer NOT NULL,
  guest_name text,
  caption text,
  moderation_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  rejected_at timestamptz,
  challenge_id text,
  table_id text,
  participant_id uuid,
  CONSTRAINT wedding_photos_content_type_check
    CHECK (
      content_type IN (
        'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
        'video/mp4', 'video/quicktime', 'video/webm'
      )
    ),
  CONSTRAINT wedding_photos_file_size_bytes_check
    CHECK (file_size_bytes > 0 AND file_size_bytes <= 104857600),
  CONSTRAINT wedding_photos_guest_name_check
    CHECK (guest_name IS NULL OR char_length(guest_name) <= 80),
  CONSTRAINT wedding_photos_caption_check
    CHECK (caption IS NULL OR char_length(caption) <= 200),
  CONSTRAINT wedding_photos_moderation_status_check
    CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'deleted')),
  CONSTRAINT wedding_photos_challenge_id_len
    CHECK (challenge_id IS NULL OR char_length(challenge_id) <= 20),
  CONSTRAINT wedding_photos_table_id_len
    CHECK (table_id IS NULL OR char_length(table_id) <= 10),
  CONSTRAINT wedding_photos_slug_path_prefix
    CHECK (storage_path LIKE invitation_slug || '/%')
);

CREATE INDEX IF NOT EXISTS wedding_photos_moderation_idx
  ON public.wedding_photos (invitation_slug, moderation_status, created_at DESC);

CREATE INDEX IF NOT EXISTS wedding_photos_public_gallery_idx
  ON public.wedding_photos (invitation_slug, created_at DESC)
  WHERE moderation_status = 'approved';

CREATE INDEX IF NOT EXISTS wedding_photos_challenge_idx
  ON public.wedding_photos (invitation_slug, challenge_id)
  WHERE challenge_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS wedding_photos_table_idx
  ON public.wedding_photos (invitation_slug, table_id)
  WHERE table_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS wedding_photos_participant_idx
  ON public.wedding_photos (invitation_slug, participant_id)
  WHERE participant_id IS NOT NULL;

ALTER TABLE public.wedding_photos ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.wedding_photos IS
  'HAXR Edition Memories / Photo Wall metadata. Binary objects live in the selected object storage backend.';

-- ---------------------------------------------------------------------------
-- 3. Edition gift reservation RPC
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.reserve_edition_gift(
  p_registry_key text,
  p_gift_id text,
  p_reserved_by text,
  p_gift_name text DEFAULT ''::text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_reserved_by text;
  v_existing record;
  v_gift_name text;
BEGIN
  v_reserved_by := trim(coalesce(p_reserved_by, ''));
  v_gift_name := left(trim(coalesce(p_gift_name, '')), 200);

  IF coalesce(trim(p_registry_key), '') = ''
     OR coalesce(trim(p_gift_id), '') = '' THEN
    RETURN json_build_object('ok', false, 'error', 'invalid_input');
  END IF;

  IF length(v_reserved_by) < 2 THEN
    RETURN json_build_object('ok', false, 'error', 'invalid_reserved_by');
  END IF;

  SELECT reserved_by, created_at
  INTO v_existing
  FROM public.edition_gift_reservations
  WHERE registry_key = trim(p_registry_key)
    AND gift_id = trim(p_gift_id)
  LIMIT 1;

  IF FOUND THEN
    RETURN json_build_object(
      'ok', false,
      'error', 'already_reserved',
      'reservedBy', v_existing.reserved_by,
      'timestamp', v_existing.created_at
    );
  END IF;

  INSERT INTO public.edition_gift_reservations (
    registry_key,
    gift_id,
    reserved_by,
    gift_name
  ) VALUES (
    trim(p_registry_key),
    trim(p_gift_id),
    v_reserved_by,
    v_gift_name
  );

  RETURN json_build_object('ok', true);
EXCEPTION
  WHEN unique_violation THEN
    SELECT reserved_by, created_at
    INTO v_existing
    FROM public.edition_gift_reservations
    WHERE registry_key = trim(p_registry_key)
      AND gift_id = trim(p_gift_id)
    LIMIT 1;

    RETURN json_build_object(
      'ok', false,
      'error', 'already_reserved',
      'reservedBy', coalesce(v_existing.reserved_by, 'outra convidada'),
      'timestamp', v_existing.created_at
    );
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_edition_gift(text, text, text, text)
  FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- 4. QR-token helper used by Edition RSVP
-- ---------------------------------------------------------------------------
-- Uses PostgreSQL core gen_random_uuid(), avoiding an otherwise unnecessary
-- Production dependency on the pgcrypto extension.

CREATE OR REPLACE FUNCTION public.generate_guest_qr_token()
RETURNS text
LANGUAGE sql
VOLATILE
SET search_path TO 'pg_catalog'
AS $$
  SELECT pg_catalog.replace(pg_catalog.gen_random_uuid()::text, '-', '');
$$;

REVOKE ALL ON FUNCTION public.generate_guest_qr_token()
  FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- 5. Current Edition RSVP RPC (11-argument signature only)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.submit_edition_rsvp(
  p_event_id uuid,
  p_name text,
  p_name_normalized text,
  p_attending boolean,
  p_party_size integer DEFAULT 1,
  p_edition_slug text DEFAULT ''::text,
  p_email text DEFAULT ''::text,
  p_phone text DEFAULT ''::text,
  p_message_for_bride text DEFAULT ''::text,
  p_size text DEFAULT ''::text,
  p_dress_code_confirmed boolean DEFAULT NULL::boolean
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_event public.events%ROWTYPE;
  v_guest public.guests%ROWTYPE;
  v_name text;
  v_normalized text;
  v_status public.guest_status;
  v_plus_ones integer;
  v_notes text;
  v_created boolean := false;
  v_guest_id uuid;
  v_message text;
  v_size text;
BEGIN
  v_name := trim(coalesce(p_name, ''));
  v_normalized := trim(coalesce(p_name_normalized, ''));
  v_message := left(trim(coalesce(p_message_for_bride, '')), 280);
  v_size := left(trim(coalesce(p_size, '')), 12);

  IF length(v_name) < 2 THEN
    RETURN json_build_object('ok', false, 'error', 'invalid_name');
  END IF;

  IF v_normalized = '' THEN
    RETURN json_build_object('ok', false, 'error', 'invalid_name_normalized');
  END IF;

  SELECT *
  INTO v_event
  FROM public.events
  WHERE id = p_event_id
    AND is_active = true;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'event_not_found');
  END IF;

  IF p_attending THEN
    IF p_party_size IS NULL OR p_party_size < 1 OR p_party_size > 10 THEN
      RETURN json_build_object('ok', false, 'error', 'invalid_party_size');
    END IF;
    v_status := 'confirmed';
    v_plus_ones := greatest(0, p_party_size - 1);
  ELSE
    v_status := 'declined';
    v_plus_ones := 0;
  END IF;

  v_notes := trim(
    coalesce(nullif(p_edition_slug, ''), 'edition')
    || ' · convite digital · '
    || to_char(now() AT TIME ZONE 'Africa/Maputo', 'YYYY-MM-DD HH24:MI')
  );

  IF v_message <> '' THEN
    v_notes := v_notes || E'\nMensagem: ' || v_message;
  END IF;

  IF v_size <> '' THEN
    v_notes := v_notes || E'\nTamanho: ' || v_size;
  END IF;

  IF p_dress_code_confirmed IS NOT NULL THEN
    v_notes := v_notes || E'\nDress code: '
      || CASE
           WHEN p_dress_code_confirmed THEN 'confirmado (uma peça rosa)'
           ELSE 'não confirmado'
         END;
  END IF;

  SELECT *
  INTO v_guest
  FROM public.guests
  WHERE event_id = p_event_id
    AND guest_source = 'edition_rsvp'
    AND name_normalized = v_normalized
  LIMIT 1;

  IF FOUND THEN
    UPDATE public.guests
    SET
      name = v_name,
      email = coalesce(nullif(trim(p_email), ''), email),
      phone = coalesce(nullif(trim(p_phone), ''), phone),
      status = v_status,
      plus_ones = v_plus_ones,
      guest_notes = v_notes,
      updated_at = now()
    WHERE id = v_guest.id
    RETURNING id INTO v_guest_id;
  ELSE
    INSERT INTO public.guests (
      event_id,
      name,
      name_normalized,
      email,
      phone,
      qr_token,
      status,
      plus_ones,
      guest_notes,
      guest_source
    ) VALUES (
      p_event_id,
      v_name,
      v_normalized,
      coalesce(trim(p_email), ''),
      coalesce(trim(p_phone), ''),
      public.generate_guest_qr_token(),
      v_status,
      v_plus_ones,
      v_notes,
      'edition_rsvp'
    )
    RETURNING id INTO v_guest_id;

    v_created := true;
  END IF;

  INSERT INTO public.guest_audit_log (
    guest_id,
    event_id,
    guest_name,
    action,
    details
  ) VALUES (
    v_guest_id,
    p_event_id,
    v_name,
    CASE
      WHEN v_created THEN 'RSVP Edition · novo convidado'
      ELSE 'RSVP Edition · actualizado'
    END,
    CASE
      WHEN p_attending THEN
        'Confirmado via edition ('
        || coalesce(nullif(p_edition_slug, ''), 'convite')
        || ') · '
        || p_party_size::text
        || ' pessoa(s)'
        || CASE WHEN v_message <> '' THEN ' · mensagem' ELSE '' END
        || CASE WHEN v_size <> '' THEN ' · tamanho ' || v_size ELSE '' END
      ELSE
        'Declinou via edition ('
        || coalesce(nullif(p_edition_slug, ''), 'convite')
        || ')'
    END
  );

  RETURN json_build_object(
    'ok', true,
    'guestId', v_guest_id,
    'status', v_status,
    'created', v_created,
    'partySize', CASE WHEN p_attending THEN p_party_size ELSE 0 END,
    'plusOnes', v_plus_ones
  );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_edition_rsvp(
  uuid, text, text, boolean, integer, text, text, text, text, text, boolean
) FROM PUBLIC;

COMMIT;
