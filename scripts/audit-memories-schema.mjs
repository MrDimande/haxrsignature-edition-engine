import { Client } from "pg";

// Catálogo apenas: não selecciona convidados, media, sessões, tokens ou outros dados reais.
if (process.env.MEMORIES_SCHEMA_AUDIT_TARGET !== "preview") {
  console.error("schema_audit_unavailable: confirme primeiro o alvo Preview e defina MEMORIES_SCHEMA_AUDIT_TARGET=preview");
  process.exitCode = 1;
} else if (!process.env.DATABASE_URL) {
  console.error("schema_audit_unavailable: configure uma ligação de leitura fora do chat");
  process.exitCode = 1;
} else {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
    application_name: "haxr-memories-schema-readonly",
    ssl: { rejectUnauthorized: true },
  });
  try {
    await client.connect();
    await client.query("BEGIN READ ONLY");
    await client.query("SET LOCAL statement_timeout = '10s'");
    const { rows: columns } = await client.query(`
      SELECT c.table_schema, c.table_name, c.column_name, c.data_type,
             c.udt_name, c.is_nullable
      FROM information_schema.columns c
      WHERE c.table_schema = 'public' AND (
        c.table_name IN ('events','client_events','guests','seats','wedding_photos','photo_upload_intents')
        OR c.table_name ~ '(memor|share_link|access_link|participant|session)'
      ) ORDER BY c.table_name, c.ordinal_position
    `);
    const names = [...new Set(columns.map((column) => column.table_name))];
    const { rows: constraints } = await client.query(`
      SELECT r.relname AS table_name, c.conname AS name, c.contype AS type,
             c.convalidated AS validated, pg_get_constraintdef(c.oid) AS definition
      FROM pg_constraint c JOIN pg_class r ON r.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = r.relnamespace
      WHERE n.nspname = 'public' AND r.relname = ANY($1::text[])
      ORDER BY r.relname, c.conname
    `, [names]);
    const { rows: indexes } = await client.query(`
      SELECT tablename AS table_name, indexname AS name, indexdef AS definition
      FROM pg_indexes WHERE schemaname = 'public' AND tablename = ANY($1::text[])
      ORDER BY tablename, indexname
    `, [names]);
    const { rows: relations } = await client.query(`
      SELECT c.relname AS table_name, c.relkind AS kind, c.relrowsecurity AS rls,
             c.relforcerowsecurity AS force_rls
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = ANY($1::text[]) ORDER BY c.relname
    `, [names]);
    const { rows: grants } = await client.query(`
      SELECT table_name, grantee, privilege_type, is_grantable
      FROM information_schema.table_privileges
      WHERE table_schema = 'public' AND table_name = ANY($1::text[])
      ORDER BY table_name, grantee, privilege_type
    `, [names]);
    const { rows: policies } = await client.query(`
      SELECT tablename AS table_name, policyname, permissive, roles, cmd, qual, with_check
      FROM pg_policies WHERE schemaname = 'public' AND tablename = ANY($1::text[])
      ORDER BY tablename, policyname
    `, [names]);
    const { rows: functions } = await client.query(`
      SELECT p.proname AS name, pg_get_function_identity_arguments(p.oid) AS arguments,
             p.prosecdef AS security_definer, p.proacl AS grants
      FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname ~ '(memor|photo|participant|session)'
      ORDER BY p.proname
    `);
    await client.query("ROLLBACK");
    console.log(JSON.stringify({ capturedAt: new Date().toISOString(), readOnly: true, columns, constraints, indexes, relations, grants, policies, functions }, null, 2));
  } catch {
    // Erros de ligação podem conter credenciais; não serializar o erro original.
    console.error("schema_audit_failed: catálogo não confirmado; nenhuma migration executada");
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}
