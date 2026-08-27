-- HAXR Signature Edition — Neon runtime least-privilege role
--
-- Preview-first migration.
-- Validated on Neon Preview branch: preview/migration/supabase-to-neon.
-- Do NOT apply to Neon Production until the Preview runtime has been switched
-- to this role and the complete Edition regression/canary suite is green.
--
-- This role is intentionally scoped to the public Edition runtime only:
-- - read gift reservation state;
-- - read Edition RSVP identities for reconciliation;
-- - read/write Memories upload intents and photo metadata;
-- - execute the three privileged RPCs used by Edition.
--
-- It must not receive access to Business Suite events, finance, suppliers,
-- clients, documents, or other administrative tables.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_roles
    WHERE rolname = 'haxr_edition_runtime'
  ) THEN
    CREATE ROLE haxr_edition_runtime
      LOGIN
      NOINHERIT
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE
      NOREPLICATION
      NOBYPASSRLS;
  ELSE
    ALTER ROLE haxr_edition_runtime
      LOGIN
      NOINHERIT
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE
      NOREPLICATION
      NOBYPASSRLS;
  END IF;
END
$$;

-- Schema boundary: runtime may resolve objects in public, but may not create
-- objects there and has no access to the imported auth schema.
REVOKE CREATE ON SCHEMA public FROM haxr_edition_runtime;
GRANT USAGE ON SCHEMA public TO haxr_edition_runtime;
REVOKE ALL PRIVILEGES ON SCHEMA auth FROM haxr_edition_runtime;

-- Start from no direct object privileges, then grant only the Edition surface.
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM haxr_edition_runtime;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM haxr_edition_runtime;
REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM haxr_edition_runtime;

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

-- RLS remains enabled and is effective because this role is NOBYPASSRLS and
-- does not own these tables.
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

-- SECURITY DEFINER RPCs have fixed search_path=public and are owned by
-- neondb_owner. Only the signatures used by the current Edition runtime are
-- exposed to this role.
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

-- Explicitly keep the legacy 8-argument RSVP overload unavailable.
REVOKE EXECUTE
  ON FUNCTION public.submit_edition_rsvp(
    uuid,
    text,
    text,
    boolean,
    integer,
    text,
    text,
    text
  )
  FROM haxr_edition_runtime;
