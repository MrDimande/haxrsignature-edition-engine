import fs from "node:fs";
import path from "node:path";
import { getNeonPool } from "@lib/db/neon-client";
import type { BlessingItem, SubmitBlessingResult } from "./types";

function ensureDatabaseUrl(): string {
  const current = (process.env.DATABASE_URL || "").trim();
  if (current) return current;

  try {
    for (const filename of [".env.neon.local", ".env.local"]) {
      const filePath = path.join(process.cwd(), filename);
      if (fs.existsSync(filePath)) {
        const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
        for (const line of lines) {
          if (line.startsWith("DATABASE_URL=")) {
            const val = line.slice(13).trim().replace(/^["']|["']$/g, "");
            if (val) {
              process.env.DATABASE_URL = val;
              return val;
            }
          }
        }
      }
    }
  } catch {}
  return "";
}

export function isBlessingsDatabaseConfigured(): boolean {
  return Boolean(ensureDatabaseUrl());
}

export async function submitBlessingToDatabase(
  slug: string,
  clientId: string,
  author: string,
  message: string
): Promise<SubmitBlessingResult> {
  if (!isBlessingsDatabaseConfigured()) {
    return { ok: false, error: "database_not_configured" };
  }

  try {
    const pool = getNeonPool();
    const { rows } = await pool.query(
      `SELECT public.submit_edition_blessing($1, $2, $3, $4) AS result`,
      [slug.trim(), clientId.trim(), author.trim(), message.trim()]
    );

    const result = rows[0]?.result;
    if (!result || !result.ok) {
      return {
        ok: false,
        error: result?.error || "insert_failed",
      };
    }

    return {
      ok: true,
      persisted: true,
      duplicate: Boolean(result.duplicate),
      blessing: {
        clientId: result.clientId,
        author: result.author,
        message: result.message,
        createdAt: result.createdAt,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[blessings-db] Error submitting blessing:", message);
    return { ok: false, error: "database_error", message };
  }
}

export async function listBlessingsFromDatabase(
  slug: string,
  limit: number = 60
): Promise<BlessingItem[]> {
  if (!isBlessingsDatabaseConfigured()) {
    return [];
  }

  try {
    const pool = getNeonPool();
    const { rows } = await pool.query(
      `SELECT public.list_edition_blessings($1, $2) AS result`,
      [slug.trim(), Math.min(Math.max(limit, 1), 100)]
    );

    const result = rows[0]?.result;
    if (Array.isArray(result)) {
      return result as BlessingItem[];
    }
    return [];
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[blessings-db] Error listing blessings:", message);
    return [];
  }
}
