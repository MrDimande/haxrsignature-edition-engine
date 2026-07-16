import {
  INVITATIONS,
  type InvitationAdminBinding,
} from "@data/invitations";
import {
  resolveActiveInvitationSlug,
  resolveCanonicalInvitationSlug,
} from "@lib/invitations/allowlist";

export interface EditionEventBinding {
  slug: string;
  eventId: string;
  eventName: string;
  clientName: string;
  envVar: string;
}

/**
 * Canonical slug resolution for RSVP / admin bindings.
 * Includes aliases and legacy redirects. No silent fallback to another event.
 */
export function resolveInvitationSlug(slug?: string): string | null {
  return resolveCanonicalInvitationSlug(slug);
}

/** Active invitations only — drafts must not receive RSVP persistence */
export function resolveActiveRsvpSlug(slug?: string): string | null {
  return resolveActiveInvitationSlug(slug);
}

function readEventId(envVar: string): string | undefined {
  const primary = process.env[envVar]?.trim();
  if (primary) return primary;

  /** Compatibilidade com variáveis antigas */
  const legacyMap: Record<string, string> = {
    EDITION_EVENT_JESSICA_KULAYA_ID: "KULAYA_EVENT_ID",
    EDITION_EVENT_JESSICA_LOBOLO_ID: "LOBOLO_EVENT_ID",
    EDITION_EVENT_JESSICA_TRADITIONAL_ID: "TRADITIONAL_WEDDING_EVENT_ID",
    EDITION_EVENT_JESSICA_WEDDING_ID: "WEDDING_EVENT_ID",
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
