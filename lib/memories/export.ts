import JSZip from "jszip";
import { getEditionDatabaseProvider } from "@lib/db";
import { getMemoriesStorageProvider } from "./storage";
import { resolveMemoriesConfig } from "./config";
import { PLUS_MEMORY_CHALLENGES, WEDDING_TABLES } from "@engines/true-theme/profiles/jessica-samuel-wedding/memories/plus-memorias-challenges";
import { MEMORY_CHALLENGES as TRADITIONAL_CHALLENGES } from "@engines/true-theme/profiles/primavera-lobolo/memories/memorias-challenges";

function sanitizeFolderName(str: string): string {
  return str
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 40);
}

function sanitizeFileName(str: string): string {
  return str
    .normalize("NFKD")
    .replace(/[^\w.-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 60);
}

export async function generateMemoriesZip(slug: string): Promise<Buffer | null> {
  const config = resolveMemoriesConfig(slug);
  if (!config) return null;

  const db = getEditionDatabaseProvider();
  if (!db.isConfigured()) return null;

  const storageSlug = config.invitationSlug;
  const rows = await db.listMemoriesPhotos(storageSlug, 1000);
  if (!rows || rows.length === 0) return null;

  const storage = getMemoriesStorageProvider();
  const zip = new JSZip();
  const isPlus = config.variant === "plus-memories";
  const challenges = isPlus ? PLUS_MEMORY_CHALLENGES : TRADITIONAL_CHALLENGES;

  for (const row of rows) {
    try {
      const { downloadUrl } = await storage.createSignedDownloadUrl({
        storagePath: row.storage_path,
        expiresInSeconds: 600,
      });

      const response = await fetch(downloadUrl);
      if (!response.ok) continue;

      const arrayBuffer = await response.arrayBuffer();

      const contentType = row.content_type?.trim() || "image/jpeg";
      const ext = contentType.startsWith("video/")
        ? contentType.includes("webm") ? "webm" : contentType.includes("quicktime") ? "mov" : "mp4"
        : contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";

      let folderPath = "Momentos_Espontaneos";

      if (row.table_id) {
        const tableInfo = WEDDING_TABLES.find((t) => t.id === row.table_id);
        if (tableInfo) {
          folderPath = `Por_Mesa/${tableInfo.id}_Mesa_${sanitizeFolderName(tableInfo.frenchName)}`;
        } else {
          folderPath = `Por_Mesa/Mesa_${row.table_id}`;
        }
      } else if (row.challenge_id) {
        const ch = challenges.find((c) => c.id === row.challenge_id);
        if (ch) {
          folderPath = `Por_Desafio/Desafio_${ch.number}_${sanitizeFolderName(ch.title)}`;
        }
      }

      const author = row.guest_name ? sanitizeFileName(row.guest_name) : "Convidado";
      const shortId = row.id.slice(0, 8);
      const filename = `${shortId}_${author}.${ext}`;

      zip.folder(folderPath)?.file(filename, arrayBuffer);
    } catch {
      continue;
    }
  }

  const content = await zip.generateAsync({ type: "nodebuffer" });
  return content;
}
