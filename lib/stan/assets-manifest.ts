/**
 * Manifesto de assets — Convite Stan (5º Aniversário)
 * Sem imagens genéricas de outras crianças.
 * Estado: pending | generated | received | approved
 */

export type StanAssetStatus =
  | "pending"
  | "generated"
  | "received"
  | "approved";

export type StanAssetOrientation = "portrait" | "landscape" | "square";

export interface StanAssetSpec {
  id: string;
  /** Caminho público relativo a /public */
  file: string;
  purpose: string;
  orientation: StanAssetOrientation;
  /** Ex.: 3:4, 16:9, 1:1, 1200×630 */
  aspectRatio: string;
  minResolution: string;
  mobileVariantRequired: boolean;
  mobileFile?: string;
  focalPosition: string;
  status: StanAssetStatus;
  notes?: string;
}

export const STAN_ASSETS_MANIFEST: StanAssetSpec[] = [
  {
    id: "hero-main",
    file: "/images/stan/hero/hero-main.png",
    purpose: "Retrato do Stan — narrativa editorial / acto V (não no Hero)",
    orientation: "portrait",
    aspectRatio: "3:4",
    minResolution: "1200×1600",
    mobileVariantRequired: false,
    focalPosition: "center 18%",
    status: "received",
    notes: "Hero actual usa camisola STAN 5, não o retrato.",
  },
  {
    id: "tunnel-desktop",
    file: "/images/stan/hero/tunnel-desktop.png",
    purpose: "Fundo túnel — Ritual Gate desktop",
    orientation: "landscape",
    aspectRatio: "16:9",
    minResolution: "1920×1080",
    mobileVariantRequired: true,
    mobileFile: "/images/stan/hero/tunnel-mobile.png",
    focalPosition: "center",
    status: "generated",
  },
  {
    id: "tunnel-mobile",
    file: "/images/stan/hero/tunnel-mobile.png",
    purpose: "Fundo túnel — Ritual Gate mobile",
    orientation: "portrait",
    aspectRatio: "9:16",
    minResolution: "1080×1920",
    mobileVariantRequired: false,
    focalPosition: "center",
    status: "generated",
  },
  {
    id: "stadium-desktop",
    file: "/images/stan/hero/stadium-bg-desktop.png",
    purpose: "Fundo estádio noturno — desktop",
    orientation: "landscape",
    aspectRatio: "16:9",
    minResolution: "1920×1080",
    mobileVariantRequired: true,
    mobileFile: "/images/stan/hero/stadium-bg-mobile.png",
    focalPosition: "center",
    status: "received",
  },
  {
    id: "stadium-mobile",
    file: "/images/stan/hero/stadium-bg-mobile.png",
    purpose: "Fundo estádio noturno — mobile",
    orientation: "portrait",
    aspectRatio: "9:16",
    minResolution: "1080×1920",
    mobileVariantRequired: false,
    focalPosition: "center",
    status: "received",
  },
  {
    id: "lighting",
    file: "/images/stan/hero/lighting.png",
    purpose: "Overlay de iluminação / holofotes",
    orientation: "landscape",
    aspectRatio: "16:9",
    minResolution: "1920×1080",
    mobileVariantRequired: false,
    focalPosition: "center",
    status: "generated",
  },
  {
    id: "foreground-ball",
    file: "/images/stan/hero/foreground-ball.png",
    purpose: "Bola em primeiro plano (detalhe C)",
    orientation: "square",
    aspectRatio: "1:1",
    minResolution: "800×800",
    mobileVariantRequired: false,
    focalPosition: "center",
    status: "generated",
  },
  {
    id: "shirt-stan-5",
    file: "/images/stan/hero/stan-shirt-5.png",
    purpose: "Camisola STAN 5 — asset de apoio (Hero actual usa poster 3 camadas)",
    orientation: "portrait",
    aspectRatio: "3:4",
    minResolution: "1000×1333",
    mobileVariantRequired: false,
    focalPosition: "center 28%",
    status: "generated",
  },
  {
    id: "hero-poster-bg",
    file: "/images/stan/hero/poster-bg.png",
    purpose: "Cutout Stan — camada de fundo do Hero poster",
    orientation: "landscape",
    aspectRatio: "16:9",
    minResolution: "800×400",
    mobileVariantRequired: false,
    focalPosition: "center",
    status: "generated",
    notes: "rembg + grade a partir de idols/stan.png",
  },
  {
    id: "hero-poster-mid",
    file: "/images/stan/hero/poster-mid.png",
    purpose: "Cutout Stan — camada média do Hero poster (celebração)",
    orientation: "portrait",
    aspectRatio: "3:4",
    minResolution: "240×600",
    mobileVariantRequired: false,
    focalPosition: "center",
    status: "generated",
    notes: "rembg a partir de story/chapter-04/primary.png",
  },
  {
    id: "hero-poster-fg",
    file: "/images/stan/hero/poster-fg.png",
    purpose: "Cutout Stan — camada frontal do Hero poster (com bola)",
    orientation: "portrait",
    aspectRatio: "3:4",
    minResolution: "300×700",
    mobileVariantRequired: false,
    focalPosition: "center bottom",
    status: "generated",
    notes: "rembg a partir de closing/closing-stan.png",
  },
  {
    id: "hero-boots",
    file: "/images/stan/hero/boots.png",
    purpose: "Chuteiras premium — prop discreto do Hero",
    orientation: "landscape",
    aspectRatio: "4:3",
    minResolution: "800×600",
    mobileVariantRequired: false,
    focalPosition: "center",
    status: "generated",
  },
  {
    id: "hero-light-rays",
    file: "/images/stan/hero/light-rays.png",
    purpose: "Overlay feixes de luz / partículas — Hero",
    orientation: "portrait",
    aspectRatio: "9:16",
    minResolution: "1080×1920",
    mobileVariantRequired: false,
    focalPosition: "center top",
    status: "generated",
  },
  {
    id: "editorial-texture",
    file: "/images/stan/hero/editorial-texture.png",
    purpose: "Textura editorial subtil",
    orientation: "landscape",
    aspectRatio: "16:9",
    minResolution: "1920×1080",
    mobileVariantRequired: false,
    focalPosition: "center",
    status: "pending",
  },
  {
    id: "chapter-01",
    file: "/images/stan/story/chapter-01/ultrasound.png",
    purpose: "Capítulo 01 — Ultrassom (O começo)",
    orientation: "portrait",
    aspectRatio: "3:4",
    minResolution: "1200×1600",
    mobileVariantRequired: false,
    focalPosition: "center",
    status: "received",
  },
  {
    id: "chapter-02-primary",
    file: "/images/stan/story/chapter-02/primary.png",
    purpose: "Capítulo 02 — Primeiras descobertas (Ano 2)",
    orientation: "portrait",
    aspectRatio: "3:4",
    minResolution: "1200×1600",
    mobileVariantRequired: false,
    focalPosition: "center",
    status: "received",
  },
  {
    id: "chapter-02-detail",
    file: "/images/stan/story/chapter-02/detail.png",
    purpose: "Capítulo 02 — detalhe secundário",
    orientation: "square",
    aspectRatio: "1:1",
    minResolution: "1000×1000",
    mobileVariantRequired: false,
    focalPosition: "center",
    status: "received",
  },
  {
    id: "chapter-03",
    file: "/images/stan/story/chapter-03/primary.png",
    purpose: "Capítulo 03 — Energia em movimento (Ano 3)",
    orientation: "landscape",
    aspectRatio: "16:9",
    minResolution: "1600×900",
    mobileVariantRequired: false,
    focalPosition: "center",
    status: "received",
  },
  {
    id: "chapter-03-detail-c",
    file: "/images/stan/story/chapter-03/detail-c.png",
    purpose: "Capítulo 03 — Stan a brincar com pneu (exterior)",
    orientation: "portrait",
    aspectRatio: "3:4",
    minResolution: "800×1000",
    mobileVariantRequired: false,
    focalPosition: "center 30%",
    status: "received",
  },
  {
    id: "chapter-03-detail-d",
    file: "/images/stan/story/chapter-03/detail-d.png",
    purpose: "Capítulo 03 — Stan no patio, primeiras aventuras",
    orientation: "portrait",
    aspectRatio: "3:4",
    minResolution: "800×1000",
    mobileVariantRequired: false,
    focalPosition: "center 20%",
    status: "received",
  },
  {
    id: "chapter-04-primary",
    file: "/images/stan/story/chapter-04/primary.png",
    purpose: "Capítulo 04 — Nasce uma paixão (Ano 4)",
    orientation: "portrait",
    aspectRatio: "3:4",
    minResolution: "1200×1600",
    mobileVariantRequired: false,
    focalPosition: "center",
    status: "received",
  },
  {
    id: "chapter-05",
    file: "/images/stan/story/chapter-05/primary.png",
    purpose: "Capítulo 05 — O pequeno campeão (Ano 5)",
    orientation: "portrait",
    aspectRatio: "3:4",
    minResolution: "1200×1600",
    mobileVariantRequired: false,
    focalPosition: "center",
    status: "received",
  },
  {
    id: "chapter-05-detail",
    file: "/images/stan/story/chapter-05/detail.png",
    purpose: "Capítulo 05 — Stan com bola (navy), apoio ao finale",
    orientation: "portrait",
    aspectRatio: "3:4",
    minResolution: "800×1000",
    mobileVariantRequired: false,
    focalPosition: "center 20%",
    status: "received",
    notes: "Derivado de hero/hero-main.png — não é o traje tradicional",
  },
  {
    id: "idol-stan",
    file: "/images/stan/idols/stan.png",
    purpose: "Retrato central do Stan na secção de ídolos (dominante)",
    orientation: "portrait",
    aspectRatio: "3:4",
    minResolution: "1200×1600",
    mobileVariantRequired: false,
    focalPosition: "center",
    status: "received",
    notes: "Stan deve permanecer visualmente dominante face aos ídolos",
  },
  {
    id: "idol-mbappe",
    file: "/images/stan/idols/mbappe.jpg",
    purpose: "Fotografia de Kylian Mbappé (inspiração)",
    orientation: "portrait",
    aspectRatio: "3:4",
    minResolution: "1000×1333",
    mobileVariantRequired: false,
    focalPosition: "center top",
    status: "received",
    notes: "Real Madrid — celebração com braços cruzados; crop 3:4",
  },
  {
    id: "idol-cristiano",
    file: "/images/stan/idols/cristiano-ronaldo.jpg",
    purpose: "Fotografia de Cristiano Ronaldo (inspiração)",
    orientation: "portrait",
    aspectRatio: "3:4",
    minResolution: "1000×1333",
    mobileVariantRequired: false,
    focalPosition: "center",
    status: "received",
    notes: "Real Madrid — celebração SIU, costas RONALDO 7",
  },
  {
    id: "closing-stan",
    file: "/images/stan/closing/closing-stan.png",
    purpose: "Fotografia de encerramento / outro editorial",
    orientation: "portrait",
    aspectRatio: "3:4",
    minResolution: "1200×1600",
    mobileVariantRequired: false,
    focalPosition: "center",
    status: "received",
  },
  {
    id: "stan-og",
    file: "/images/stan/social/stan-og.png",
    purpose: "Open Graph / WhatsApp preview",
    orientation: "landscape",
    aspectRatio: "1200×630",
    minResolution: "1200×630",
    mobileVariantRequired: false,
    focalPosition: "center",
    status: "received",
  },
  {
    id: "audio-ambient",
    file: "/audio/stan/hala-madrid.mp3",
    purpose: "Hino Matchday — Hala Madrid y nada más (gate + experiência)",
    orientation: "landscape",
    aspectRatio: "n/a",
    minResolution: "n/a",
    mobileVariantRequired: false,
    focalPosition: "n/a",
    status: "received",
    notes: "Licença / uso autorizado pela família para o convite Edition",
  },
  {
    id: "audio-whistle",
    file: "/audio/stan/whistle.mp3",
    purpose: "Apito curto (~0,3s) no toque do selo / botão do gate",
    orientation: "landscape",
    aspectRatio: "n/a",
    minResolution: "n/a",
    mobileVariantRequired: false,
    focalPosition: "n/a",
    status: "received",
    notes: "SFX curto (~0,38s mono 48kbps) — derivado do pack Files Multifários",
  },
];

export function getStanAssetById(id: string): StanAssetSpec | undefined {
  return STAN_ASSETS_MANIFEST.find((asset) => asset.id === id);
}

export function getStanAssetSrc(id: string): string | null {
  const asset = getStanAssetById(id);
  if (!asset) return null;
  if (asset.status === "pending") return null;
  return asset.file;
}

export function listPendingStanAssets(): StanAssetSpec[] {
  return STAN_ASSETS_MANIFEST.filter((asset) => asset.status === "pending");
}

export function listReadyStanAssets(): StanAssetSpec[] {
  return STAN_ASSETS_MANIFEST.filter(
    (asset) => asset.status === "received" || asset.status === "approved"
  );
}
