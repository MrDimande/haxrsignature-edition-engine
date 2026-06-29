/**
 * Metadados para criar eventos no admin Supabase.
 * Nome padrão: Edition · {eventTypeLabel} · {clientName}
 */
import { listEditionAdminBindings } from "@lib/rsvp/events";
import { INVITATIONS } from "@data/invitations";

export type EditionEventProvisionSpec = {
  slug: string;
  adminEventName: string;
  clientName: string;
  eventTypeLabel: string;
  eventDate: string | null;
  envVar: string;
  editionUrl: string;
  findSeatCode: string;
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  "https://edition.haxrsignature.com";

function slugToFindSeatCode(slug: string): string {
  return slug.replace(/[^a-z0-9]+/gi, "").slice(0, 12).toLowerCase() || "edition";
}

export function getEditionEventProvisionSpec(
  slug: string
): EditionEventProvisionSpec | null {
  const invitation = INVITATIONS[slug];
  if (!invitation?.admin) return null;

  return {
    slug: invitation.slug,
    adminEventName: invitation.admin.adminEventName,
    clientName: invitation.admin.clientName,
    eventTypeLabel: invitation.admin.eventTypeLabel,
    eventDate: invitation.metadata.date || invitation.metadata.eventDate || null,
    envVar: invitation.admin.envVar,
    editionUrl: `${SITE_URL}/${invitation.slug}`,
    findSeatCode: slugToFindSeatCode(invitation.slug),
  };
}

export function formatEnvLocalEventBlock(
  envVar: string,
  eventId: string,
  adminEventName: string,
  clientName: string
): string {
  return [
    `# ${adminEventName} · cliente: ${clientName}`,
    `${envVar}=${eventId}`,
  ].join("\n");
}

export function getMissingEditionEventBindings() {
  return listEditionAdminBindings().filter((binding) => !binding.configured);
}
