-- HAXR Gift Registry — Baby Aylla — Phase C.2
-- CANDIDATE ONLY: review in HAXR Core, then move as one forward migration to
-- database/migrations/. This file always rolls back and must not be deployed.
-- Dependencies: Phase C.1 candidate objects and a Core-owned HMAC secret.

BEGIN;

-- Fail closed: the existing restricted NOLOGIN privilege role is required.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'edition_runtime') THEN
    RAISE EXCEPTION 'edition_runtime must exist before Gift Registry grants are reviewed';
  END IF;
END;
$$;

-- A challenge holds only a keyed verifier, never the contact or code in clear.
CREATE TABLE public.edition_guest_verification_challenges (
  id uuid PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE RESTRICT,
  guest_id uuid NOT NULL REFERENCES public.guests(id) ON DELETE RESTRICT,
  verifier_hash text NOT NULL CHECK (length(verifier_hash) >= 32),
  expires_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0 AND attempts <= 5),
  max_attempts integer NOT NULL DEFAULT 5 CHECK (max_attempts BETWEEN 1 AND 10),
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expires_at > created_at)
);

CREATE INDEX edition_guest_verification_challenges_live_idx
  ON public.edition_guest_verification_challenges (id, expires_at)
  WHERE consumed_at IS NULL;

-- The opaque browser value is session_id.secret. Only the server-derived
-- verifier is persisted. CSRF is validated by Core at its same-origin route.
CREATE TABLE public.edition_guest_sessions (
  id uuid PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE RESTRICT,
  guest_id uuid NOT NULL REFERENCES public.guests(id) ON DELETE RESTRICT,
  secret_hash text NOT NULL CHECK (length(secret_hash) >= 32),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expires_at > created_at)
);

CREATE INDEX edition_guest_sessions_active_idx
  ON public.edition_guest_sessions (id, expires_at)
  WHERE revoked_at IS NULL;

ALTER TABLE public.edition_guest_verification_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edition_guest_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edition_gift_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edition_gift_reservations_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edition_gift_reservation_audit_v2 ENABLE ROW LEVEL SECURITY;

-- No browser, PUBLIC role, or runtime role receives table access. Functions
-- below are the only proposed Edition runtime capability, after Core review.
REVOKE ALL ON public.edition_guest_verification_challenges FROM PUBLIC;
REVOKE ALL ON public.edition_guest_sessions FROM PUBLIC;
REVOKE ALL ON public.edition_gift_inventory FROM PUBLIC;
REVOKE ALL ON public.edition_gift_reservations_v2 FROM PUBLIC;
REVOKE ALL ON public.edition_gift_reservation_audit_v2 FROM PUBLIC;

-- Core must provide a dedicated LOGIN role out-of-band, configured NOINHERIT,
-- NOSUPERUSER, NOCREATEDB, NOCREATEROLE, NOBYPASSRLS and granted membership in
-- edition_runtime only. Its password/connection URL are server-only secrets.
-- Do not use neondb_owner at runtime; do not create a LOGIN role in this file.

CREATE FUNCTION public.reserve_baby_aylla_gift_verified(
  p_session_id uuid,
  p_secret_hash text,
  p_item_id text,
  p_quantity integer,
  p_idempotency_key uuid
) RETURNS public.edition_gift_reservations_v2
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_session public.edition_guest_sessions;
BEGIN
  SELECT * INTO v_session
  FROM public.edition_guest_sessions
  WHERE id = p_session_id
    AND secret_hash = p_secret_hash
    AND expires_at > now()
    AND revoked_at IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'verified guest session required' USING ERRCODE = '42501';
  END IF;

  -- Re-evaluate mutable guest eligibility on every reservation operation.
  PERFORM 1 FROM public.guests
  WHERE id = v_session.guest_id AND event_id = v_session.event_id
    AND status = 'confirmed' AND guest_source = 'edition_rsvp'
    AND archived_at IS NULL AND deleted_at IS NULL AND is_incorrect = false;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'guest is not eligible' USING ERRCODE = '42501';
  END IF;

  RETURN public.reserve_baby_aylla_gift(
    v_session.event_id, p_item_id, v_session.guest_id, p_quantity, p_idempotency_key
  );
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_baby_aylla_gift_verified(uuid, text, text, integer, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserve_baby_aylla_gift_verified(uuid, text, text, integer, uuid) TO edition_runtime;

-- Core administrative transitions are intentionally not created here. They
-- require the canonical Core admin session, persisted event grants and an
-- immutable audit author; browser actor IDs must never be parameters.

ROLLBACK;
