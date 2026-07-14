import {
  ALIAS_INDEX,
  INVITATIONS,
  LEGACY_SLUG_REDIRECTS,
  activeInvitationSlugs,
  type InvitationConfig,
} from "@data/invitations";

/** Active invitation slugs only — public surface allowlist */
export const ACTIVE_INVITATION_ALLOWLIST: readonly string[] =
  Object.freeze([...activeInvitationSlugs]);

export function isActiveInvitationSlug(slug: string): boolean {
  const invitation = INVITATIONS[slug];
  return Boolean(invitation && invitation.status === "active");
}

/**
 * Resolve any known slug / alias / legacy redirect to a canonical slug.
 * Does NOT fall back to another event. Returns null when unknown.
 */
export function resolveCanonicalInvitationSlug(
  slug?: string | null
): string | null {
  if (!slug || typeof slug !== "string") return null;
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;

  if (INVITATIONS[normalized]) return normalized;
  if (LEGACY_SLUG_REDIRECTS[normalized]) {
    return LEGACY_SLUG_REDIRECTS[normalized];
  }
  if (ALIAS_INDEX[normalized]) return ALIAS_INDEX[normalized];
  return null;
}

/** Resolve only when the invitation is active (drafts / archived → null) */
export function resolveActiveInvitationSlug(
  slug?: string | null
): string | null {
  const canonical = resolveCanonicalInvitationSlug(slug);
  if (!canonical) return null;
  if (!isActiveInvitationSlug(canonical)) return null;
  return canonical;
}

export function getActiveInvitationOrNull(
  slug?: string | null
): InvitationConfig | null {
  const canonical = resolveActiveInvitationSlug(slug);
  if (!canonical) return null;
  return INVITATIONS[canonical] ?? null;
}
