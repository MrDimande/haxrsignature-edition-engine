import { NextResponse } from "next/server";
import { getDatabaseBackend } from "@/lib/database/backend";
import { getNeonSql, isNeonConfigured } from "@/lib/neon/server";

const MIGRATION_BRANCH = "migration/supabase-to-neon";

export async function GET(): Promise<NextResponse> {
  if (
    process.env.VERCEL_ENV !== "preview" ||
    process.env.VERCEL_GIT_COMMIT_REF !== MIGRATION_BRANCH
  ) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const databaseUrlPresent = Boolean(process.env.DATABASE_URL?.trim());
  const databaseUrlUnpooledPresent = Boolean(
    process.env.DATABASE_URL_UNPOOLED?.trim()
  );

  const base = {
    ok: true,
    backend: getDatabaseBackend(),
    databaseUrlPresent,
    databaseUrlUnpooledPresent,
    databaseConfigured: isNeonConfigured(),
  };

  if (!databaseUrlPresent) {
    return NextResponse.json({ ...base, connected: false });
  }

  try {
    const sql = getNeonSql();
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

    const row = rows[0];
    return NextResponse.json({
      ...base,
      connected: true,
      databaseName: row?.database_name ?? null,
      databaseUser: row?.database_user ?? null,
      hasSubmitEditionRsvp: Boolean(row?.has_submit_edition_rsvp),
      hasCheckApiRateLimit: Boolean(row?.has_check_api_rate_limit),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ...base,
        connected: false,
        error: error instanceof Error ? error.name : "DatabaseError",
      },
      { status: 500 }
    );
  }
}
