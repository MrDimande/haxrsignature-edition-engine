-- HAXR Gift Registry — Baby Aylla — Phase C
-- STATUS: CANDIDATE ONLY. Not an Edition migration and never production-ready.
-- Intended canonical destination after review: HAXR Core / database/migrations/
-- Verified lab: gentle-firefly-70094226 / br-icy-butterfly-b4lw52nv.
-- The lab has events and guests but no edition_runtime role.
-- This candidate ends in ROLLBACK so accidental execution is non-persistent.

BEGIN;

SELECT to_regclass('public.events') AS events_table,
       to_regclass('public.guests') AS guests_table,
       to_regrole('edition_runtime') AS edition_runtime_role;

CREATE TABLE public.edition_gift_inventory (
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE RESTRICT,
  registry_key text NOT NULL CHECK (registry_key = 'baby-aylla-couture'),
  item_id text NOT NULL CHECK (length(item_id) BETWEEN 1 AND 120),
  family_approved boolean NOT NULL DEFAULT false,
  enabled boolean NOT NULL DEFAULT false,
  approved_quantity integer CHECK (approved_quantity IS NULL OR approved_quantity > 0),
  specifications_complete boolean NOT NULL DEFAULT false,
  child_safety_validated boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, item_id)
);

CREATE TABLE public.edition_gift_reservations_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE RESTRICT,
  item_id text NOT NULL,
  guest_id uuid NOT NULL REFERENCES public.guests(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  status text NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'purchased', 'delivered', 'cancelled')),
  idempotency_key uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  cancelled_at timestamptz,
  purchased_at timestamptz,
  delivered_at timestamptz,
  FOREIGN KEY (event_id, item_id) REFERENCES public.edition_gift_inventory(event_id, item_id) ON DELETE RESTRICT,
  UNIQUE (event_id, guest_id, idempotency_key),
  CHECK ((status <> 'cancelled') OR cancelled_at IS NOT NULL),
  CHECK ((status <> 'purchased') OR purchased_at IS NOT NULL),
  CHECK ((status <> 'delivered') OR delivered_at IS NOT NULL)
);

CREATE INDEX edition_gift_reservations_v2_availability_idx
  ON public.edition_gift_reservations_v2 (event_id, item_id)
  WHERE status IN ('reserved', 'purchased', 'delivered');

CREATE TABLE public.edition_gift_reservation_audit_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES public.edition_gift_reservations_v2(id) ON DELETE RESTRICT,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE RESTRICT,
  actor_guest_id uuid REFERENCES public.guests(id) ON DELETE RESTRICT,
  actor_admin_id uuid,
  action text NOT NULL CHECK (action IN ('reserved', 'purchased', 'delivered', 'cancelled')),
  previous_status text CHECK (previous_status IN ('reserved', 'purchased', 'delivered', 'cancelled')),
  next_status text NOT NULL CHECK (next_status IN ('reserved', 'purchased', 'delivered', 'cancelled')),
  reason text CHECK (length(reason) <= 280),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((actor_guest_id IS NULL) <> (actor_admin_id IS NULL))
);

CREATE INDEX edition_gift_reservation_audit_v2_event_idx
  ON public.edition_gift_reservation_audit_v2 (event_id, reservation_id, created_at DESC);

-- No SECURITY DEFINER: Core decides final least-privilege grants and RLS.
-- The inventory row is locked before availability is calculated and inserted.
CREATE FUNCTION public.reserve_baby_aylla_gift(
  p_event_id uuid, p_item_id text, p_guest_id uuid, p_quantity integer, p_idempotency_key uuid
) RETURNS public.edition_gift_reservations_v2
LANGUAGE plpgsql AS $$
DECLARE
  v_inventory public.edition_gift_inventory;
  v_existing public.edition_gift_reservations_v2;
  v_reserved integer;
  v_reservation public.edition_gift_reservations_v2;
BEGIN
  IF p_quantity IS NULL OR p_quantity < 1 THEN
    RAISE EXCEPTION 'invalid reservation quantity' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_existing FROM public.edition_gift_reservations_v2
   WHERE event_id = p_event_id AND guest_id = p_guest_id AND idempotency_key = p_idempotency_key;
  IF FOUND THEN RETURN v_existing; END IF;
  SELECT * INTO v_inventory FROM public.edition_gift_inventory
   WHERE event_id = p_event_id AND item_id = p_item_id FOR UPDATE;
  IF NOT FOUND OR NOT v_inventory.family_approved OR NOT v_inventory.enabled
    OR v_inventory.approved_quantity IS NULL OR NOT v_inventory.specifications_complete
    OR NOT v_inventory.child_safety_validated THEN
    RAISE EXCEPTION 'gift item is not reservable' USING ERRCODE = '42501';
  END IF;
  PERFORM 1 FROM public.guests WHERE id = p_guest_id AND event_id = p_event_id
    AND status = 'confirmed' AND guest_source = 'edition_rsvp'
    AND archived_at IS NULL AND deleted_at IS NULL AND is_incorrect = false;
  IF NOT FOUND THEN RAISE EXCEPTION 'guest is not eligible' USING ERRCODE = '42501'; END IF;
  SELECT COALESCE(sum(quantity), 0) INTO v_reserved FROM public.edition_gift_reservations_v2
   WHERE event_id = p_event_id AND item_id = p_item_id AND status IN ('reserved', 'purchased', 'delivered');
  IF p_quantity > v_inventory.approved_quantity - v_reserved THEN
    RAISE EXCEPTION 'gift quantity unavailable' USING ERRCODE = '23514';
  END IF;
  INSERT INTO public.edition_gift_reservations_v2 (event_id, item_id, guest_id, quantity, idempotency_key)
   VALUES (p_event_id, p_item_id, p_guest_id, p_quantity, p_idempotency_key) RETURNING * INTO v_reservation;
  INSERT INTO public.edition_gift_reservation_audit_v2
   (reservation_id, event_id, actor_guest_id, action, next_status)
   VALUES (v_reservation.id, p_event_id, p_guest_id, 'reserved', 'reserved');
  RETURN v_reservation;
END;
$$;

-- Before converting to a Core forward migration: enable RLS; grant execution
-- only to the verified server runtime; configure existing Core admin authority;
-- grant no public SELECT or mutation access.
ROLLBACK;
