import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { neon } from "@neondatabase/serverless";

const EXPECTED_GUESTS = 316;
const EXPECTED_AUDITS = 386;
const EXPECTED_SEATS = 6;
const EXPECTED_EVENTS = 7;

const REQUIRED_EVENT_IDS = [
  "7cec4447-de0d-40a5-8f03-8d7c87acb3f5",
  "c61444cc-2b23-4fa0-b560-1932d53aa3b8",
  "caf1bdce-06ad-4b71-a476-b18000996d3d",
  "cc9e3366-2736-4f2b-8fa3-a6ba5c3ee0a7",
  "d91744cc-f4be-4b75-b706-a55e64481040",
  "de277c01-ce34-4765-8655-27307c674d5d",
  "de9e7136-987d-487a-a1c7-62988239e503",
];

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stable(value[key])])
    );
  }
  return value;
}

function digest(rows) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(stable(rows)))
    .digest("hex");
}

function sortBy(...keys) {
  return (a, b) => {
    for (const key of keys) {
      const av = a[key] ?? "";
      const bv = b[key] ?? "";
      const cmp = String(av).localeCompare(String(bv));
      if (cmp !== 0) return cmp;
    }
    return 0;
  };
}

async function fetchSeedGuests(supabase) {
  const rows = [];
  const pageSize = 100;
  for (let offset = 0; offset < EXPECTED_GUESTS; offset += pageSize) {
    const end = Math.min(offset + pageSize - 1, EXPECTED_GUESTS - 1);
    const { data, error } = await supabase
      .from("guests")
      .select(
        "id,event_id,name,email,phone,client_type,seat_id,qr_token,status,created_at,updated_at,plus_ones,dietary_notes,guest_notes,label,guest_source,group_id,name_normalized,import_batch_id,archived_at,archive_reason,is_incorrect,deleted_at,invite_sent_at"
      )
      .eq("guest_source", "edition_rsvp")
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, end);
    if (error) throw error;
    rows.push(...(data ?? []));
  }
  assert(rows.length === EXPECTED_GUESTS, `Expected ${EXPECTED_GUESTS} seed guests, got ${rows.length}`);
  return rows;
}

async function fetchSeedAudits(supabase, guestIds) {
  const rows = [];
  const chunkSize = 30;
  for (let i = 0; i < guestIds.length; i += chunkSize) {
    const ids = guestIds.slice(i, i + chunkSize);
    const { data, error } = await supabase
      .from("guest_audit_log")
      .select("id,guest_id,event_id,guest_name,action,details,changed_at")
      .in("guest_id", ids);
    if (error) throw error;
    rows.push(...(data ?? []));
  }
  rows.sort(sortBy("changed_at", "id"));
  assert(rows.length >= EXPECTED_AUDITS, `Expected at least ${EXPECTED_AUDITS} seed audits, got ${rows.length}`);
  return rows.slice(0, EXPECTED_AUDITS);
}

async function fetchSeats(supabase, seatIds) {
  if (seatIds.length === 0) return [];
  const { data, error } = await supabase
    .from("seats")
    .select("id,event_id,table_name,seat_number,label,created_at")
    .in("id", seatIds);
  if (error) throw error;
  const rows = (data ?? []).sort(sortBy("id"));
  assert(rows.length === EXPECTED_SEATS, `Expected ${EXPECTED_SEATS} seats, got ${rows.length}`);
  return rows;
}

function projectGuest(row) {
  return {
    id: row.id,
    event_id: row.event_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    client_type: row.client_type,
    seat_id: row.seat_id,
    qr_token: row.qr_token,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    plus_ones: row.plus_ones,
    dietary_notes: row.dietary_notes,
    guest_notes: row.guest_notes,
    label: row.label,
    guest_source: row.guest_source,
    group_id: row.group_id,
    name_normalized: row.name_normalized,
    import_batch_id: row.import_batch_id,
    archived_at: row.archived_at,
    archive_reason: row.archive_reason,
    is_incorrect: row.is_incorrect,
    deleted_at: row.deleted_at,
    invite_sent_at: row.invite_sent_at,
  };
}

function projectAudit(row) {
  return {
    id: row.id,
    guest_id: row.guest_id,
    event_id: row.event_id,
    guest_name: row.guest_name,
    action: row.action,
    details: row.details,
    changed_at: row.changed_at,
  };
}

function projectSeat(row) {
  return {
    id: row.id,
    event_id: row.event_id,
    table_name: row.table_name,
    seat_number: row.seat_number,
    label: row.label,
    created_at: row.created_at,
  };
}

async function main() {
  assert(
    process.env.HAXR_ALLOW_PRODUCTION_RSVP_SEED === "YES",
    "Refusing Production seed. Set HAXR_ALLOW_PRODUCTION_RSVP_SEED=YES for this one command."
  );

  const supabaseUrl = required("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseKey = required("SUPABASE_SERVICE_ROLE_KEY");
  const neonUrl = required("HAXR_NEON_PRODUCTION_OWNER_URL");

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const sql = neon(neonUrl);

  const [identity] = await sql`
    SELECT current_database() AS database_name, current_user AS role_name
  `;
  assert(identity?.database_name === "neondb", `Expected neondb, got ${identity?.database_name}`);
  assert(identity?.role_name === "neondb_owner", `Expected neondb_owner, got ${identity?.role_name}`);

  const eventCheck = await sql`
    SELECT id::text AS id
    FROM public.events
    WHERE id IN (
      '7cec4447-de0d-40a5-8f03-8d7c87acb3f5',
      'c61444cc-2b23-4fa0-b560-1932d53aa3b8',
      'caf1bdce-06ad-4b71-a476-b18000996d3d',
      'cc9e3366-2736-4f2b-8fa3-a6ba5c3ee0a7',
      'd91744cc-f4be-4b75-b706-a55e64481040',
      'de277c01-ce34-4765-8655-27307c674d5d',
      'de9e7136-987d-487a-a1c7-62988239e503'
    )
  `;
  assert(eventCheck.length === EXPECTED_EVENTS, `Expected ${EXPECTED_EVENTS} Edition events in Neon Production, got ${eventCheck.length}`);
  assert(REQUIRED_EVENT_IDS.every((id) => eventCheck.some((row) => row.id === id)), "Edition event IDs do not match the approved Gate 2A set");

  const guests = await fetchSeedGuests(supabase);
  const guestIds = guests.map((row) => row.id);
  const audits = await fetchSeedAudits(supabase, guestIds);
  const seatIds = [...new Set(guests.map((row) => row.seat_id).filter(Boolean))].sort();
  assert(seatIds.length === EXPECTED_SEATS, `Expected ${EXPECTED_SEATS} referenced seat IDs, got ${seatIds.length}`);
  const seats = await fetchSeats(supabase, seatIds);

  const sourceGuestHash = digest(guests.map(projectGuest).sort(sortBy("created_at", "id")));
  const sourceAuditHash = digest(audits.map(projectAudit).sort(sortBy("changed_at", "id")));
  const sourceSeatHash = digest(seats.map(projectSeat).sort(sortBy("id")));

  console.log(`Source snapshot: guests=${guests.length}, audits=${audits.length}, seats=${seats.length}`);
  console.log(`Source hashes: guests=${sourceGuestHash}, audits=${sourceAuditHash}, seats=${sourceSeatHash}`);

  const seatsJson = JSON.stringify(seats.map(projectSeat));
  await sql`
    INSERT INTO public.seats (id,event_id,table_name,seat_number,label,created_at)
    SELECT x.id, x.event_id, x.table_name, x.seat_number, x.label, x.created_at
    FROM jsonb_to_recordset(${seatsJson}::jsonb) AS x(
      id uuid,
      event_id uuid,
      table_name text,
      seat_number integer,
      label text,
      created_at timestamptz
    )
    ON CONFLICT (id) DO UPDATE SET
      event_id = EXCLUDED.event_id,
      table_name = EXCLUDED.table_name,
      seat_number = EXCLUDED.seat_number,
      label = EXCLUDED.label,
      created_at = EXCLUDED.created_at
  `;

  const guestChunkSize = 60;
  for (let i = 0; i < guests.length; i += guestChunkSize) {
    const payload = JSON.stringify(guests.slice(i, i + guestChunkSize).map(projectGuest));
    await sql`
      INSERT INTO public.guests (
        id,event_id,name,email,phone,client_type,seat_id,qr_token,status,
        created_at,updated_at,plus_ones,dietary_notes,guest_notes,label,
        guest_source,group_id,name_normalized,import_batch_id,archived_at,
        archive_reason,is_incorrect,deleted_at,invite_sent_at
      )
      SELECT
        x.id,x.event_id,x.name,x.email,x.phone,x.client_type::public.client_type,
        x.seat_id,x.qr_token,x.status::public.guest_status,x.created_at,x.updated_at,
        x.plus_ones,x.dietary_notes,x.guest_notes,x.label::public.guest_label,
        x.guest_source::public.guest_source,x.group_id,x.name_normalized,x.import_batch_id,
        x.archived_at,x.archive_reason,x.is_incorrect,x.deleted_at,x.invite_sent_at
      FROM jsonb_to_recordset(${payload}::jsonb) AS x(
        id uuid,event_id uuid,name text,email text,phone text,client_type text,
        seat_id uuid,qr_token text,status text,created_at timestamptz,updated_at timestamptz,
        plus_ones integer,dietary_notes text,guest_notes text,label text,guest_source text,
        group_id uuid,name_normalized text,import_batch_id uuid,archived_at timestamptz,
        archive_reason text,is_incorrect boolean,deleted_at timestamptz,invite_sent_at timestamptz
      )
      ON CONFLICT (id) DO UPDATE SET
        event_id=EXCLUDED.event_id,
        name=EXCLUDED.name,
        email=EXCLUDED.email,
        phone=EXCLUDED.phone,
        client_type=EXCLUDED.client_type,
        seat_id=EXCLUDED.seat_id,
        qr_token=EXCLUDED.qr_token,
        status=EXCLUDED.status,
        created_at=EXCLUDED.created_at,
        updated_at=EXCLUDED.updated_at,
        plus_ones=EXCLUDED.plus_ones,
        dietary_notes=EXCLUDED.dietary_notes,
        guest_notes=EXCLUDED.guest_notes,
        label=EXCLUDED.label,
        guest_source=EXCLUDED.guest_source,
        group_id=EXCLUDED.group_id,
        name_normalized=EXCLUDED.name_normalized,
        import_batch_id=EXCLUDED.import_batch_id,
        archived_at=EXCLUDED.archived_at,
        archive_reason=EXCLUDED.archive_reason,
        is_incorrect=EXCLUDED.is_incorrect,
        deleted_at=EXCLUDED.deleted_at,
        invite_sent_at=EXCLUDED.invite_sent_at
    `;
  }

  const auditChunkSize = 80;
  for (let i = 0; i < audits.length; i += auditChunkSize) {
    const payload = JSON.stringify(audits.slice(i, i + auditChunkSize).map(projectAudit));
    await sql`
      INSERT INTO public.guest_audit_log (
        id,guest_id,event_id,guest_name,action,details,changed_at
      )
      SELECT x.id,x.guest_id,x.event_id,x.guest_name,x.action,x.details,x.changed_at
      FROM jsonb_to_recordset(${payload}::jsonb) AS x(
        id uuid,guest_id uuid,event_id uuid,guest_name text,action text,details text,changed_at timestamptz
      )
      ON CONFLICT (id) DO UPDATE SET
        guest_id=EXCLUDED.guest_id,
        event_id=EXCLUDED.event_id,
        guest_name=EXCLUDED.guest_name,
        action=EXCLUDED.action,
        details=EXCLUDED.details,
        changed_at=EXCLUDED.changed_at
    `;
  }

  const neonGuests = await sql`
    SELECT id,event_id,name,email,phone,client_type,seat_id,qr_token,status,
           created_at,updated_at,plus_ones,dietary_notes,guest_notes,label,
           guest_source,group_id,name_normalized,import_batch_id,archived_at,
           archive_reason,is_incorrect,deleted_at,invite_sent_at
    FROM public.guests
    WHERE guest_source='edition_rsvp'
    ORDER BY created_at,id
    LIMIT ${EXPECTED_GUESTS}
  `;
  const neonAudits = await sql`
    SELECT id,guest_id,event_id,guest_name,action,details,changed_at
    FROM public.guest_audit_log
    WHERE guest_id IN (
      SELECT id FROM public.guests
      WHERE guest_source='edition_rsvp'
      ORDER BY created_at,id
      LIMIT ${EXPECTED_GUESTS}
    )
    ORDER BY changed_at,id
    LIMIT ${EXPECTED_AUDITS}
  `;
  const neonSeats = await sql`
    SELECT id,event_id,table_name,seat_number,label,created_at
    FROM public.seats
    WHERE id IN (
      SELECT seat_id FROM public.guests
      WHERE guest_source='edition_rsvp' AND seat_id IS NOT NULL
      ORDER BY seat_id
    )
    ORDER BY id
  `;

  assert(neonGuests.length === EXPECTED_GUESTS, `Destination guests mismatch: ${neonGuests.length}`);
  assert(neonAudits.length === EXPECTED_AUDITS, `Destination audits mismatch: ${neonAudits.length}`);
  assert(neonSeats.length === EXPECTED_SEATS, `Destination seats mismatch: ${neonSeats.length}`);

  const destGuestHash = digest(neonGuests.map(projectGuest).sort(sortBy("created_at", "id")));
  const destAuditHash = digest(neonAudits.map(projectAudit).sort(sortBy("changed_at", "id")));
  const destSeatHash = digest(neonSeats.map(projectSeat).sort(sortBy("id")));

  assert(destGuestHash === sourceGuestHash, "Guest hash mismatch after seed");
  assert(destAuditHash === sourceAuditHash, "Audit hash mismatch after seed");
  assert(destSeatHash === sourceSeatHash, "Seat hash mismatch after seed");

  console.log(`Destination snapshot: guests=${neonGuests.length}, audits=${neonAudits.length}, seats=${neonSeats.length}`);
  console.log(`Destination hashes: guests=${destGuestHash}, audits=${destAuditHash}, seats=${destSeatHash}`);
  console.log("HAXR Edition Gate 2B RSVP seed PASSED");
}

main().catch((error) => {
  console.error(`Gate 2B FAILED: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
