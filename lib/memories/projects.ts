import { randomUUID } from "node:crypto";
import { getInvitation } from "@data/invitations";
import { getEditionSiteUrl } from "@lib/control-plane/config";
import { resolveSlug } from "@lib/engine";
import { createAdminClient, isSupabaseConfigured } from "@lib/supabase/server";
import type {
  MemoriesRuntimeFeatures,
  MemoriesSourceType,
} from "./config";
import { generateMemoriesShortCode } from "./share-links";
import { buildMemoriesPublicUrl } from "./qr";
import type { PlusMemoriesPackage } from "@data/invitations";

const EVENT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PACKAGES = new Set<PlusMemoriesPackage>([
  "collection",
  "couture",
  "signature",
]);

export interface CreateMemoriesProjectInput {
  displayName: string;
  eventType: string;
  sourceType: MemoriesSourceType;
  invitationSlug?: string;
  eventSlug?: string;
  package: PlusMemoriesPackage;
  estimatedGuestCount?: number;
  features: Partial<MemoriesRuntimeFeatures>;
}

export type CreateMemoriesProjectResult =
  | {
      success: true;
      experienceId: string;
      eventSlug: string;
      shortCode: string;
      publicUrl: string;
      label: "QR Principal";
      qrSvgUrl: string;
      qrPngUrl: string;
    }
  | { success: false; error: string; code: string };

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeFeatures(
  features: Partial<MemoriesRuntimeFeatures>
): MemoriesRuntimeFeatures {
  return {
    phases: features.phases === true,
    challenges: features.challenges !== false,
    competition: features.competition === true,
    voiceMessages: features.voiceMessages === true,
    gallery: features.gallery !== false,
    offline: features.offline !== false,
  };
}

export function validateMemoriesProjectInput(
  input: CreateMemoriesProjectInput
): string | null {
  if (!input.displayName.trim() || input.displayName.trim().length > 120) {
    return "Nome do evento inválido.";
  }
  if (!input.eventType.trim() || input.eventType.trim().length > 80) {
    return "Tipo de evento inválido.";
  }
  if (!PACKAGES.has(input.package)) {
    return "Package inválido.";
  }
  if (
    input.estimatedGuestCount !== undefined &&
    (!Number.isInteger(input.estimatedGuestCount) || input.estimatedGuestCount <= 0)
  ) {
    return "Quantidade estimada de convidados inválida.";
  }
  if (input.sourceType === "haxr-invitation" && !input.invitationSlug?.trim()) {
    return "Convite HAXR obrigatório.";
  }
  return null;
}

export async function createMemoriesProject(
  input: CreateMemoriesProjectInput
): Promise<CreateMemoriesProjectResult> {
  const validationError = validateMemoriesProjectInput(input);
  if (validationError) {
    return { success: false, error: validationError, code: "INVALID_INPUT" };
  }
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: "Serviço temporariamente indisponível.",
      code: "SERVICE_UNAVAILABLE",
    };
  }

  let invitationSlug: string | null = null;
  let eventSlug = slugify(input.eventSlug?.trim() || input.displayName);

  if (input.sourceType === "haxr-invitation") {
    const canonical = resolveSlug(input.invitationSlug!.trim());
    const invitation = canonical ? getInvitation(canonical) : null;
    if (
      !invitation ||
      invitation.status !== "active" ||
      invitation.features?.memories?.variant !== "plus-memories"
    ) {
      return {
        success: false,
        error: "Convite HAXR com Plus Memories não encontrado.",
        code: "INVITATION_NOT_FOUND",
      };
    }
    invitationSlug = invitation.slug;
    eventSlug = invitation.slug;
  } else if (resolveSlug(eventSlug)) {
    return {
      success: false,
      error: "O identificador do evento colide com um convite HAXR.",
      code: "EVENT_SLUG_CONFLICT",
    };
  }

  if (!EVENT_SLUG_PATTERN.test(eventSlug) || eventSlug.length < 3) {
    return {
      success: false,
      error: "Identificador do evento inválido.",
      code: "INVALID_EVENT_SLUG",
    };
  }

  const experienceId = randomUUID();
  const shareLinkId = randomUUID();
  const features = normalizeFeatures(input.features);
  const destinationPath = invitationSlug ? `/${invitationSlug}/memorias` : null;
  const supabase = createAdminClient();

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const shortCode = generateMemoriesShortCode();
    const { error } = await supabase.rpc(
      "create_memory_experience_with_share_link",
      {
        p_experience_id: experienceId,
        p_event_slug: eventSlug,
        p_invitation_slug: invitationSlug,
        p_source_type: input.sourceType,
        p_display_name: input.displayName.trim(),
        p_event_type: input.eventType.trim(),
        p_package: input.package,
        p_estimated_guest_count: input.estimatedGuestCount ?? null,
        p_storage_slug: eventSlug,
        p_features: features,
        p_share_link_id: shareLinkId,
        p_short_code: shortCode,
        p_label: "QR Principal",
        p_destination_path: destinationPath,
      }
    );

    if (!error) {
      const publicUrl = buildMemoriesPublicUrl(shortCode);
      const adminBase = `${getEditionSiteUrl().replace(/\/$/, "")}/api/memories/admin/share-links/${shortCode}/qr`;
      return {
        success: true,
        experienceId,
        eventSlug,
        shortCode,
        publicUrl,
        label: "QR Principal",
        qrSvgUrl: `${adminBase}?format=svg`,
        qrPngUrl: `${adminBase}?format=png`,
      };
    }

    if (error.code !== "23505" || !error.message.includes("short_code")) {
      const conflict = error.code === "23505";
      return {
        success: false,
        error: conflict
          ? "Já existe uma experiência com este evento."
          : "Não foi possível criar a experiência.",
        code: conflict ? "EXPERIENCE_CONFLICT" : "DATABASE_ERROR",
      };
    }
  }

  return {
    success: false,
    error: "Não foi possível gerar um ShareLink único.",
    code: "SHORT_CODE_COLLISION",
  };
}
