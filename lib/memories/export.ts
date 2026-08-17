import JSZip from "jszip";
import { createAdminClient, isSupabaseConfigured } from "@lib/supabase/server";
import { resolveMemoriesConfigAsync } from "./config";
import { isValidPhaseId } from "./phases";
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

export async function generateMemoriesZip(
  slug: string,
  phaseId?: string
): Promise<Buffer | null> {
  const config = await resolveMemoriesConfigAsync(slug);
  if (!config) return null;
  if (phaseId && !isValidPhaseId(phaseId, config.phases)) return null;
  if (!isSupabaseConfigured()) return null;

  const supabase = createAdminClient();
  const bucketName = config.bucket;
  const storageSlug = config.storageSlug;

  // Buscar todas as memórias aprovadas/pendentes do evento
  let query = supabase
    .from("wedding_photos")
    .select("id, caption, guest_name, challenge_id, table_id, phase_id, created_at, storage_path, content_type, moderation_status")
    .eq("invitation_slug", storageSlug)
    .neq("moderation_status", "rejected")
    .order("created_at", { ascending: true });

  if (phaseId) query = query.eq("phase_id", phaseId);
  const { data: rows, error } = await query;

  if (error || !rows?.length) return null;

  const zip = new JSZip();
  const isPlus = config.variant === "plus-memories";
  const challenges = isPlus ? PLUS_MEMORY_CHALLENGES : TRADITIONAL_CHALLENGES;

  for (const row of rows) {
    // Baixar o ficheiro do storage
    const { data: blob, error: downloadErr } = await supabase.storage
      .from(bucketName)
      .download(row.storage_path);

    if (downloadErr || !blob) continue;

    const arrayBuffer = await blob.arrayBuffer();

    // Determinar extensão
    const contentType = row.content_type?.trim() || "image/jpeg";
    const ext = contentType.startsWith("video/")
      ? contentType.includes("webm") ? "webm" : contentType.includes("quicktime") ? "mov" : "mp4"
      : contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";

    // Determinar pasta de destino no ZIP
    let folderPath = "Momentos_Espontaneos";

    if (row.phase_id) {
      const phase = config.phases.find((item) => item.id === row.phase_id);
      folderPath = phase
        ? `Por_Fase/${sanitizeFolderName(phase.label)}`
        : `Por_Fase/${sanitizeFolderName(row.phase_id)}`;
    } else if (row.table_id) {
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

    // Nome do ficheiro
    const author = row.guest_name ? sanitizeFileName(row.guest_name) : "Convidado";
    const shortId = row.id.slice(0, 8);
    const filename = `${shortId}_${author}.${ext}`;

    // Adicionar ao ZIP
    zip.folder(folderPath)?.file(filename, arrayBuffer);
  }

  // Gerar o buffer final do arquivo ZIP
  const content = await zip.generateAsync({ type: "nodebuffer" });
  return content;
}
