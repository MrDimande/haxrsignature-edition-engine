-- Phase A only: prepared schema, intentionally NOT applied to Neon Production.
-- The runtime role receives no grants here. Phase B must introduce narrowly
-- scoped SECURITY DEFINER functions only after isolated Neon-branch testing.

CREATE TABLE public.edition_gift_reservation_meta (
  reservation_id uuid PRIMARY KEY REFERENCES public.edition_gift_reservations(id) ON DELETE RESTRICT,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE RESTRICT,
  guest_id uuid NOT NULL REFERENCES public.guests(id) ON DELETE RESTRICT,
  item_id text NOT NULL CHECK (length(item_id) BETWEEN 1 AND 120),
  status text NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'purchased', 'delivered')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  purchased_at timestamptz,
  delivered_at timestamptz,
  CHECK ((status <> 'purchased') OR purchased_at IS NOT NULL),
  CHECK ((status <> 'delivered') OR delivered_at IS NOT NULL)
);

CREATE INDEX edition_gift_reservation_meta_event_guest_idx
  ON public.edition_gift_reservation_meta (event_id, guest_id);

CREATE TABLE public.edition_gift_reservation_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE RESTRICT,
  reservation_id uuid REFERENCES public.edition_gift_reservations(id) ON DELETE RESTRICT,
  guest_id uuid REFERENCES public.guests(id) ON DELETE RESTRICT,
  item_id text NOT NULL CHECK (length(item_id) BETWEEN 1 AND 120),
  action text NOT NULL CHECK (action IN ('reserved', 'cancelled', 'purchased', 'delivered')),
  actor_type text NOT NULL CHECK (actor_type IN ('guest', 'admin', 'system')),
  actor_id uuid,
  reason text CHECK (length(reason) <= 280),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX edition_gift_reservation_audit_event_reservation_idx
  ON public.edition_gift_reservation_audit (event_id, reservation_id, created_at DESC);

ALTER TABLE public.edition_gift_reservation_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edition_gift_reservation_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.edition_gift_reservation_meta FROM PUBLIC, edition_runtime;
REVOKE ALL ON TABLE public.edition_gift_reservation_audit FROM PUBLIC, edition_runtime;
