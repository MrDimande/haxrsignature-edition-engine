-- HAXR Core — Baby Aylla Gift Registry — Phase C.3
-- CANONICAL ROLLBACK / DOWN MIGRATION (CANDIDATE)
-- Safe, idempotent reversal of the Phase C.3 forward migration.
-- Drops objects in reverse dependency order.

BEGIN;

-- 1. Revoke Function Execution Grants
REVOKE ALL ON FUNCTION public.cancel_baby_aylla_gift_verified(uuid, text, uuid) FROM edition_runtime;
REVOKE ALL ON FUNCTION public.reserve_baby_aylla_gift_verified(uuid, text, text, integer, uuid) FROM edition_runtime;

-- 2. Drop Functions
DROP FUNCTION IF EXISTS public.cancel_baby_aylla_gift_verified(uuid, text, uuid);
DROP FUNCTION IF EXISTS public.reserve_baby_aylla_gift_verified(uuid, text, text, integer, uuid);
DROP FUNCTION IF EXISTS public.reserve_baby_aylla_gift(uuid, text, uuid, integer, uuid);

-- 3. Drop Tables (in reverse foreign key order)
DROP TABLE IF EXISTS public.edition_guest_sessions CASCADE;
DROP TABLE IF EXISTS public.edition_guest_verification_challenges CASCADE;
DROP TABLE IF EXISTS public.edition_gift_reservation_audit_v2 CASCADE;
DROP TABLE IF EXISTS public.edition_gift_reservations_v2 CASCADE;
DROP TABLE IF EXISTS public.edition_gift_inventory CASCADE;

COMMIT;
