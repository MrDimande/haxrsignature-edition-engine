import { neon } from "@neondatabase/serverless";

const EXPECTED_BRANCH = "migration/supabase-to-neon";

function isMigrationPreview() {
  return (
    process.env.VERCEL_ENV === "preview" &&
    process.env.VERCEL_GIT_COMMIT_REF === EXPECTED_BRANCH
  );
}

if (!isMigrationPreview()) {
  console.log("[migration-db-canary] skipped outside migration Preview");
  process.exit(0);
}

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  console.error("[migration-db-canary] FAIL", JSON.stringify({ databaseUrlPresent: false }));
  process.exit(1);
}

try {
  const sql = neon(databaseUrl);
  const rows = await sql`
    SELECT
      current_database() AS database_name,
      current_user AS role_name,
      has_table_privilege(current_user, 'public.edition_gift_reservations', 'SELECT') AS gifts_select,
      has_table_privilege(current_user, 'public.guests', 'SELECT') AS guests_select,
      has_table_privilege(current_user, 'public.photo_upload_intents', 'SELECT,INSERT,UPDATE') AS intents_rw,
      has_table_privilege(current_user, 'public.wedding_photos', 'SELECT,INSERT,UPDATE') AS photos_rw,
      has_table_privilege(current_user, 'public.events', 'SELECT') AS events_select,
      has_function_privilege(current_user, 'public.check_api_rate_limit(text,integer,integer)', 'EXECUTE') AS rate_limit_execute,
      has_function_privilege(current_user, 'public.reserve_edition_gift(text,text,text,text)', 'EXECUTE') AS gift_execute,
      has_function_privilege(current_user, 'public.submit_edition_rsvp(uuid,text,text,boolean,integer,text,text,text,text,text,boolean)', 'EXECUTE') AS rsvp_execute
  `;

  const row = rows[0];
  const ok = Boolean(
    row &&
    row.database_name === "neondb" &&
    row.role_name === "haxr_edition_runtime" &&
    row.gifts_select === true &&
    row.guests_select === true &&
    row.intents_rw === true &&
    row.photos_rw === true &&
    row.events_select === false &&
    row.rate_limit_execute === true &&
    row.gift_execute === true &&
    row.rsvp_execute === true
  );

  console.log(
    "[migration-db-canary]",
    ok ? "PASS" : "FAIL",
    JSON.stringify({
      databaseName: row?.database_name ?? null,
      roleName: row?.role_name ?? null,
      giftsSelect: row?.gifts_select ?? false,
      guestsSelect: row?.guests_select ?? false,
      intentsRw: row?.intents_rw ?? false,
      photosRw: row?.photos_rw ?? false,
      eventsSelect: row?.events_select ?? null,
      rateLimitExecute: row?.rate_limit_execute ?? false,
      giftExecute: row?.gift_execute ?? false,
      rsvpExecute: row?.rsvp_execute ?? false,
    })
  );

  process.exit(ok ? 0 : 1);
} catch (error) {
  const err = error ?? {};
  console.error(
    "[migration-db-canary] FAIL",
    JSON.stringify({
      errorName: typeof err.name === "string" ? err.name : "UnknownError",
      errorCode: typeof err.code === "string" ? err.code : null,
    })
  );
  process.exit(1);
}
