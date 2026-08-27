import { createHash } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { createClient } from "@supabase/supabase-js";

// READ-ONLY migration utility.
//
// It intentionally uses dedicated environment variable names so running the
// normal application cannot accidentally invoke it against Production.
// No INSERT/UPDATE/DELETE/RPC/storage mutation is performed by this script.

const required = {
  SOURCE_SUPABASE_URL: process.env.SOURCE_SUPABASE_URL?.trim(),
  SOURCE_SUPABASE_SERVICE_ROLE_KEY:
    process.env.SOURCE_SUPABASE_SERVICE_ROLE_KEY?.trim(),
  TARGET_NEON_DATABASE_URL: process.env.TARGET_NEON_DATABASE_URL?.trim(),
};

const missing = Object.entries(required)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missing.length > 0) {
  console.error(`[edition-parity] missing env: ${missing.join(", ")}`);
  process.exit(1);
}

const supabase = createClient(
  required.SOURCE_SUPABASE_URL,
  required.SOURCE_SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false, autoRefreshToken: false },
  }
);

const sql = neon(required.TARGET_NEON_DATABASE_URL);

function normalizeValue(value) {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(normalizeValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, normalizeValue(item)])
    );
  }
  return value;
}

function canonicalRows(rows, keyFn) {
  return rows
    .map((row) => normalizeValue(row))
    .sort((a, b) => keyFn(a).localeCompare(keyFn(b)));
}

function hashRows(rows) {
  return createHash("sha256").update(JSON.stringify(rows)).digest("hex");
}

async function fetchSupabasePaged(table, columns, configure) {
  const pageSize = 1000;
  const rows = [];

  for (let from = 0; ; from += pageSize) {
    let query = supabase.from(table).select(columns);
    if (configure) query = configure(query);
    query = query.range(from, from + pageSize - 1);

    const { data, error } = await query;
    if (error) throw new Error(`${table}: ${error.message}`);

    const page = data ?? [];
    rows.push(...page);
    if (page.length < pageSize) break;
  }

  return rows;
}

async function compareDataset({
  label,
  sourceRows,
  targetLoader,
  keyFn,
}) {
  let targetRows;
  try {
    targetRows = await targetLoader();
  } catch (error) {
    return {
      label,
      equal: false,
      targetAvailable: false,
      sourceCount: sourceRows.length,
      targetCount: null,
      sourceHash: hashRows(canonicalRows(sourceRows, keyFn)),
      targetHash: null,
      errorName: error instanceof Error ? error.name : "UnknownError",
    };
  }

  const sourceCanonical = canonicalRows(sourceRows, keyFn);
  const targetCanonical = canonicalRows(targetRows, keyFn);
  const sourceHash = hashRows(sourceCanonical);
  const targetHash = hashRows(targetCanonical);

  return {
    label,
    equal:
      sourceCanonical.length === targetCanonical.length &&
      sourceHash === targetHash,
    targetAvailable: true,
    sourceCount: sourceCanonical.length,
    targetCount: targetCanonical.length,
    sourceHash,
    targetHash,
  };
}

const photoColumns = [
  "id",
  "invitation_slug",
  "storage_path",
  "original_filename",
  "content_type",
  "file_size_bytes",
  "guest_name",
  "caption",
  "moderation_status",
  "created_at",
  "approved_at",
  "rejected_at",
  "challenge_id",
  "table_id",
  "participant_id",
].join(",");

const giftColumns = [
  "registry_key",
  "gift_id",
  "reserved_by",
  "gift_name",
  "created_at",
].join(",");

const guestColumns = [
  "id",
  "event_id",
  "name",
  "name_normalized",
  "email",
  "phone",
  "status",
  "plus_ones",
  "guest_notes",
  "guest_source",
  "created_at",
  "updated_at",
].join(",");

const sourcePhotos = await fetchSupabasePaged(
  "wedding_photos",
  photoColumns,
  (query) => query.order("id", { ascending: true })
);

const sourceGifts = await fetchSupabasePaged(
  "edition_gift_reservations",
  giftColumns,
  (query) =>
    query
      .order("registry_key", { ascending: true })
      .order("gift_id", { ascending: true })
);

const sourceEditionGuests = await fetchSupabasePaged(
  "guests",
  guestColumns,
  (query) =>
    query
      .eq("guest_source", "edition_rsvp")
      .order("id", { ascending: true })
);

const results = [];

results.push(
  await compareDataset({
    label: "wedding_photos",
    sourceRows: sourcePhotos,
    keyFn: (row) => String(row.id),
    targetLoader: async () =>
      await sql`
        SELECT
          id,
          invitation_slug,
          storage_path,
          original_filename,
          content_type,
          file_size_bytes,
          guest_name,
          caption,
          moderation_status,
          created_at,
          approved_at,
          rejected_at,
          challenge_id,
          table_id,
          participant_id
        FROM public.wedding_photos
        ORDER BY id
      `,
  })
);

results.push(
  await compareDataset({
    label: "edition_gift_reservations",
    sourceRows: sourceGifts,
    keyFn: (row) => `${row.registry_key}\u001f${row.gift_id}`,
    targetLoader: async () =>
      await sql`
        SELECT
          registry_key,
          gift_id,
          reserved_by,
          gift_name,
          created_at
        FROM public.edition_gift_reservations
        ORDER BY registry_key, gift_id
      `,
  })
);

results.push(
  await compareDataset({
    label: "guests:edition_rsvp",
    sourceRows: sourceEditionGuests,
    keyFn: (row) => String(row.id),
    targetLoader: async () =>
      await sql`
        SELECT
          id,
          event_id,
          name,
          name_normalized,
          email,
          phone,
          status,
          plus_ones,
          guest_notes,
          guest_source,
          created_at,
          updated_at
        FROM public.guests
        WHERE guest_source = 'edition_rsvp'
        ORDER BY id
      `,
  })
);

for (const result of results) {
  console.log("[edition-parity]", JSON.stringify(result));
}

const allEqual = results.every((result) => result.equal === true);
console.log(
  "[edition-parity] summary",
  JSON.stringify({ allEqual, datasets: results.length })
);

process.exit(allEqual ? 0 : 2);
