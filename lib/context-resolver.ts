import { resolveSlug } from "@lib/engine";

export type InvitationContext = {
  slug: string;
  giftsRegistryKey?: string;
  photoWallEnabled?: boolean;
  photoWallBucket?: string;
};

const SLUG_ALIASES: Record<string, string> = {
  jessicasamuelwedding: "jessica-samuel",
};

const INVITATION_FEATURES: Record<string, Omit<InvitationContext, "slug">> = {
  "jessica-samuel": {
    giftsRegistryKey: "jessica-samuel",
    photoWallEnabled: true,
    photoWallBucket: "wedding-photos",
  },
  jessicachadelingerie: {
    giftsRegistryKey: "rose-elegance",
  },
};

export function resolveInvitationContext(rawSlug: string): InvitationContext | null {
  const trimmed = rawSlug.trim();
  if (!trimmed) return null;

  const aliased = SLUG_ALIASES[trimmed] ?? SLUG_ALIASES[trimmed.toLowerCase()] ?? trimmed;
  const canonical = resolveSlug(aliased) ?? resolveSlug(trimmed) ?? aliased;
  const features = INVITATION_FEATURES[canonical];
  if (!features) return null;

  return { slug: canonical, ...features };
}
