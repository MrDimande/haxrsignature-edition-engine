import {
  INVITATIONS,
  LEGACY_SLUG_REDIRECTS,
  type InvitationAdminBinding,
} from "@data/invitations";

export interface EditionEventBinding {
  slug: string;
  eventId: string;
  eventName: string;
  clientName: string;
  envVar: string;
}

/** Slug canónico (ex.: jessicakhulaya → jessicakulaya) */
export function resolveInvitationSlug(slug?: string): string | null {
  if (!slug) return null;
  const normalized = slug.trim().toLowerCase();
  if (INVITATIONS[normalized]) return normalized;
  return LEGACY_SLUG_REDIRECTS[normalized] ?? null;
}

function readEventId(envVar: string): string | undefined {
  const primary = process.env[envVar]?.trim();
  if (primary) return primary;

  /** Compatibilidade com variáveis antigas */
  const legacyMap: Record<string, string> = {
    EDITION_EVENT_JESSICA_KULAYA_ID: "KULAYA_EVENT_ID",
    EDITION_EVENT_JESSICA_LOBOLO_ID: "LOBOLO_EVENT_ID",
    EDITION_EVENT_JESSICA_TRADITIONAL_ID: "TRADITIONAL_WEDDING_EVENT_ID",
    EDITION_EVENT_JESSICA_FAREWELL_ID: "FAREWELL_EVENT_ID",
  };
  const legacyKey = legacyMap[envVar];
  if (legacyKey) {
    return process.env[legacyKey]?.trim();
  }

  return undefined;
}

export function getInvitationAdminBinding(
  slug?: string
): (InvitationAdminBinding & { slug: string }) | null {
  const resolved = resolveInvitationSlug(slug);
  if (!resolved) return null;

  const config = INVITATIONS[resolved];
  if (!config?.admin) return null;

  return { slug: resolved, ...config.admin };
}

export function getEditionEventBinding(slug?: string): EditionEventBinding | null {
  const binding = getInvitationAdminBinding(slug);
  if (!binding) return null;

  const eventId = readEventId(binding.envVar);
  if (!eventId) return null;

  return {
    slug: binding.slug,
    eventId,
    eventName: binding.adminEventName,
    clientName: binding.clientName,
    envVar: binding.envVar,
  };
}

export function isEditionPersistenceConfigured(slug?: string): boolean {
  return Boolean(getEditionEventBinding(slug));
}

export function listEditionAdminBindings(): Array<
  InvitationAdminBinding & { slug: string; configured: boolean }
> {
  return Object.values(INVITATIONS)
    .filter((invitation) => invitation.admin)
    .map((invitation) => ({
      slug: invitation.slug,
      ...invitation.admin!,
      configured: Boolean(readEventId(invitation.admin!.envVar)),
    }));
}
