-- HAXR Signature Edition — Neon Production runtime permissions
--
-- PREPARED ONLY. Do not apply to Neon Production without an explicit cutover approval.
--
-- REQUIRED PRE-STEP:
-- Create haxr_edition_runtime in Neon Production with a strong password and
-- these safe attributes:
--   LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS
--
-- This migration deliberately does NOT create or alter the role password.
-- It refuses to continue if the role is absent or has unsafe attributes.

BEGIN;

DO $$
DECLARE
  runtime_role record;
BEGIN
  SELECT
    rolsuper,
    rolinherit,
    rolcreaterole,
    rolcreatedb,
    rolcanlogin,
    rolreplication,
    rolbypassrls
  INTO runtime_role
  FROM pg_roles
  WHERE rolname = 'haxr_edition_runtime';

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'haxr_edition_runtime does not exist; create it with a Production-only password before applying this migration';
  END IF;

  IF runtime_role.rolsuper
     OR runtime_role.rolinherit
     OR runtime_role.rolcreaterole
     OR runtime_role.rolcreatedb
     OR NOT runtime_role.rolcanlogin
     OR runtime_role.rolreplication
     OR runtime_role.rolbypassrls THEN
    RAISE EXCEPTION
      'haxr_edition_runtime exists with unsafe role attributes; refusing to continue';
  END IF;
END
$$;

-- Schema boundary.
REVOKE CREATE ON SCHEMA public FROM haxr_edition_runtime;
GRANT USAGE ON SCHEMA public TO haxr_edition_runtime;

-- Direct table privileges used by the Edition runtime.
GRANT SELECT
  ON TABLE public.edition_gift_reservations
  TO haxr_edition_runtime;

GRANT SELECT
  ON TABLE public.guests
  TO haxr_edition_runtime;

GRANT SELECT, INSERT, UPDATE
  ON TABLE public.photo_upload_intents
  TO haxr_edition_runtime;

GRANT SELECT, INSERT, UPDATE
  ON TABLE public.wedding_photos
  TO haxr_edition_runtime;

-- RLS is effective for this role because it is NOBYPASSRLS and does not own
-- any of the Edition tables.
ALTER TABLE public.edition_gift_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_upload_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS haxr_edition_runtime_gifts_select
  ON public.edition_gift_reservations;
CREATE POLICY haxr_edition_runtime_gifts_select
  ON public.edition_gift_reservations
  FOR SELECT
  TO haxr_edition_runtime
  USING (true);

DROP POLICY IF EXISTS haxr_edition_runtime_guests_select
  ON public.guests;
CREATE POLICY haxr_edition_runtime_guests_select
  ON public.guests
  FOR SELECT
  TO haxr_edition_runtime
  USING (guest_source = 'edition_rsvp'::public.guest_source);

DROP POLICY IF EXISTS haxr_edition_runtime_intents_select
  ON public.photo_upload_intents;
CREATE POLICY haxr_edition_runtime_intents_select
  ON public.photo_upload_intents
  FOR SELECT
  TO haxr_edition_runtime
  USING (true);

DROP POLICY IF EXISTS haxr_edition_runtime_intents_insert
  ON public.photo_upload_intents;
CREATE POLICY haxr_edition_runtime_intents_insert
  ON public.photo_upload_intents
  FOR INSERT
  TO haxr_edition_runtime
  WITH CHECK (true);

DROP POLICY IF EXISTS haxr_edition_runtime_intents_update
  ON public.photo_upload_intents;
CREATE POLICY haxr_edition_runtime_intents_update
  ON public.photo_upload_intents
  FOR UPDATE
  TO haxr_edition_runtime
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS haxr_edition_runtime_photos_select
  ON public.wedding_photos;
CREATE POLICY haxr_edition_runtime_photos_select
  ON public.wedding_photos
  FOR SELECT
  TO haxr_edition_runtime
  USING (true);

DROP POLICY IF EXISTS haxr_edition_runtime_photos_insert
  ON public.wedding_photos;
CREATE POLICY haxr_edition_runtime_photos_insert
  ON public.wedding_photos
  FOR INSERT
  TO haxr_edition_runtime
  WITH CHECK (true);

DROP POLICY IF EXISTS haxr_edition_runtime_photos_update
  ON public.wedding_photos;
CREATE POLICY haxr_edition_runtime_photos_update
  ON public.wedding_photos
  FOR UPDATE
  TO haxr_edition_runtime
  USING (true)
  WITH CHECK (true);

-- Privileged RPC surface exposed to Edition.
GRANT EXECUTE
  ON FUNCTION public.check_api_rate_limit(text, integer, integer)
  TO haxr_edition_runtime;

GRANT EXECUTE
  ON FUNCTION public.reserve_edition_gift(text, text, text, text)
  TO haxr_edition_runtime;

GRANT EXECUTE
  ON FUNCTION public.submit_edition_rsvp(
    uuid,
    text,
    text,
    boolean,
    integer,
    text,
    text,
    text,
    text,
    text,
    boolean
  )
  TO haxr_edition_runtime;

-- The QR helper remains internal to the SECURITY DEFINER RSVP function.
REVOKE EXECUTE ON FUNCTION public.generate_guest_qr_token()
  FROM haxr_edition_runtime;

-- If the legacy eight-argument RSVP overload ever exists in Production,
-- explicitly keep it outside the Edition runtime surface.
DO $$
BEGIN
  IF to_regprocedure(
    'public.submit_edition_rsvp(uuid,text,text,boolean,integer,text,text,text)'
  ) IS NOT NULL THEN
    EXECUTE
      'REVOKE EXECUTE ON FUNCTION public.submit_edition_rsvp(uuid,text,text,boolean,integer,text,text,text) FROM haxr_edition_runtime';
  END IF;
END
$$;

COMMIT;
