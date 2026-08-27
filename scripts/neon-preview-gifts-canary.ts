import { createHash } from "node:crypto";
import { neon } from "@neondatabase/serverless";

const TARGET_BRANCH = "migration/supabase-to-neon";
const ROSE_REGISTRY = "rose-elegance";
const ROSE_SLUG = "jessicachadelingerie";
const ROSE_GIFT_ID = "cozinha-colheres-silicone";
const STAN_REGISTRY = "stan-real-madrid";
const STAN_SLUG = "stanturns5";
const STAN_GIFT_ID = "stan-comboio-carris";

function fingerprint(ip: string, userAgent: string): string {
  return createHash("sha256")
    .update(`${ip}|${userAgent}`)
    .digest("hex")
    .slice(0, 32);
}

function rateKey(slug: string, ip: string, userAgent: string): string {
  return [
    "edition",
    "public-mutation",
    "gifts",
    slug,
    "reserve",
    fingerprint(ip, userAgent),
  ].join(":");
}

async function main(): Promise<void> {
  if (
    process.env.VERCEL_ENV !== "preview" ||
    process.env.VERCEL_GIT_COMMIT_REF !== TARGET_BRANCH
  ) {
    console.log("[neon-gifts-canary] skipped outside dedicated migration Preview");
    return;
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) throw new Error("DATABASE_URL missing");

  // Prevent all gift notification emails during this disposable canary.
  delete process.env.RESEND_API_KEY;
  delete process.env.HAXR_DATABASE_BACKEND;

  const suffix = (process.env.VERCEL_GIT_COMMIT_SHA ?? "local").slice(0, 10);
  const roseName = `Neon Gifts Rose Canary ${suffix}`;
  const stanName = `Neon Gifts Stan Canary ${suffix}`;
  const roseIp = "198.51.100.78";
  const stanIp = "198.51.100.79";
  const roseUa = "haxr-neon-gifts-canary-rose";
  const stanUa = "haxr-neon-gifts-canary-stan";
  const roseRateKey = rateKey(ROSE_SLUG, roseIp, roseUa);
  const stanRateKey = rateKey(STAN_SLUG, stanIp, stanUa);
  const sql = neon(databaseUrl);

  async function cleanup(): Promise<void> {
    await sql`
      DELETE FROM public.edition_gift_reservations
      WHERE (registry_key = ${ROSE_REGISTRY} AND reserved_by = ${roseName})
         OR (registry_key = ${STAN_REGISTRY} AND reserved_by = ${stanName})
    `;
    await sql`
      DELETE FROM public.api_rate_limits
      WHERE bucket_key IN (${roseRateKey}, ${stanRateKey})
    `;
  }

  async function postRose() {
    const { POST } = await import("../app/api/gifts/reserve/route.ts");
    const request = new Request("https://preview.local/api/gifts/reserve", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": roseIp,
        "user-agent": roseUa,
      },
      body: JSON.stringify({
        slug: ROSE_SLUG,
        itemId: ROSE_GIFT_ID,
        guestName: roseName,
        quantity: 1,
      }),
    });
    const response = await POST(request);
    return {
      status: response.status,
      body: (await response.json()) as Record<string, unknown>,
    };
  }

  async function postStan() {
    const { POST } = await import("../app/api/stan/gifts/reserve/route.ts");
    const request = new Request("https://preview.local/api/stan/gifts/reserve", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": stanIp,
        "user-agent": stanUa,
      },
      body: JSON.stringify({
        giftId: STAN_GIFT_ID,
        reservedBy: stanName,
      }),
    });
    const response = await POST(request);
    return {
      status: response.status,
      body: (await response.json()) as Record<string, unknown>,
    };
  }

  let failure: Error | null = null;

  try {
    await cleanup();

    const roseFirst = await postRose();
    if (roseFirst.status !== 200 || roseFirst.body.success !== true) {
      throw new Error(`rose_first_failed:${roseFirst.status}`);
    }

    const roseRows = await sql`
      SELECT gift_id, gift_name, reserved_by
      FROM public.edition_gift_reservations
      WHERE registry_key = ${ROSE_REGISTRY}
        AND reserved_by = ${roseName}
    `;
    if (
      roseRows.length !== 1 ||
      roseRows[0]?.gift_id !== ROSE_GIFT_ID ||
      roseRows[0]?.reserved_by !== roseName
    ) {
      throw new Error("rose_persist_verification_failed");
    }

    const roseSecond = await postRose();
    if (roseSecond.status !== 409 || roseSecond.body.success !== false) {
      throw new Error(`rose_conflict_failed:${roseSecond.status}`);
    }

    const roseCountRows = await sql`
      SELECT count(*)::int AS count
      FROM public.edition_gift_reservations
      WHERE registry_key = ${ROSE_REGISTRY}
        AND reserved_by = ${roseName}
    `;
    if (Number(roseCountRows[0]?.count ?? 0) !== 1) {
      throw new Error("rose_duplicate_row_created");
    }

    const stanFirst = await postStan();
    if (stanFirst.status !== 200 || stanFirst.body.success !== true) {
      throw new Error(`stan_first_failed:${stanFirst.status}`);
    }

    const stanRows = await sql`
      SELECT gift_id, gift_name, reserved_by
      FROM public.edition_gift_reservations
      WHERE registry_key = ${STAN_REGISTRY}
        AND reserved_by = ${stanName}
    `;
    if (
      stanRows.length !== 1 ||
      stanRows[0]?.gift_id !== STAN_GIFT_ID ||
      stanRows[0]?.reserved_by !== stanName
    ) {
      throw new Error("stan_persist_verification_failed");
    }

    const stanSecond = await postStan();
    if (stanSecond.status !== 409 || stanSecond.body.success !== false) {
      throw new Error(`stan_conflict_failed:${stanSecond.status}`);
    }

    const stanCountRows = await sql`
      SELECT count(*)::int AS count
      FROM public.edition_gift_reservations
      WHERE registry_key = ${STAN_REGISTRY}
        AND reserved_by = ${stanName}
    `;
    if (Number(stanCountRows[0]?.count ?? 0) !== 1) {
      throw new Error("stan_duplicate_row_created");
    }

    const rateRows = await sql`
      SELECT bucket_key, request_count
      FROM public.api_rate_limits
      WHERE bucket_key IN (${roseRateKey}, ${stanRateKey})
      ORDER BY bucket_key
    `;
    if (
      rateRows.length !== 2 ||
      rateRows.some((row) => Number(row.request_count) !== 2)
    ) {
      throw new Error("gift_rate_limit_verification_failed");
    }

    console.log(
      "[neon-gifts-canary] rose=true rose_conflict=true stan=true stan_conflict=true rate_limits=true emails=disabled"
    );
  } catch (error) {
    failure = error instanceof Error ? error : new Error("unknown");
    console.error(`[neon-gifts-canary] failed=${failure.message}`);
  } finally {
    try {
      await cleanup();
      const residue = await sql`
        SELECT
          (SELECT count(*)::int FROM public.edition_gift_reservations
           WHERE reserved_by IN (${roseName}, ${stanName})) AS reservation_rows,
          (SELECT count(*)::int FROM public.api_rate_limits
           WHERE bucket_key IN (${roseRateKey}, ${stanRateKey})) AS rate_rows
      `;
      console.log(
        `[neon-gifts-canary] cleanup reservation_rows=${Number(
          residue[0]?.reservation_rows ?? -1
        )} rate_rows=${Number(residue[0]?.rate_rows ?? -1)}`
      );
    } catch (cleanupError) {
      const err = cleanupError instanceof Error ? cleanupError : new Error("cleanup_failed");
      console.error(`[neon-gifts-canary] cleanup_failed=${err.name}`);
      failure ??= err;
    }
  }

  if (failure) throw failure;
}

main().catch((error) => {
  console.error(
    `[neon-gifts-canary] fatal=${error instanceof Error ? error.message : "unknown"}`
  );
  process.exit(3);
});
