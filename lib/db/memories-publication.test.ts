import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import { Pool } from "pg";
import { NeonDatabaseProvider } from "./neon-provider";
import { SupabaseDatabaseProvider } from "./supabase-provider";
import { closeNeonPool } from "./neon-client";

const SLUG = "evento-local";
const ID = "11111111-1111-4111-8111-111111111111";
const original = {
  DATABASE_URL: process.env.DATABASE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

describe("Queries de publicação/moderação — contrato dos adapters sem rede", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgres://localhost/isolated_memories_test";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://isolated.example";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "isolated-test-key";
    mock.method(globalThis, "fetch", async () => { throw new Error("Rede não autorizada no teste"); });
  });

  afterEach(async () => {
    await closeNeonPool();
    mock.restoreAll();
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("Neon filtra aprovação e evento em SQL parametrizado antes de limitar resultados", async () => {
    mock.method(Pool.prototype, "query", async (sql: string, values: unknown[]) => {
      assert.match(sql, /WHERE invitation_slug = \$1\s+AND moderation_status = 'approved'/);
      assert.match(sql, /ORDER BY created_at DESC, id DESC\s+LIMIT \$2/);
      assert.deepEqual(values, [SLUG, 100]);
      return { rows: [], rowCount: 0 };
    });
    assert.deepEqual(await new NeonDatabaseProvider().listMemoriesPhotos(SLUG), []);
  });

  it("Neon modera por ID e evento e devolve false para zero linhas", async () => {
    mock.method(Pool.prototype, "query", async (sql: string, values: unknown[]) => {
      assert.match(sql, /WHERE id = \$2\s+AND invitation_slug = \$3/);
      assert.deepEqual(values, ["approved", ID, SLUG]);
      return { rows: [], rowCount: 0 };
    });
    assert.equal(await new NeonDatabaseProvider().updateModerationStatus(ID, SLUG, "approved"), false);
  });

  it("adapter legado filtra aprovação e evento antes do limite", async () => {
    mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
      const url = new URL(input instanceof Request ? input.url : input.toString());
      assert.equal(url.hostname, "isolated.example");
      assert.equal(url.searchParams.get("invitation_slug"), `eq.${SLUG}`);
      assert.equal(url.searchParams.get("moderation_status"), "eq.approved");
      assert.equal(url.searchParams.get("limit"), "100");
      return Response.json([]);
    });
    assert.deepEqual(await new SupabaseDatabaseProvider().listMemoriesPhotos(SLUG), []);
  });

  it("adapter legado não declara moderação bem-sucedida se nenhuma linha corresponde ao evento", async () => {
    mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
      const url = new URL(input instanceof Request ? input.url : input.toString());
      assert.equal(url.searchParams.get("id"), `eq.${ID}`);
      assert.equal(url.searchParams.get("invitation_slug"), `eq.${SLUG}`);
      assert.equal(url.searchParams.get("select"), "id");
      return Response.json([]);
    });
    assert.equal(await new SupabaseDatabaseProvider().updateModerationStatus(ID, SLUG, "approved"), false);
  });
});
