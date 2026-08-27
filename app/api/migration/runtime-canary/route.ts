import { NextResponse } from "next/server";
import { getDatabaseBackend } from "@lib/database/backend";
import { getStorageBackend } from "@lib/storage/backend";
import { getNeonSql } from "@lib/neon/server";

const MIGRATION_BRANCH = "migration/supabase-to-neon";

function isMigrationPreview(): boolean {
  return (
    process.env.VERCEL_ENV === "preview" &&
    process.env.VERCEL_GIT_COMMIT_REF === MIGRATION_BRANCH
  );
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (!isMigrationPreview()) {
    return new NextResponse(null, { status: 404 });
  }

  const databaseUrlPresent = Boolean(process.env.DATABASE_URL?.trim());
  const databaseUrlUnpooledPresent = Boolean(
    process.env.DATABASE_URL_UNPOOLED?.trim()
  );
  const moderationSecretPresent = Boolean(
    process.env.ADMIN_MODERATION_SECRET?.trim()
  );

  const result: Record<string, unknown> = {
    ok: false,
    environment: process.env.VERCEL_ENV ?? null,
    gitRef: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    databaseBackend: getDatabaseBackend(),
    storageBackend: getStorageBackend(),
    databaseUrlPresent,
    databaseUrlUnpooledPresent,
    moderationSecretPresent,
    database: { connected: false },
  };

  if (!databaseUrlPresent || getDatabaseBackend() !== "neon") {
    return NextResponse.json(result, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }

  try {
    const sql = getNeonSql();
    const rows = (await sql`
      SELECT
        current_database() AS database_name,
        current_user AS role_name,
        to_regprocedure('public.submit_edition_rsvp(text,text,text,text,text,text,text,text,text,text,text)') IS NOT NULL AS has_submit_edition_rsvp,
        to_regprocedure('public.check_api_rate_limit(text,integer,integer)') IS NOT NULL AS has_check_api_rate_limit,
        to_regclass('public.edition_gift_reservations') IS NOT NULL AS has_gift_reservations,
        to_regclass('public.wedding_photos') IS NOT NULL AS has_wedding_photos,
        to_regclass('public.photo_upload_intents') IS NOT NULL AS has_photo_upload_intents
    `) as Array<{
      database_name: string;
      role_name: string;
      has_submit_edition_rsvp: boolean;
      has_check_api_rate_limit: boolean;
      has_gift_reservations: boolean;
      has_wedding_photos: boolean;
      has_photo_upload_intents: boolean;
    }>;

    const row = rows[0];
    result.ok = Boolean(row);
    result.database = row
      ? {
          connected: true,
          databaseName: row.database_name,
          roleName: row.role_name,
          hasSubmitEditionRsvp: row.has_submit_edition_rsvp,
          hasCheckApiRateLimit: row.has_check_api_rate_limit,
          hasGiftReservations: row.has_gift_reservations,
          hasWeddingPhotos: row.has_wedding_photos,
          hasPhotoUploadIntents: row.has_photo_upload_intents,
        }
      : { connected: false };

    return NextResponse.json(result, {
      status: row ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    result.database = {
      connected: false,
      error: error instanceof Error ? error.name : "UnknownError",
    };
    return NextResponse.json(result, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
