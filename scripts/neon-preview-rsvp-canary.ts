import { neon } from "@neondatabase/serverless";

const TARGET_BRANCH = "migration/supabase-to-neon";
const TEST_EVENT_ID = "1251bc6e-fac7-46cd-981d-bb3e4c066ce8";
const TEST_SLUG = "stanturns5";
const TEST_IP = "198.51.100.77";
const RATE_KEY = `edition:rsvp:${TEST_IP}`;

async function main(): Promise<void> {
  const isTargetPreview =
    process.env.VERCEL_ENV === "preview" &&
    process.env.VERCEL_GIT_COMMIT_REF === TARGET_BRANCH;

  if (!isTargetPreview) {
    console.log("[neon-rsvp-canary] skipped outside dedicated migration Preview");
    return;
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL missing");
  }

  // Canary-only process overrides. They do not persist to the Vercel project.
  process.env.HAXR_API_BACKEND = "local";
  process.env.HAXR_ALLOW_LOCAL_RSVP = "true";
  process.env.HAXR_RSVP_NOTIFICATION_MODE = "disabled";
  process.env.HAXR_LOCAL_RSVP_ALLOWED_SLUGS = TEST_SLUG;
  process.env.EDITION_EVENT_STAN_ID = TEST_EVENT_ID;
  delete process.env.HAXR_DATABASE_BACKEND;

  const suffix = (process.env.VERCEL_GIT_COMMIT_SHA ?? "local").slice(0, 10);
  const testName = `Neon RSVP Canary ${suffix}`;
  const testEmail = `neon-rsvp-canary-${suffix}@example.invalid`;
  const sql = neon(databaseUrl);

  async function cleanup(): Promise<void> {
    await sql`
      DELETE FROM public.guest_audit_log
      WHERE guest_id IN (
        SELECT id FROM public.guests
        WHERE event_id = ${TEST_EVENT_ID}::uuid
          AND guest_source = 'edition_rsvp'
          AND email = ${testEmail}
      )
    `;
    await sql`
      DELETE FROM public.guests
      WHERE event_id = ${TEST_EVENT_ID}::uuid
        AND guest_source = 'edition_rsvp'
        AND email = ${testEmail}
    `;
    await sql`
      DELETE FROM public.api_rate_limits
      WHERE bucket_key = ${RATE_KEY}
    `;
  }

  async function submit(attending: boolean, guests: number) {
    const { POST } = await import("../app/api/rsvp/route.ts");
    const request = new Request("https://preview.local/api/rsvp", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": TEST_IP,
      },
      body: JSON.stringify({
        name: testName,
        attending,
        guests,
        slug: TEST_SLUG,
        email: testEmail,
        honeypot: "",
      }),
    });

    const response = await POST(request);
    const body = (await response.json()) as Record<string, unknown>;
    return { status: response.status, body };
  }

  let failed: Error | null = null;

  try {
    await cleanup();

    const first = await submit(true, 3);
    if (
      first.status !== 200 ||
      first.body.success !== true ||
      first.body.persisted !== true ||
      first.body.notificationSkipped !== true
    ) {
      throw new Error(`first_submit_failed:${first.status}`);
    }

    const firstRows = await sql`
      SELECT id::text AS id, status::text AS status, plus_ones, guest_source
      FROM public.guests
      WHERE event_id = ${TEST_EVENT_ID}::uuid
        AND guest_source = 'edition_rsvp'
        AND email = ${testEmail}
    `;
    const firstGuest = firstRows[0];
    if (
      !firstGuest ||
      firstGuest.status !== "confirmed" ||
      Number(firstGuest.plus_ones) !== 2 ||
      firstGuest.guest_source !== "edition_rsvp"
    ) {
      throw new Error("first_persist_verification_failed");
    }

    const second = await submit(false, 0);
    if (
      second.status !== 200 ||
      second.body.success !== true ||
      second.body.persisted !== true ||
      second.body.notificationSkipped !== true
    ) {
      throw new Error(`second_submit_failed:${second.status}`);
    }

    const secondRows = await sql`
      SELECT id::text AS id, status::text AS status, plus_ones
      FROM public.guests
      WHERE event_id = ${TEST_EVENT_ID}::uuid
        AND guest_source = 'edition_rsvp'
        AND email = ${testEmail}
    `;
    const secondGuest = secondRows[0];
    if (
      !secondGuest ||
      secondGuest.id !== firstGuest.id ||
      secondGuest.status !== "declined" ||
      Number(secondGuest.plus_ones) !== 0
    ) {
      throw new Error("idempotent_update_verification_failed");
    }

    const auditRows = await sql`
      SELECT count(*)::int AS count
      FROM public.guest_audit_log
      WHERE guest_id = ${String(firstGuest.id)}::uuid
    `;
    const auditCount = Number(auditRows[0]?.count ?? 0);
    if (auditCount !== 2) {
      throw new Error(`audit_verification_failed:${auditCount}`);
    }

    const rateRows = await sql`
      SELECT request_count
      FROM public.api_rate_limits
      WHERE bucket_key = ${RATE_KEY}
    `;
    const requestCount = Number(rateRows[0]?.request_count ?? 0);
    if (requestCount !== 2) {
      throw new Error(`rate_limit_verification_failed:${requestCount}`);
    }

    console.log(
      "[neon-rsvp-canary] route=true first=confirmed second=declined same_guest=true audits=2 rate_count=2 notifications=disabled"
    );
  } catch (error) {
    failed = error instanceof Error ? error : new Error("unknown");
    console.error(`[neon-rsvp-canary] failed=${failed.message}`);
  } finally {
    try {
      await cleanup();
      const residue = await sql`
        SELECT
          (SELECT count(*)::int FROM public.guests
           WHERE event_id = ${TEST_EVENT_ID}::uuid
             AND guest_source = 'edition_rsvp'
             AND email = ${testEmail}) AS guest_rows,
          (SELECT count(*)::int FROM public.api_rate_limits
           WHERE bucket_key = ${RATE_KEY}) AS rate_rows
      `;
      console.log(
        `[neon-rsvp-canary] cleanup guest_rows=${Number(
          residue[0]?.guest_rows ?? -1
        )} rate_rows=${Number(residue[0]?.rate_rows ?? -1)}`
      );
    } catch (cleanupError) {
      const cleanupFailure =
        cleanupError instanceof Error ? cleanupError : new Error("cleanup_failed");
      console.error(`[neon-rsvp-canary] cleanup_failed=${cleanupFailure.name}`);
      failed ??= cleanupFailure;
    }
  }

  if (failed) throw failed;
}

main().catch((error) => {
  console.error(
    `[neon-rsvp-canary] fatal=${error instanceof Error ? error.message : "unknown"}`
  );
  process.exit(3);
});
