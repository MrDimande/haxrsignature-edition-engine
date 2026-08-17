import { resolveSlug } from "@lib/engine";
import { createAdminClient, isSupabaseConfigured } from "@lib/supabase/server";
import {
  getInvitation,
  type InvitationConfig,
  type MemoriesVariant,
  type InvitationCompetitionConfig,
  type PlusMemoriesPackage,
} from "@data/invitations";
import {
  JESSICA_SAMUEL_CHALLENGE_PHASES,
  JESSICA_SAMUEL_PHASES,
  type MemoriesPhase,
} from "./phases";

export const PLUS_MEMORIES_CHALLENGE_WHITELIST = [
  "01", "02", "03", "04", "05", "06",
  "07", "08", "09", "10", "11", "12",
] as const;

export type MemoriesSourceType = "haxr-invitation" | "standalone";
export type MemoriesExperienceStatus = "active" | "disabled" | "archived";

export interface MemoriesVoiceConfig {
  enabled: boolean;
  maxDurationSeconds: number;
  visibility: "hosts-only";
  maxFileSizeBytes: number;
  acceptedMimeTypes: readonly string[];
}

export interface MemoriesRuntimeFeatures {
  phases: boolean;
  challenges: boolean;
  competition: boolean;
  voiceMessages: boolean;
  gallery: boolean;
  offline: boolean;
}

export interface MemoriesEventConfig {
  enabled: true;
  experienceId: string | null;
  eventSlug: string;
  invitationSlug: string | null;
  storageSlug: string;
  sourceType: MemoriesSourceType;
  displayName: string;
  eventType: string;
  eventDate: string | null;
  status: MemoriesExperienceStatus;
  package: PlusMemoriesPackage;
  features: MemoriesRuntimeFeatures;
  variant: MemoriesVariant;
  bucket: string;
  opensAt: string | null;
  closesAt: string | null;
  moderationRequired: boolean;
  publicGalleryEnabled: boolean;
  maxImageFileSizeBytes: number;
  maxVideoFileSizeBytes: number;
  acceptedImageMimeTypes: readonly string[];
  acceptedVideoMimeTypes: readonly string[];
  maxCaptionLength: number;
  maxGuestNameLength: number;
  signedUrlTtlSeconds: number;
  uploadIntentTtlSeconds: number;
  competition: InvitationCompetitionConfig | null;
  challengeWhitelist: readonly string[];
  phases: readonly MemoriesPhase[];
  challengePhaseMapping: Readonly<Record<string, string>>;
  voiceMessages: MemoriesVoiceConfig;
}

const MEMORIES_DEFAULTS = {
  bucket: "wedding-photos",
  opensAt: null,
  closesAt: null,
  moderationRequired: true,
  publicGalleryEnabled: true,
  maxImageFileSizeBytes: 25 * 1024 * 1024,
  maxVideoFileSizeBytes: 100 * 1024 * 1024,
  acceptedImageMimeTypes: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
  ] as const,
  acceptedVideoMimeTypes: [
    "video/mp4",
    "video/quicktime",
    "video/webm",
  ] as const,
  maxCaptionLength: 200,
  maxGuestNameLength: 80,
  signedUrlTtlSeconds: 300,
  uploadIntentTtlSeconds: 15 * 60,
} as const;

const VOICE_DEFAULTS: MemoriesVoiceConfig = {
  enabled: false,
  maxDurationSeconds: 45,
  visibility: "hosts-only",
  maxFileSizeBytes: 10 * 1024 * 1024,
  acceptedMimeTypes: ["audio/webm", "audio/mp4", "audio/ogg", "audio/mpeg"],
};

const DEFAULT_RUNTIME_FEATURES: MemoriesRuntimeFeatures = {
  phases: false,
  challenges: true,
  competition: false,
  voiceMessages: false,
  gallery: true,
  offline: true,
};

export const MEMORIES_ACCEPTED_MIME_TYPES = [
  ...MEMORIES_DEFAULTS.acceptedImageMimeTypes,
  ...MEMORIES_DEFAULTS.acceptedVideoMimeTypes,
] as const;

export type MemoriesMimeType = (typeof MEMORIES_ACCEPTED_MIME_TYPES)[number];

export type MemoryExperienceRow = {
  id: string;
  event_slug: string;
  invitation_slug: string | null;
  source_type: MemoriesSourceType;
  display_name: string;
  event_type: string;
  status: MemoriesExperienceStatus;
  package: PlusMemoriesPackage;
  memories_variant: "plus-memories";
  storage_slug: string;
  features: Record<string, unknown> | null;
};

function booleanFeature(
  features: Record<string, unknown> | null,
  key: keyof MemoriesRuntimeFeatures,
  fallback: boolean
): boolean {
  const value = features?.[key];
  return typeof value === "boolean" ? value : fallback;
}

function runtimeFeaturesFromRow(
  row: MemoryExperienceRow
): MemoriesRuntimeFeatures {
  const features = row.features;
  return {
    phases: booleanFeature(features, "phases", false),
    challenges: booleanFeature(features, "challenges", true),
    competition: booleanFeature(features, "competition", false),
    voiceMessages: booleanFeature(features, "voiceMessages", false),
    gallery: booleanFeature(features, "gallery", true),
    offline: booleanFeature(features, "offline", true),
  };
}

function commonConfig(input: {
  experienceId: string | null;
  eventSlug: string;
  invitationSlug: string | null;
  storageSlug: string;
  sourceType: MemoriesSourceType;
  displayName: string;
  eventType: string;
  eventDate: string | null;
  status: MemoriesExperienceStatus;
  package: PlusMemoriesPackage;
  variant: MemoriesVariant;
  features: MemoriesRuntimeFeatures;
  competition: InvitationCompetitionConfig | null;
}): MemoriesEventConfig {
  const phasesEnabled = input.variant === "plus-memories" && input.features.phases;
  const voiceEnabled = input.variant === "plus-memories" && input.features.voiceMessages;

  return {
    enabled: true,
    ...input,
    ...MEMORIES_DEFAULTS,
    challengeWhitelist: PLUS_MEMORIES_CHALLENGE_WHITELIST,
    phases: phasesEnabled ? JESSICA_SAMUEL_PHASES : [],
    challengePhaseMapping: phasesEnabled ? JESSICA_SAMUEL_CHALLENGE_PHASES : {},
    voiceMessages: {
      ...VOICE_DEFAULTS,
      enabled: voiceEnabled,
    },
  };
}

export function mapMemoryExperienceRow(
  row: MemoryExperienceRow
): MemoriesEventConfig {
  const features = runtimeFeaturesFromRow(row);
  const competition: InvitationCompetitionConfig | null = features.competition
    ? { enabled: true, mode: "unique-challenges", totalChallenges: 12 }
    : null;

  return commonConfig({
    experienceId: row.id,
    eventSlug: row.event_slug,
    invitationSlug: row.invitation_slug,
    storageSlug: row.storage_slug,
    sourceType: row.source_type,
    displayName: row.display_name,
    eventType: row.event_type,
    eventDate: null,
    status: row.status,
    package: row.package,
    variant: row.memories_variant,
    features,
    competition,
  });
}

export function resolveMemoriesConfig(slug: string): MemoriesEventConfig | null {
  const canonical = resolveSlug(slug);
  if (!canonical) return null;

  const invitation = getInvitation(canonical);
  if (!invitation || invitation.status !== "active") return null;
  if (!invitation.features?.memories?.enabled) return null;

  const memoriesFeature = invitation.features.memories;
  const competition = memoriesFeature.competition ?? null;

  return commonConfig({
    experienceId: null,
    eventSlug: invitation.slug,
    invitationSlug: invitation.slug,
    storageSlug: invitation.slug,
    sourceType: "haxr-invitation",
    displayName: memoriesFeature.displayName ?? invitation.admin?.clientName ?? invitation.metadata.title,
    eventType: invitation.metadata.eventType,
    eventDate: invitation.metadata.date || invitation.metadata.eventDate || null,
    status: "active",
    package: memoriesFeature.package ?? "collection",
    variant: memoriesFeature.variant,
    features: {
      ...DEFAULT_RUNTIME_FEATURES,
      phases: Boolean(memoriesFeature.phases?.enabled),
      competition: Boolean(competition?.enabled),
      voiceMessages: Boolean(memoriesFeature.voiceMessages?.enabled),
    },
    competition,
  });
}

export async function resolveMemoriesConfigAsync(
  slug: string
): Promise<MemoriesEventConfig | null> {
  const staticConfig = resolveMemoriesConfig(slug);
  const eventSlug = staticConfig?.eventSlug ?? slug.trim().toLowerCase();

  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("memory_experiences")
        .select(
          "id, event_slug, invitation_slug, source_type, display_name, event_type, status, package, memories_variant, storage_slug, features"
        )
        .eq("event_slug", eventSlug)
        .eq("status", "active")
        .maybeSingle();

      if (!error && data) {
        return mapMemoryExperienceRow(data as MemoryExperienceRow);
      }
    } catch {
      // Invitation-backed routes retain their established resolver during migration rollout.
    }
  }

  return staticConfig;
}

export function isMemoriesEnabledForSlug(slug: string): boolean {
  return resolveMemoriesConfig(slug) !== null;
}

export function getMemoriesInvitation(slug: string): InvitationConfig | null {
  const canonical = resolveSlug(slug);
  if (!canonical) return null;
  const invitation = getInvitation(canonical);
  if (!invitation || invitation.status !== "active") return null;
  if (!invitation.features?.memories?.enabled) return null;
  return invitation;
}
