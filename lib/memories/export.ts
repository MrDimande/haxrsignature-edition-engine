import JSZip from "jszip";
import { isMemoriesDatabaseConfigured, listMemoryExportRows } from "./database";
import { downloadMemoryObject, isMemoriesStorageConfigured } from "./storage";
import { resolveMemoriesConfig } from "./config";
import { PLUS_MEMORY_CHALLENGES, WEDDING_TABLES } from "@engines/true-theme/profiles/jessica-samuel-wedding/memories/plus-memorias-challenges";
import { MEMORY_CHALLENGES as TRADITIONAL_CHALLENGES } from "@engines/true-theme/profiles/primavera-lobolo/memories/memorias-challenges";

function sanitizeFolderName(str: string): string {
  return str.normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_").slice(0, 40);
}

function sanitizeFileName(str: string): string {
  return str.normalize("NFKD").replace(/[^\w.-]/g, "_").replace(/_+/g, "_").slice(0, 60);
}

export async function generateMemoriesZip(slug: string): Promise<Buffer | null> {
  const config = resolveMemoriesConfig(slug);
  if (!config) return null;
  if (!isMemoriesDatabaseConfigured() || !isMemoriesStorageConfigured()) return null;

  let rows;
  try {
    rows = await listMemoryExportRows(config.invitationSlug);
  } catch {
    return null;
  }
  if (!rows.length) return null;

  const zip = new JSZip();
  const challenges = config.variant === "plus-memories" ? PLUS_MEMORY_CHALLENGES : TRADITIONAL_CHALLENGES;

  for (const row of rows) {
    let bytes: Uint8Array | null = null;
    try {
      bytes = await downloadMemoryObject({
        bucketName: config.bucket,
        storagePath: row.storagePath,
      });
    } catch {
      bytes = null;
    }
    if (!bytes) continue;

    const contentType = row.contentType?.trim() || "image/jpeg";
    const ext = contentType.startsWith("video/")
      ? contentType.includes("webm") ? "webm" : contentType.includes("quicktime") ? "mov" : "mp4"
      : contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";

    let folderPath = "Momentos_Espontaneos";
    if (row.tableId) {
      const tableInfo = WEDDING_TABLES.find((t) => t.id === row.tableId);
      folderPath = tableInfo
        ? `Por_Mesa/${tableInfo.id}_Mesa_${sanitizeFolderName(tableInfo.frenchName)}`
        : `Por_Mesa/Mesa_${row.tableId}`;
    } else if (row.challengeId) {
      const challenge = challenges.find((item) => item.id === row.challengeId);
      if (challenge) folderPath = `Por_Desafio/Desafio_${challenge.number}_${sanitizeFolderName(challenge.title)}`;
    }

    const author = row.guestName ? sanitizeFileName(row.guestName) : "Convidado";
    zip.folder(folderPath)?.file(`${row.id.slice(0, 8)}_${author}.${ext}`, bytes);
  }

  return zip.generateAsync({ type: "nodebuffer" });
}
