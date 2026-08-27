import { neon } from "@neondatabase/serverless";

const targetBranch = "migration/supabase-to-neon";
const isTargetPreview =
  process.env.VERCEL_ENV === "preview" &&
  process.env.VERCEL_GIT_COMMIT_REF === targetBranch;

if (!isTargetPreview) {
  console.log("[neon-build-canary] skipped outside dedicated migration Preview");
  process.exit(0);
}

const databaseUrl = process.env.DATABASE_URL?.trim();
const databaseUrlUnpooled = process.env.DATABASE_URL_UNPOOLED?.trim();

console.log(
  `[neon-build-canary] env pooled=${Boolean(databaseUrl)} unpooled=${Boolean(
    databaseUrlUnpooled
  )}`
);

if (!databaseUrl) {
  console.error("[neon-build-canary] DATABASE_URL missing");
  process.exit(2);
}

try {
  const sql = neon(databaseUrl);
  const rows = await sql`
    select
      current_database() as database_name,
      current_user as database_user,
      exists (
        select 1
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public'
          and p.proname = 'submit_edition_rsvp'
      ) as has_submit_edition_rsvp,
      exists (
        select 1
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public'
          and p.proname = 'check_api_rate_limit'
      ) as has_check_api_rate_limit
  `;

  const row = rows[0] ?? {};
  console.log(
    `[neon-build-canary] connected=true database=${String(
      row.database_name ?? "unknown"
    )} user=${String(row.database_user ?? "unknown")} submit_rsvp=${
      row.has_submit_edition_rsvp === true
    } rate_limit=${row.has_check_api_rate_limit === true}`
  );
} catch (error) {
  console.error(
    `[neon-build-canary] connected=false error=${
      error instanceof Error ? error.name : "DatabaseError"
    }`
  );
  process.exit(3);
}
