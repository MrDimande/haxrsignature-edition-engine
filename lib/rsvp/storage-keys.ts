const EDITION_STORAGE_PREFIX = "haxr:edition";

export function buildEditionRsvpStorageKey(slug: string): string {
  return `${EDITION_STORAGE_PREFIX}:${slug}:rsvp:v1`;
}

export function buildEditionGiftStorageKey(slug: string): string {
  return `${EDITION_STORAGE_PREFIX}:${slug}:gifts:v1`;
}

export function buildLegacyRsvpStorageKey(slug: string): string {
  return `haxr_rsvp_${slug}`;
}
