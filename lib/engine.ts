import {
  INVITATIONS,
  ALIAS_INDEX,
  getInvitation as getInvitationFromData,
  invitationSlugs,
  LEGACY_SLUG_REDIRECTS,
  type InvitationConfig,
  type InvitationStatus,
} from "@data/invitations";

export function getInvitation(slug: string): InvitationConfig | null {
  return getInvitationFromData(slug);
}

export function resolveSlug(slug: string): string | null {
  if (INVITATIONS[slug]) return slug;
  if (LEGACY_SLUG_REDIRECTS[slug]) return LEGACY_SLUG_REDIRECTS[slug];
  if (ALIAS_INDEX[slug]) return ALIAS_INDEX[slug];
  return null;
}

/** @internal Server-side only — never use on public-facing pages */
export function getAllInvitations(): Array<InvitationConfig> {
  return invitationSlugs.map((slug) => INVITATIONS[slug]);
}

/** @internal Server-side only — never use on public-facing pages */
export function getActiveInvitations(): Array<InvitationConfig> {
  return getAllInvitations().filter(
    (invitation) => invitation.status === "active"
  );
}

export function isValidInvitationSlug(slug: string): boolean {
  const resolved = resolveSlug(slug);
  if (!resolved) return false;
  const invitation = INVITATIONS[resolved];
  return invitation !== null && invitation.status === "active";
}

/** @internal Server-side only */
export function getInvitationsByStatus(
  status: InvitationStatus
): Array<InvitationConfig> {
  return getAllInvitations().filter(
    (invitation) => invitation.status === status
  );
}

export function getLegacyFolderForSlug(slug: string): string | null {
  const resolved = resolveSlug(slug);
  if (!resolved) return null;
  return INVITATIONS[resolved]?.legacyFolder ?? null;
}

export { INVITATIONS as InvitationRegistry };
