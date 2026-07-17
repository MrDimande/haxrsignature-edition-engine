const EDITION_STORAGE_PREFIX = "haxr:edition";

/** Scoped RSVP persistence — one key per invitation slug. */
export function buildEditionRsvpStorageKey(slug: string): string {
  return `${EDITION_STORAGE_PREFIX}:${slug}:rsvp:v1`;
}

/** Scoped gift reservation lock — never share across invitations. */
export function buildEditionGiftStorageKey(slug: string): string {
  return `${EDITION_STORAGE_PREFIX}:${slug}:gifts:v1`;
}

/** Legacy key used before slug-scoped storage. */
export function buildLegacyRsvpStorageKey(slug: string): string {
  return `haxr_rsvp_${slug}`;
}

/** Legacy global gift lock that blocked every rose invite in the same browser. */
export const LEGACY_GLOBAL_GIFT_STORAGE_KEY = "haxr_reserved_gift_id";
