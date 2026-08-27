CREATE TYPE public.guest_status AS ENUM (
  'invited',
  'confirmed',
  'declined',
  'checked_in'
);

CREATE TYPE public.guest_source AS ENUM (
  'manual',
  'edition_rsvp'
);

CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE public.guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id),
  name text NOT NULL,
  name_normalized text NOT NULL,
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  qr_token text NOT NULL UNIQUE,
  status public.guest_status NOT NULL DEFAULT 'invited',
  plus_ones integer NOT NULL DEFAULT 0,
  guest_notes text NOT NULL DEFAULT '',
  guest_source public.guest_source NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.guest_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id uuid NOT NULL REFERENCES public.guests(id),
  event_id uuid NOT NULL REFERENCES public.events(id),
  guest_name text NOT NULL,
  action text NOT NULL,
  details text NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.edition_gift_reservations (
  registry_key text NOT NULL,
  gift_id text NOT NULL,
  reserved_by text NOT NULL,
  gift_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (registry_key, gift_id)
);
ALTER TABLE public.edition_gift_reservations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.api_rate_limits (
  bucket_key text PRIMARY KEY,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION public.check_api_rate_limit(
  p_bucket_key text,
  p_max_requests integer,
  p_window_seconds integer
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object('allowed', true, 'retryAfterSeconds', 0);
$$;

REVOKE ALL ON FUNCTION public.check_api_rate_limit(text, integer, integer)
  FROM PUBLIC;
