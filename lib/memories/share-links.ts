import { randomBytes } from "node:crypto";
import { createAdminClient, isSupabaseConfigured } from "@lib/supabase/server";
import {
  mapMemoryExperienceRow,
  type MemoriesEventConfig,
  type MemoryExperienceRow,
} from "./config";

const SHORT_CODE_ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
const SHORT_CODE_PATTERN = /^[A-Za-z0-9]{7,16}$/;

export interface ResolvedMemoryShareLink {
  config: MemoriesEventConfig;
  shareLinkId: string;
  destinationPath: string | null;
  scanCount: number;
}

type ShareLinkResolverRow = MemoryExperienceRow & {
  share_link_id: string;
  experience_id: string;
  experience_status: "active";
  destination_path: string | null;
  scan_count: number | string;
};

export function generateMemoriesShortCode(length = 7): string {
  if (!Number.isInteger(length) || length < 7 || length > 16) {
    throw new Error("Short code length must be between 7 and 16 characters.");
  }

  const rejectionLimit = 256 - (256 % SHORT_CODE_ALPHABET.length);
  let result = "";

  while (result.length < length) {
    const bytes = randomBytes(Math.max(16, length * 2));
    for (const byte of bytes) {
      if (byte >= rejectionLimit) continue;
      result += SHORT_CODE_ALPHABET[byte % SHORT_CODE_ALPHABET.length];
      if (result.length === length) break;
    }
  }

  return result;
}

export function isValidMemoriesShortCode(shortCode: string): boolean {
  return SHORT_CODE_PATTERN.test(shortCode);
}

export async function resolveMemoryShareLink(
  shortCode: string
): Promise<ResolvedMemoryShareLink | null> {
  if (!isValidMemoriesShortCode(shortCode) || !isSupabaseConfigured()) {
    return null;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("record_memory_share_link_scan", {
    p_short_code: shortCode,
  });

  if (error || !Array.isArray(data) || data.length !== 1) {
    return null;
  }

  const row = data[0] as ShareLinkResolverRow;
  const config = mapMemoryExperienceRow({
    id: row.experience_id,
    event_slug: row.event_slug,
    invitation_slug: row.invitation_slug,
    source_type: row.source_type,
    display_name: row.display_name,
    event_type: row.event_type,
    status: row.experience_status,
    package: row.package,
    memories_variant: row.memories_variant,
    storage_slug: row.storage_slug,
    features: row.features,
  });

  return {
    config,
    shareLinkId: row.share_link_id,
    destinationPath: row.destination_path,
    scanCount: Number(row.scan_count),
  };
}
