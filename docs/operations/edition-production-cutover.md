# HAXR Signature Edition — Production cutover runbook

> Status: PREPARED / NOT EXECUTED.
>
> This runbook must not be interpreted as approval to mutate Neon Production,
> Vercel Production, Supabase Production, or `main`.

## Goal

Move the active HAXR Edition runtime from Supabase to:

- Neon Production for relational data;
- Vercel Blob for Memories / Photo Wall binary objects;
- `haxr_edition_runtime` as the least-privilege PostgreSQL login.

The cutover is deliberately staged so database and object-storage migration do
not happen at the same instant.

## Safety invariants

1. Never promote the entire Neon Preview schema to Production.
2. Never point Production at `neondb_owner`.
3. Never use the Preview runtime password in Production.
4. Never expose a Production database URL or moderation secret in Git/chat/logs.
5. Never switch Memories storage to Vercel Blob before existing Supabase Storage
   objects have been copied and verified.
6. Keep Supabase Production unchanged and available as rollback until the full
   post-cutover verification window is closed.

## Prepared migrations

### Core

`neon/migrations/20260827220500_edition_production_core.sql`

Creates only the current Edition database surface missing from Neon Production:

- `photo_upload_intents`;
- `wedding_photos`;
- `reserve_edition_gift(...)`;
- `generate_guest_qr_token()`;
- current 11-argument `submit_edition_rsvp(...)`.

It deliberately does not pull in Neon Auth, Data API, Client Portal, Suppliers,
Concierge, Finance, `memory_experiences`, voice memories, or unrelated Preview
schema changes.

### Runtime permissions

`neon/migrations/20260827221000_edition_production_runtime_permissions.sql`

Applies only after `haxr_edition_runtime` exists in Neon Production with a
Production-only password and safe role attributes.

The runtime is limited to:

- read `edition_gift_reservations`;
- read only `guest_source='edition_rsvp'` through RLS on `guests`;
- SELECT/INSERT/UPDATE `photo_upload_intents`;
- SELECT/INSERT/UPDATE `wedding_photos`;
- EXECUTE the rate-limit, gift-reservation, and current Edition RSVP RPCs.

It receives no intended direct access to `events`, finance, suppliers, clients,
documents, or other Business Suite administrative surfaces.

## Gate 0 — backup and immutable references

Before any Production mutation:

- record the exact `main` SHA;
- record the exact migration branch SHA;
- create/verify a Neon Production restore point / backup strategy;
- record current Vercel Production deployment ID;
- keep the current Supabase Production configuration intact.

Do not continue if rollback identifiers are missing.

## Gate 1 — test the core migration against a fresh Production clone

Create a temporary Neon branch directly from Production, apply only the core
migration, then verify:

- tables and constraints exist;
- `reserve_edition_gift(...)` exists and is SECURITY DEFINER;
- only the 11-argument Edition RSVP RPC is required by the application;
- current Production `events`, `guests`, `guest_audit_log`, and rate-limit
  surfaces still behave normally;
- no Client Portal / Finance / Supplier schema is introduced by this migration.

Delete the temporary QA branch after the verification.

## Gate 2 — Production schema application

Only after an explicit approval:

1. apply the core migration to Neon Production;
2. do not change Vercel Production yet;
3. do not change Supabase Production yet;
4. verify the new tables are empty and the existing Production data is intact.

At this point the public application must still be using Supabase.

## Gate 3 — data parity before database cutover

### RSVP

Verify the production event IDs required by Edition exist in Neon Production and
compare the relevant guest state between Supabase and Neon, especially:

- Edition event IDs;
- `guest_source='edition_rsvp'`;
- normalized guest identity;
- status / plus-ones;
- audit-log integrity.

### Gifts

Compare `edition_gift_reservations` between Supabase Production and Neon
Production using stable business keys (`registry_key`, `gift_id`).

### Memories / Photo Wall metadata

Copy existing `wedding_photos` metadata from Supabase Production to Neon
Production before selecting Neon as the database backend. Verify at minimum:

- row count by `invitation_slug`;
- IDs;
- `storage_path`;
- moderation status;
- participant/challenge/table metadata;
- created timestamps.

Expired upload intents do not need historical migration. Any currently pending
intent should either be allowed to finish before the cutover or be deliberately
expired and recreated after cutover.

## Gate 4 — create the Production runtime role

Generate a new password locally. Never reuse the Preview password.

Create `haxr_edition_runtime` in Neon Production with:

- LOGIN;
- NOINHERIT;
- NOSUPERUSER;
- NOCREATEDB;
- NOCREATEROLE;
- NOREPLICATION;
- NOBYPASSRLS.

Then apply:

`neon/migrations/20260827221000_edition_production_runtime_permissions.sql`

Verify as that role:

- `current_user = haxr_edition_runtime`;
- required Edition grants are true;
- `events` SELECT is false;
- Finance / Suppliers / Clients are inaccessible;
- only the intended privileged RPCs are executable.

## Gate 5 — database-only Production cutover

The code is safe-by-default: Production remains on Supabase unless explicitly
configured. `HAXR_DATABASE_BACKEND=neon` is therefore the database cutover
switch.

Production variables required at this gate:

- `DATABASE_URL` — Neon Production, pooled, `haxr_edition_runtime`;
- `DATABASE_URL_UNPOOLED` — Neon Production, direct, same runtime role;
- `HAXR_DATABASE_BACKEND=neon`;
- a Production-only `ADMIN_MODERATION_SECRET`.

Keep storage on Supabase at this stage:

- do **not** set `HAXR_STORAGE_BACKEND=vercel-blob` yet;
- existing Supabase Storage credentials remain available.

This allows Neon to serve metadata while old binary objects remain in Supabase
Storage during the object-copy phase.

Immediately after deployment, validate:

- RSVP read/write with a controlled canary and cleanup;
- Gifts read/reserve with a controlled canary and cleanup;
- Memories gallery and leaderboard reads;
- upload intent + completion on a controlled object;
- moderation auth fail-closed and authorised path;
- Photo Wall legacy routes;
- no unexpected access to Business Suite tables.

Rollback for this gate is to restore `HAXR_DATABASE_BACKEND=supabase` and
redeploy, while Neon remains intact for diagnosis.

## Gate 6 — object migration to Vercel Blob

Before storage cutover, copy every live object referenced by migrated
`wedding_photos.storage_path` from Supabase Storage to the intended Production
Vercel Blob store.

Verify:

- object count by invitation / prefix;
- byte size;
- MIME type where available;
- a content hash for copied objects when feasible;
- signed/private reads through the application adapter.

### Environment isolation requirement

Do not proceed until the Vercel Blob configuration is proven safe for Production
and Preview. Preview testing must not be able to overwrite Production objects
with the same logical storage paths.

Use separate stores or an equally strong environment-isolation strategy.

## Gate 7 — storage Production cutover

Only after Gate 6 is green:

- set `HAXR_STORAGE_BACKEND=vercel-blob` in Vercel Production;
- ensure Production OIDC / Blob store identity resolves to the intended
  Production store;
- deploy;
- validate old and new Memories objects, ZIP export, gallery signed reads, and
  uploads.

Rollback is to restore `HAXR_STORAGE_BACKEND=supabase` while keeping the copied
Blob objects intact.

## Gate 8 — observation window

Keep Supabase Production available during the observation period. Check:

- RSVP error rate;
- gift reservation uniqueness / conflicts;
- Memories upload and completion errors;
- moderation failures;
- Blob signed-read errors;
- Neon connection / permission errors;
- Vercel runtime logs.

Only after the observation window is green should Supabase dependencies be
considered for final decommissioning.

## Explicit non-goals for this cutover

Do not bundle these into the Edition migration:

- Neon Auth / Data API rollout;
- Client Portal auth migration;
- supplier marketplace changes;
- Concierge changes;
- Finance schema changes;
- unrelated index drift in the shared Business Suite database.
