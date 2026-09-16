import fs from 'fs';

const dump = JSON.parse(fs.readFileSync('scripts/preview-schema-dump.json', 'utf8'));
const migSql = fs.readFileSync('supabase/migrations/20260912120000_plus_memories_v2_release_convergence.sql', 'utf8');

// Pre-existing elements in Production baseline (verified via pg_catalog on br-wandering-bonus-ay2ex5lx)
const PROD_BASELINE_COLUMNS = {
  memory_experiences: ['id', 'event_slug', 'invitation_slug', 'source_type', 'display_name', 'event_type', 'status', 'package', 'memories_variant', 'estimated_guest_count', 'storage_slug', 'features', 'created_at', 'updated_at'],
  wedding_photos: ['id', 'invitation_slug', 'storage_path', 'original_filename', 'content_type', 'file_size_bytes', 'guest_name', 'caption', 'moderation_status', 'created_at', 'approved_at', 'rejected_at', 'challenge_id', 'table_id', 'participant_id', 'experience_id', 'phase_id'],
};

const PROD_BASELINE_CONSTRAINTS = {
  memory_experiences: ['memory_experiences_pkey', 'memory_experiences_event_slug_key', 'memory_experiences_invitation_slug_key', 'memory_experiences_storage_slug_key'],
  wedding_photos: ['wedding_photos_pkey', 'wedding_photos_storage_path_key', 'wedding_photos_content_type_check', 'wedding_photos_file_size_bytes_check', 'wedding_photos_guest_name_check', 'wedding_photos_caption_check', 'wedding_photos_moderation_status_check'],
};

const PROD_BASELINE_INDEXES = {
  memory_experiences: ['memory_experiences_pkey', 'memory_experiences_event_slug_key', 'memory_experiences_invitation_slug_key', 'memory_experiences_storage_slug_key'],
  wedding_photos: ['wedding_photos_pkey', 'wedding_photos_storage_path_key', 'wedding_photos_moderation_idx', 'wedding_photos_public_gallery_idx', 'wedding_photos_challenge_idx', 'wedding_photos_table_idx', 'wedding_photos_participant_idx', 'wedding_photos_invitation_slug_created_idx'],
};

const tables = Object.keys(dump);
console.log(`Auditing ${tables.length} tables from Preview Catalog Dump against Convergence Migration...`);

let unexpectedDiffs = [];
let expectedDiffsCount = 0;

for (const tableName of tables) {
  const t = dump[tableName];

  // 1. Table creation check
  if (!migSql.includes(tableName) && tableName !== 'memory_experiences' && tableName !== 'wedding_photos') {
    unexpectedDiffs.push({ type: 'MISSING_TABLE', table: tableName });
    continue;
  }

  // 2. Columns check
  for (const col of t.columns) {
    const isBaseline = PROD_BASELINE_COLUMNS[tableName]?.includes(col.column_name);
    const colRegex = new RegExp(`\\b${col.column_name}\\b`, 'i');
    const inMigration = colRegex.test(migSql);

    if (!inMigration) {
      if (isBaseline) {
        expectedDiffsCount++;
      } else {
        unexpectedDiffs.push({ type: 'MISSING_COLUMN', table: tableName, column: col.column_name });
      }
    }
  }

  // 3. Constraints check
  for (const con of t.constraints) {
    if (con.contype === 'n') continue; // Not nulls are covered by column nullability
    const isBaseline = PROD_BASELINE_CONSTRAINTS[tableName]?.includes(con.conname);
    const inMigration = migSql.includes(con.conname);

    if (!inMigration) {
      if (isBaseline) {
        expectedDiffsCount++;
      } else {
        unexpectedDiffs.push({ type: 'MISSING_CONSTRAINT', table: tableName, constraint: con.conname, def: con.def });
      }
    }
  }

  // 4. Indexes check
  for (const idx of t.indexes) {
    // Skip if index name is a constraint (PK / UNIQUE)
    if (t.constraints.some(c => c.conname === idx.indexname)) continue;
    const isBaseline = PROD_BASELINE_INDEXES[tableName]?.includes(idx.indexname);
    const inMigration = migSql.includes(idx.indexname);
    if (!inMigration) {
      if (isBaseline) {
        expectedDiffsCount++;
      } else {
        unexpectedDiffs.push({ type: 'MISSING_INDEX', table: tableName, index: idx.indexname });
      }
    }
  }

  // 5. RLS policies check
  for (const pol of t.policies) {
    const inMigration = migSql.includes(pol.policyname);
    if (!inMigration) {
      unexpectedDiffs.push({ type: 'MISSING_POLICY', table: tableName, policy: pol.policyname });
    }
  }
}

// --- 6. AUDITORIA DE FUNCTIONS E TRIGGERS (BLOCKER 1) ---
const ftDump = JSON.parse(fs.readFileSync('scripts/preview-functions-triggers.json', 'utf8'));

let functionExpectedDiffs = 0; // Legacy baseline functions preserved
let functionUnexpectedDiffs = [];
let triggerExpectedDiffs = 0; // Legacy baseline triggers preserved
let triggerUnexpectedDiffs = [];

const PROD_BASELINE_FUNCTIONS = [
  'check_api_rate_limit',
  'generate_guest_qr_token',
  'is_valid_event_floor_plan_items',
  'is_valid_event_floor_plan_print_preferences',
  'is_valid_event_floor_plan_room',
  'lookup_event_checkin',
  'next_document_number',
  'peek_document_number',
  'perform_event_checkin',
  'perform_event_rsvp',
  'remove_guest_import_batch_atomic',
  'reserve_edition_gift',
  'set_guest_import_batches_updated_at',
  'set_updated_at',
  'show_db_tree',
  'submit_edition_rsvp',
  'touch_event_floor_plan_updated_at',
  'undo_guest_import_batch_removal_atomic'
];

for (const f of ftDump.functions) {
  const inMigration = migSql.includes(f.function_name);
  if (!inMigration) {
    if (PROD_BASELINE_FUNCTIONS.includes(f.function_name)) {
      functionExpectedDiffs++;
    } else {
      functionUnexpectedDiffs.push({
        type: 'MISSING_FUNCTION',
        function: f.function_name,
        arguments: f.arguments,
        return_type: f.return_type
      });
    }
    continue;
  }

  // Verificar prosecdef na migration
  if (f.is_security_definer) {
    const secDefRegex = new RegExp(`CREATE(?:\\s+OR\\s+REPLACE)?\\s+FUNCTION\\s+(?:public\\.)?${f.function_name}[\\s\\S]*?SECURITY\\s+DEFINER`, 'i');
    if (!secDefRegex.test(migSql)) {
      functionUnexpectedDiffs.push({
        type: 'MISSING_SECURITY_DEFINER',
        function: f.function_name
      });
    }
  }

  // Verificar search_path na migration
  if (f.search_path_config && f.search_path_config.some(s => s.includes('search_path=public, pg_temp'))) {
    const spRegex = new RegExp(`CREATE(?:\\s+OR\\s+REPLACE)?\\s+FUNCTION\\s+(?:public\\.)?${f.function_name}[\\s\\S]*?SET\\s+search_path\\s+TO\\s+'public',\\s*'pg_temp'|SET\\s+search_path\\s*=\\s*public,\\s*pg_temp`, 'i');
    if (!spRegex.test(migSql)) {
      functionUnexpectedDiffs.push({
        type: 'MISSING_SEARCH_PATH_GUARD',
        function: f.function_name
      });
    }
  }

  // Verificar menor privilégio (PUBLIC EXECUTE)
  if (!f.public_execute) {
    const revokeRegex = new RegExp(`REVOKE\\s+ALL\\s+ON\\s+FUNCTION\\s+(?:public\\.)?${f.function_name}[\\s\\S]*?FROM\\s+PUBLIC`, 'i');
    if (!revokeRegex.test(migSql)) {
      functionUnexpectedDiffs.push({
        type: 'MISSING_PUBLIC_REVOCATION',
        function: f.function_name
      });
    }
  }
}

const MEMORIES_TRIGGER_TABLES = ['wedding_photos', ...tables.filter(t => t.startsWith('memory_'))];

for (const trg of ftDump.triggers) {
  const isMemoriesTrigger = MEMORIES_TRIGGER_TABLES.includes(trg.table_name);
  const inMigration = migSql.includes(trg.trigger_name);

  if (!isMemoriesTrigger) {
    // Triggers em tabelas de baseline (ex: guests, events, etc.)
    triggerExpectedDiffs++;
  } else {
    if (!inMigration) {
      triggerUnexpectedDiffs.push({
        type: 'MISSING_TRIGGER',
        trigger: trg.trigger_name,
        table: trg.table_name,
        function: trg.function_name
      });
    } else {
      // Verificar se a definição inclui a tabela e função correctas
      const trgRegex = new RegExp(`CREATE\\s+TRIGGER\\s+${trg.trigger_name}[\\s\\S]*?ON\\s+(?:public\\.)?${trg.table_name}[\\s\\S]*?EXECUTE\\s+FUNCTION\\s+${trg.function_name}`, 'i');
      if (!trgRegex.test(migSql)) {
        triggerUnexpectedDiffs.push({
          type: 'INVALID_TRIGGER_DEFINITION',
          trigger: trg.trigger_name,
          table: trg.table_name,
          function: trg.function_name
        });
      }
    }
  }
}

console.log('\n=============================================================');
console.log('=== HAXR SIGNATURE — SEMANTIC CATALOG DIFF AUDIT (RC vs PREVIEW) ===');
console.log('=============================================================');
console.log(`Total Tables Audited:                  ${tables.length}`);
console.log(`Table Schema Expected Differences:     ${expectedDiffsCount}`);
console.log(`TABLE SCHEMA UNEXPECTED DIFFERENCES:   ${unexpectedDiffs.length}`);
console.log('-------------------------------------------------------------');
console.log(`FUNCTION_EXPECTED_DIFFERENCES:         ${functionExpectedDiffs}`);
console.log(`FUNCTION_UNEXPECTED_DIFFERENCES:       ${functionUnexpectedDiffs.length}`);
console.log('-------------------------------------------------------------');
console.log(`TRIGGER_EXPECTED_DIFFERENCES:          ${triggerExpectedDiffs}`);
console.log(`TRIGGER_UNEXPECTED_DIFFERENCES:        ${triggerUnexpectedDiffs.length}`);
console.log('=============================================================');

const totalUnexpected = unexpectedDiffs.length + functionUnexpectedDiffs.length + triggerUnexpectedDiffs.length;

if (totalUnexpected > 0) {
  if (unexpectedDiffs.length > 0) {
    console.log('\nTable Schema Unexpected Differences:');
    console.table(unexpectedDiffs);
  }
  if (functionUnexpectedDiffs.length > 0) {
    console.log('\nFunction Unexpected Differences:');
    console.table(functionUnexpectedDiffs);
  }
  if (triggerUnexpectedDiffs.length > 0) {
    console.log('\nTrigger Unexpected Differences:');
    console.table(triggerUnexpectedDiffs);
  }
  process.exit(1);
} else {
  console.log('\nCRITERION SATISFIED:');
  console.log('  TABLE_SCHEMA_UNEXPECTED_DIFFERENCES = 0');
  console.log('  FUNCTION_UNEXPECTED_DIFFERENCES = 0');
  console.log('  TRIGGER_UNEXPECTED_DIFFERENCES = 0');
}
