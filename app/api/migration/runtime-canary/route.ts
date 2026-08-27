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

function getSafeDatabaseUrlIdentity(): {
  username: string | null;
  passwordPresent: boolean;
  pooled: boolean;
} {
  try {
    const raw = process.env.DATABASE_URL?.trim();
    if (!raw) return { username: null, passwordPresent: false, pooled: false };
    const url = new URL(raw);
    return {
      username: url.username ? decodeURIComponent(url.username) : null,
      passwordPresent: Boolean(url.password),
      pooled: url.hostname.includes("-pooler"),
    };
  } catch {
    return { username: null, passwordPresent: false, pooled: false };
  }
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
    databaseUrlIdentity: getSafeDatabaseUrlIdentity(),
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
        to_regprocedure('public.submit_edition_rsvp(uuid,text,text,boolean,integer,text,text,text,text,text,boolean)') IS NOT NULL AS has_submit_edition_rsvp,
        to_regprocedure('public.check_api_rate_limit(text,integer,integer)') IS NOT NULL AS has_check_api_rate_limit,
        to_regprocedure('public.reserve_edition_gift(text,text,text,text)') IS NOT NULL AS has_reserve_edition_gift,
        to_regclass('public.edition_gift_reservations') IS NOT NULL AS has_gift_reservations,
        to_regclass('public.wedding_photos') IS NOT NULL AS has_wedding_photos,
        to_regclass('public.photo_upload_intents') IS NOT NULL AS has_photo_upload_intents
    `) as Array<{
      database_name: string;
      role_name: string;
      has_submit_edition_rsvp: boolean;
      has_check_api_rate_limit: boolean;
      has_reserve_edition_gift: boolean;
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
          hasReserveEditionGift: row.has_reserve_edition_gift,
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
    const dbError = error as { name?: unknown; code?: unknown };
    result.database = {
      connected: false,
      errorName: typeof dbError?.name === "string" ? dbError.name : "UnknownError",
      errorCode: typeof dbError?.code === "string" ? dbError.code : null,
    };
    return NextResponse.json(result, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
