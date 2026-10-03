import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  isBlessingsDatabaseConfigured,
  submitBlessingToDatabase,
  listBlessingsFromDatabase,
} from "./blessings-db";

/**
 * Teste de integração LIVE contra Neon.
 *
 * MEDIDAS DE SEGURANÇA MANDATÓRIAS:
 * 1. Opt-in estrito: exige RUN_BLESSINGS_INTEGRATION=1. Caso contrário, SKIP automático.
 * 2. Protecção contra Produção: recusa-se a executar contra o cluster de produção
 *    (ep-lingering-base-ay6jd085) a menos que ALLOW_PRODUCTION_TEST=1 seja explicitado.
 * 3. Nunca executado pelo runner padrão `npm test`.
 */
test("Blessings DB Integration: submit, duplicate idempotency, and listing (OPT-IN ONLY)", async () => {
  // 1. Guard de activação explícita
  if (process.env.RUN_BLESSINGS_INTEGRATION !== "1") {
    console.log("Skipping Blessings live integration: RUN_BLESSINGS_INTEGRATION=1 not set.");
    return;
  }

  // 2. Resolver URL
  let dbUrl = process.env.DATABASE_URL || "";
  if (!dbUrl && fs.existsSync(".env.neon.local")) {
    const lines = fs.readFileSync(".env.neon.local", "utf8").split(/\r?\n/);
    for (const l of lines) {
      if (l.startsWith("DATABASE_URL=")) {
        dbUrl = l.slice("DATABASE_URL=".length).trim().replace(/^["']|["']$/g, "");
      }
    }
  }

  if (!dbUrl) {
    console.log("Skipping Blessings live integration: DATABASE_URL not available.");
    return;
  }

  // 3. Protecção contra base de dados de produção
  const isProductionCluster =
    dbUrl.includes("ep-lingering-base-ay6jd085") ||
    dbUrl.includes("neondb.c-5.us-east-2");

  if (isProductionCluster && process.env.ALLOW_PRODUCTION_TEST !== "1") {
    throw new Error(
      "[SECURITY VIOLATION] O teste live de bênçãos não pode executar contra o cluster de produção (ep-lingering-base-ay6jd085). Utilize uma branch isolada do Neon ou defina ALLOW_PRODUCTION_TEST=1."
    );
  }

  process.env.DATABASE_URL = dbUrl;

  const testClientId = `test-b-${Date.now()}`;
  const slug = "neidyejosewedding";
  const author = "Auditor de Integração";
  const message = "Que Deus abençoe ricamente a união de Neidy e José!";

  // 4. Submissão inicial
  const res1 = await submitBlessingToDatabase(slug, testClientId, author, message);
  assert.equal(res1.ok, true, "First submission must succeed");
  if (res1.ok) {
    assert.equal(res1.persisted, true);
    assert.equal(res1.duplicate, false);
    assert.equal(res1.blessing.clientId, testClientId);
    assert.equal(res1.blessing.author, author);
    assert.equal(res1.blessing.message, message);
  }

  // 5. Submissão duplicada com mesmo clientId (Idempotência)
  const res2 = await submitBlessingToDatabase(slug, testClientId, author, message);
  assert.equal(res2.ok, true, "Duplicate submission must return ok: true");
  if (res2.ok) {
    assert.equal(res2.persisted, true);
    assert.equal(res2.duplicate, true, "Must flag duplicate: true");
    assert.equal(res2.blessing.clientId, testClientId);
  }

  // 6. Listar bênçãos e verificar o item
  const list = await listBlessingsFromDatabase(slug, 20);
  assert.ok(Array.isArray(list), "Must return an array");
  const found = list.find((b) => b.clientId === testClientId);
  assert.ok(found, "Newly submitted blessing must appear in list");
  assert.equal(found?.author, author);
  assert.equal(found?.message, message);

  // 7. Cleanup defensivo usando credencial administrativa apenas se fornecida explicitamente
  const ownerUrl = process.env.NEON_OWNER_DATABASE_URL;
  if (ownerUrl) {
    try {
      const pg = await import("pg");
      const Pool = pg.default.Pool || pg.Pool;
      const ownerPool = new Pool({
        connectionString: ownerUrl,
        ssl: { rejectUnauthorized: false },
      });
      await ownerPool.query(
        `DELETE FROM public.edition_blessings WHERE client_id = $1;`,
        [testClientId]
      );
      await ownerPool.end();
    } catch (err) {
      console.warn("Could not clean up test blessing:", err);
    }
  }
});
