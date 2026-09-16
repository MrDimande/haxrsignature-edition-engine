import fs from 'fs';
import pg from 'pg';

const credsPath = 'C:/Users/Aldim/.config/neon/credentials.json';
const projectId = 'little-band-06036174';

async function getToken() {
  const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
  const res = await fetch('https://oauth2.neon.tech/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: 'neonctl',
      refresh_token: creds.refresh_token,
    }),
  });
  if (res.ok) {
    const data = await res.json();
    creds.access_token = data.access_token;
    if (data.refresh_token) creds.refresh_token = data.refresh_token;
    fs.writeFileSync(credsPath, JSON.stringify(creds, null, 2));
    return data.access_token;
  }
  return creds.access_token;
}

async function getUri(branchId, role = 'neondb_owner') {
  const token = await getToken();
  const u = new URL(`https://console.neon.tech/api/v2/projects/${projectId}/connection_uri`);
  u.searchParams.set('branch_id', branchId);
  u.searchParams.set('database_name', 'neondb');
  u.searchParams.set('role_name', role);
  u.searchParams.set('pooled', 'false');
  const res = await fetch(u.toString(), {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  const data = await res.json();
  return data.uri;
}

async function main() {
  const token = await getToken();

  console.log('=== [1. NEON API: BRANCHES & PITR AUDIT] ===');
  const bRes = await fetch(`https://console.neon.tech/api/v2/projects/${projectId}/branches`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
  });
  const bData = await bRes.json();
  console.log('Branches:');
  console.table(bData.branches.map(b => ({ id: b.id, name: b.name, parent_id: b.parent_id, current_state: b.current_state })));

  const pRes = await fetch(`https://console.neon.tech/api/v2/projects/${projectId}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
  });
  const pData = await pRes.json();
  console.log('Project PITR retention:', {
    history_retention_seconds: pData.project?.history_retention_seconds,
    retention_days: (pData.project?.history_retention_seconds || 0) / 86400,
    pg_version: pData.project?.pg_version
  });

  console.log('\n=== [2. PRODUCTION 147 MEDIA TYPE & COLUMNS AUDIT (READ-ONLY)] ===');
  const prodUri = await getUri('br-wandering-bonus-ay2ex5lx');
  const prod = new pg.Client({ connectionString: prodUri, ssl: { rejectUnauthorized: false } });
  await prod.connect();

  // Media type distribution
  const typeRes = await prod.query(`
    SELECT content_type, count(*)::int as count 
    FROM wedding_photos 
    GROUP BY content_type 
    ORDER BY count DESC;
  `);
  console.log('Content-Type distribution of 147 legacy media:');
  console.table(typeRes.rows);

  // Check if any is video
  const videoRes = await prod.query(`
    SELECT count(*)::int as count 
    FROM wedding_photos 
    WHERE content_type ILIKE '%video%' OR storage_path ILIKE '%.mp4' OR storage_path ILIKE '%.mov';
  `);
  console.log('Videos found in legacy media:', videoRes.rows[0].count);

  // Check experience mapping to events in Production
  console.log('\n=== [3. PRODUCTION EVENTS & EXPERIENCES RELATION AUDIT] ===');
  const expRes = await prod.query(`
    SELECT me.id as exp_id, me.event_slug, me.invitation_slug, me.display_name
    FROM memory_experiences me;
  `);
  console.log('Production memory_experiences:');
  console.table(expRes.rows);

  const evRes = await prod.query(`
    SELECT id, name, edition_registry_key, is_active, created_at 
    FROM events;
  `);
  console.log('Production events:');
  console.table(evRes.rows);

  // Cross reference matching logic
  for (const exp of expRes.rows) {
    const match = await prod.query(`
      SELECT id, name, edition_registry_key 
      FROM events 
      WHERE edition_registry_key = $1 OR name ILIKE $2;
    `, ['jessica-samuel-wedding', `%${exp.display_name}%`]);
    console.log(`Matching for exp ${exp.event_slug}:`, match.rows);
  }

  // Baseline 147 media sha256 checksum
  console.log('\n=== [4. SHA-256 CHECKSUM OF 147 LEGACY MEDIA ROWS] ===');
  const hashRes = await prod.query(`
    SELECT md5(string_agg(
      id::text || '|' || 
      invitation_slug || '|' || 
      storage_path || '|' || 
      COALESCE(original_filename, '') || '|' || 
      content_type || '|' || 
      file_size_bytes::text || '|' || 
      COALESCE(guest_name, '') || '|' || 
      COALESCE(caption, '') || '|' || 
      moderation_status || '|' || 
      created_at::text || '|' || 
      COALESCE(approved_at::text, '') || '|' || 
      COALESCE(rejected_at::text, '') || '|' || 
      COALESCE(challenge_id, '') || '|' || 
      COALESCE(table_id, '') || '|' || 
      COALESCE(participant_id::text, '') || '|' || 
      COALESCE(experience_id::text, '') || '|' || 
      COALESCE(phase_id, ''),
      '#' ORDER BY id
    )) as legacy_rows_hash,
    count(*)::int as count
    FROM wedding_photos;
  `);
  console.log('Production legacy media baseline hash:', hashRes.rows[0]);

  // Roles in Production
  console.log('\n=== [5. PRODUCTION ROLES AUDIT] ===');
  const rolesRes = await prod.query(`
    SELECT rolname, rolsuper, rolinherit, rolcreaterole, rolcreatedb, rolcanlogin 
    FROM pg_roles 
    WHERE rolname IN ('edition_runtime', 'haxr_edition_runtime', 'haxrweb_runtime', 'neondb_owner')
    ORDER BY rolname;
  `);
  console.table(rolesRes.rows);

  await prod.end();
}

main().catch(console.error);
