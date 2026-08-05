/**
 * Manifesto de assets — Nian · NIGHT OF THE WEB
 *
 * Poster com tipografia baked-in → só social / OG / thumbnail.
 * Hero usa HTML real + slot heroClean (pending) — nunca o poster.
 */

export type NianAssetStatus =
  | "pending"
  | "generated"
  | "received"
  | "approved";

export type NianAssetOrientation = "portrait" | "landscape" | "square";

export interface NianAssetSpec {
  id: string;
  file: string;
  purpose: string;
  section: string;
  orientation: NianAssetOrientation;
  aspectRatio: string;
  status: NianAssetStatus;
  alt?: string;
  width?: number;
  height?: number;
  notes?: string;
  /** Corner sparkle / losango — use NianImageArtifactMask */
  hasCornerArtifact?: boolean;
}

/** Paths canónicos para consumo da experiência */
export const NIAN_ASSET_PATHS = {
  hero: {
    clean: "/images/nian/hero/nian-hero-clean.webp",
    poster: "/images/nian/social/nian-poster.png",
    og: "/images/nian/social/nian-og.png",
  },
  story: {
    origin: "/images/nian/cinematic/nian-origin.webp",
    action: "/images/nian/cinematic/nian-action.webp",
    teamUp: "/images/nian/cinematic/nian-team-up.webp",
    closing: "/images/nian/cinematic/nian-closing.webp",
    spiderSquad: "/images/nian/cinematic/nian-spider-squad.webp",
  },
  originals: {
    poster: "/images/nian/originals/nian-poster-master.png",
    origin: "/images/nian/originals/nian-origin-master.png",
    action: "/images/nian/originals/nian-action-master.png",
    teamUp: "/images/nian/originals/nian-team-up-master.png",
    closing: "/images/nian/originals/nian-closing-master.png",
    /** Master da Foto 3 / Spider Squad — preservar */
    galleryAlt: "/images/nian/originals/nian-gallery-alt-master.png",
  },
} as const;

export const NIAN_ASSET_ALTS = {
  origin: "Retrato editorial do Nian diante de uma cidade ao anoitecer",
  action: "Nian em pose de acção num rooftop iluminado pela cidade",
  teamUp:
    "Nian e o seu pequeno companheiro vestidos como heróis numa noite urbana",
  closing:
    "Nian estende a mão e convida os convidados a entrar na aventura",
  spiderSquad:
    "Nian e o seu pequeno companheiro em poses de heróis num cenário azul e vermelho",
  poster: "Poster Nian — NIGHT OF THE WEB · A Ascensão do Herói",
  og: "Nian — NIGHT OF THE WEB · partilha social",
} as const;

export const NIAN_ASSETS_MANIFEST: NianAssetSpec[] = [
  {
    id: "hero-clean",
    file: NIAN_ASSET_PATHS.hero.clean,
    purpose: "Hero clean — protagonista sem tipografia baked-in",
    section: "hero",
    orientation: "portrait",
    aspectRatio: "3:4",
    status: "pending",
    notes:
      "Enquanto ausente, Hero usa stand-in cinematográfico. Nunca usar o poster com texto.",
  },
  {
    id: "social-poster",
    file: NIAN_ASSET_PATHS.hero.poster,
    purpose: "Poster social / thumbnail — tipografia incorporada",
    section: "social",
    orientation: "portrait",
    aspectRatio: "9:16",
    status: "received",
    alt: NIAN_ASSET_ALTS.poster,
    width: 576,
    height: 1024,
    notes: "Só OG / partilha / preview — não usar como background do Hero.",
  },
  {
    id: "social-og",
    file: NIAN_ASSET_PATHS.hero.og,
    purpose: "Open Graph 1200×630",
    section: "social",
    orientation: "landscape",
    aspectRatio: "1200×630",
    status: "generated",
    alt: NIAN_ASSET_ALTS.og,
    width: 1200,
    height: 630,
  },
  {
    id: "story-origin",
    file: NIAN_ASSET_PATHS.story.origin,
    purpose: "Origin Beat",
    section: "origin",
    orientation: "portrait",
    aspectRatio: "3:4",
    status: "received",
    alt: NIAN_ASSET_ALTS.origin,
    width: 687,
    height: 1024,
    hasCornerArtifact: true,
  },
  {
    id: "story-action",
    file: NIAN_ASSET_PATHS.story.action,
    purpose: "Action Beat",
    section: "action",
    orientation: "portrait",
    aspectRatio: "3:4",
    status: "received",
    alt: NIAN_ASSET_ALTS.action,
    width: 687,
    height: 1024,
    hasCornerArtifact: true,
  },
  {
    id: "story-team-up",
    file: NIAN_ASSET_PATHS.story.teamUp,
    purpose: "Team-Up",
    section: "team-up",
    orientation: "portrait",
    aspectRatio: "3:4",
    status: "received",
    alt: NIAN_ASSET_ALTS.teamUp,
    width: 768,
    height: 1024,
    hasCornerArtifact: true,
  },
  {
    id: "story-closing",
    file: NIAN_ASSET_PATHS.story.closing,
    purpose: "Closing / RSVP bridge",
    section: "closing",
    orientation: "portrait",
    aspectRatio: "9:16",
    status: "received",
    alt: NIAN_ASSET_ALTS.closing,
    width: 576,
    height: 1024,
    hasCornerArtifact: true,
  },
  {
    id: "story-spider-squad",
    file: NIAN_ASSET_PATHS.story.spiderSquad,
    purpose: "Spider Squad — Foto 3 (secção ainda não implementada)",
    section: "spider-squad",
    orientation: "portrait",
    aspectRatio: "3:4",
    status: "received",
    alt: NIAN_ASSET_ALTS.spiderSquad,
    width: 687,
    height: 1024,
    hasCornerArtifact: true,
    notes:
      "Master: originals/nian-gallery-alt-master.png. Não usar no Hero. Secção diferida.",
  },
  {
    id: "gallery-alt-master",
    file: NIAN_ASSET_PATHS.originals.galleryAlt,
    purpose: "Master Spider Squad / Foto 3",
    section: "originals",
    orientation: "portrait",
    aspectRatio: "3:4",
    status: "received",
    width: 687,
    height: 1024,
    notes: "Preservar — fonte de nian-spider-squad.webp",
  },
  {
    id: "audio-sunflower-authorized",
    file: "/audio/nian/sunflower-authorized.mp3",
    purpose: "Trilha autorizada Sunflower",
    section: "audio",
    orientation: "landscape",
    aspectRatio: "n/a",
    status: "pending",
  },
  {
    id: "audio-sunflower-placeholder",
    file: "/audio/nian/sunflower-placeholder.mp3",
    purpose: "Placeholder silencioso enquanto autorizado não existe",
    section: "audio",
    orientation: "landscape",
    aspectRatio: "n/a",
    status: "generated",
  },
];

export function getNianAsset(id: string): NianAssetSpec | undefined {
  return NIAN_ASSETS_MANIFEST.find((asset) => asset.id === id);
}

export function isNianAssetReady(id: string): boolean {
  const asset = getNianAsset(id);
  return Boolean(
    asset && (asset.status === "received" || asset.status === "approved")
  );
}

/**
 * Hero photo — only the clean plate when received.
 * Never returns the poster (baked typography).
 */
export function getNianHeroPhotoSrc(): string | null {
  if (!isNianAssetReady("hero-clean")) return null;
  return NIAN_ASSET_PATHS.hero.clean;
}

export function getNianStoryImage(
  key: keyof typeof NIAN_ASSET_PATHS.story
): { src: string; alt: string; hasCornerArtifact: boolean } | null {
  const idMap = {
    origin: "story-origin",
    action: "story-action",
    teamUp: "story-team-up",
    closing: "story-closing",
    spiderSquad: "story-spider-squad",
  } as const;
  const asset = getNianAsset(idMap[key]);
  if (!asset || !isNianAssetReady(asset.id)) return null;
  return {
    src: asset.file,
    alt: asset.alt ?? "",
    hasCornerArtifact: Boolean(asset.hasCornerArtifact),
  };
}

/** Responsive sizes hint for cinematic portraits */
export const NIAN_CINEMATIC_SIZES =
  "(max-width: 640px) 92vw, (max-width: 1024px) 56vw, 480px";
