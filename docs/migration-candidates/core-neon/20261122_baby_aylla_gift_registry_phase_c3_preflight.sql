-- HAXR Core — Baby Aylla Gift Registry — Phase C.3
-- READ-ONLY PREFLIGHT CHECK
-- This script contains ONLY SELECT statements. It makes NO schema or data modifications.
-- Target: Neon PostgreSQL (preview or staging branch before migration).

-- 1. Database and Environment Overview
SELECT current_database() AS current_database,
       current_user AS current_user,
       session_user AS session_user,
       version() AS postgres_version;

-- 2. Validate Required Extension Functions
SELECT proname, prosrc
FROM pg_proc
WHERE proname IN ('gen_random_uuid', 'pg_advisory_xact_lock')
ORDER BY proname;

-- 3. Verify Prerequisite Roles (Fail-Closed)
SELECT rolname, rolcanlogin, rolsuper, rolinherit
FROM pg_roles
WHERE rolname IN ('neondb_owner', 'edition_runtime', 'haxr_core_runtime')
ORDER BY rolname;

-- 4. Verify Prerequisite Tables
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('events', 'guests')
ORDER BY table_name;

-- 5. Verify Column Prerequisites on public.guests
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'guests'
  AND column_name IN ('id', 'event_id', 'status', 'guest_source', 'archived_at', 'deleted_at', 'is_incorrect')
ORDER BY column_name;

-- 6. Verify Candidate Tables Do Not Already Exist (Avoid Collisions)
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'edition_gift_inventory',
    'edition_gift_reservations_v2',
    'edition_gift_reservation_audit_v2',
    'edition_guest_verification_challenges',
    'edition_guest_sessions'
  );

-- 7. Verify Candidate Functions Do Not Already Exist
SELECT proname, prorettype::regtype
FROM pg_proc
WHERE proname IN (
    'reserve_baby_aylla_gift',
    'reserve_baby_aylla_gift_verified',
    'cancel_baby_aylla_gift_verified',
    'admin_transition_baby_aylla_gift'
  )
  AND pronamespace = 'public'::regnamespace;

-- 8. Check Canonical Event Presence (Baby Aylla)
SELECT id, title, slug, created_at
FROM public.events
WHERE id = 'a0f6b5a9-4d8c-4501-81b6-52929fa9da38';
