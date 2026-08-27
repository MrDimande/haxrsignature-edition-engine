import { NextResponse } from "next/server";
import { getDatabaseBackend } from "@lib/database/backend";
import { getNeonSql, isNeonConfigured } from "@lib/neon/server";

const MIGRATION_BRANCH = "migration/supabase-to-neon";

function isDedicatedMigrationPreview(): boolean {
  return (
    process.env.VERCEL_ENV === "preview" &&
    process.env.VERCEL_GIT_COMMIT_REF === MIGRATION_BRANCH
  );
}

export async function GET(): Promise<NextResponse> {
  if (!isDedicatedMigrationPreview()) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const backend = getDatabaseBackend();
  const databaseConfigured = isNeonConfigured();

  if (backend !== "neon" || !databaseConfigured) {
    return NextResponse.json(
      {
        ok: false,
        backend,
        databaseConfigured,
        databaseUrlPresent: Boolean(process.env.DATABASE_URL?.trim()),
        databaseUrlUnpooledPresent: Boolean(
          process.env.DATABASE_URL_UNPOOLED?.trim()
        ),
      },
      { status: 503 }
    );
  }

  try {
    const sql = getNeonSql();
    const rows = (await sql`
      SELECT
        current_database() AS database_name,
        to_regprocedure('public.submit_edition_rsvp(uuid,text,text,boolean,integer,text,text,text,text,text,boolean)') IS NOT NULL AS rsvp_function,
        to_regprocedure('public.check_api_rate_limit(text,integer,integer)') IS NOT NULL AS rate_limit_function
    `) as Array<{
      database_name: string;
      rsvp_function: boolean;
      rate_limit_function: boolean;
    }>;

    const row = rows[0];
    const ok = Boolean(row?.rsvp_function && row?.rate_limit_function);

    return NextResponse.json(
      {
        ok,
        backend,
        databaseConfigured,
        databaseName: row?.database_name ?? null,
        rsvpFunction: Boolean(row?.rsvp_function),
        rateLimitFunction: Boolean(row?.rate_limit_function),
      },
      { status: ok ? 200 : 503 }
    );
  } catch (error) {
    console.error("[neon-canary] runtime database check failed", error);
    return NextResponse.json(
      { ok: false, backend, databaseConfigured, connection: "failed" },
      { status: 503 }
    );
  }
}
