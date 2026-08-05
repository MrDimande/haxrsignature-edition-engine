/**
 * Estrutura de Dados Editorial — Convite Stan (5º Aniversário)
 * Paths alinhados com lib/stan/assets-manifest.ts.
 * src deve ser sempre um caminho de ficheiro válido (nunca classes CSS).
 */

import { STAN_STORY_ACTS } from "./stan-story-data";

export interface StanPhoto {
  src: string;
  alt: string;
  orientation: "portrait" | "landscape" | "square";
  focalPosition?: string;
  caption?: string;
}

export interface StanChapter {
  id: string;
  chapterNumber: string;
  title: string;
  subtitle?: string;
  layoutType:
    | "single-vertical"
    | "asymmetric-duo"
    | "full-horizontal"
    | "editorial-mosaic"
    | "portrait-hero";
  bgTheme: "light" | "dark";
  primaryPhoto: StanPhoto;
  secondaryPhotos?: StanPhoto[];
}

/** Valida que src parece um path de imagem (não CSS / lixo) */
export function isValidStanImageSrc(src: string): boolean {
  if (!src || typeof src !== "string") return false;
  const trimmed = src.trim();
  if (!trimmed.startsWith("/")) return false;
  if (/\s/.test(trimmed)) return false;
  if (trimmed.includes("backdrop-blur") || trimmed.includes("rgba(")) return false;
  return /\.(jpe?g|png|webp|gif|avif)$/i.test(trimmed);
}

export const STAN_CHAPTERS_DATA: StanChapter[] = [
  {
    id: "chapter-1",
    chapterNumber: "01",
    title: "O começo",
    subtitle: "Ano 1",
    layoutType: "single-vertical",
    bgTheme: "light",
    primaryPhoto: {
      src: "/images/stan/story/chapter-01/ultrasound.png",
      alt: "Ultrassom — o primeiro encontro com o Stan",
      orientation: "landscape",
      focalPosition: "center 45%",
    },
  },
  {
    id: "chapter-2",
    chapterNumber: "02",
    title: "As primeiras descobertas",
    subtitle: "Ano 2",
    layoutType: "asymmetric-duo",
    bgTheme: "dark",
    primaryPhoto: {
      src: "/images/stan/story/chapter-02/primary.png",
      alt: "Stan no seu 2º ano de vida",
      orientation: "portrait",
      focalPosition: "center",
    },
    secondaryPhotos: [
      {
        src: "/images/stan/story/chapter-02/detail.png",
        alt: "Momento especial do Stan",
        orientation: "square",
      },
    ],
  },
  {
    id: "chapter-3",
    chapterNumber: "03",
    title: "Energia em movimento",
    subtitle: "Ano 3",
    layoutType: "full-horizontal",
    bgTheme: "light",
    primaryPhoto: {
      src: "/images/stan/story/chapter-03/primary.png",
      alt: "Stan no seu 3º ano de vida",
      orientation: "landscape",
      focalPosition: "center",
    },
  },
  {
    id: "chapter-4",
    chapterNumber: "04",
    title: "Nasce uma paixão",
    subtitle: "Ano 4",
    layoutType: "editorial-mosaic",
    bgTheme: "dark",
    primaryPhoto: {
      src: "/images/stan/story/chapter-04/primary.png",
      alt: "Stan no seu 4º ano de vida",
      orientation: "portrait",
      focalPosition: "center",
    },
    secondaryPhotos: [
      {
        src: "/images/stan/story/chapter-02/detail.png",
        alt: "Detalhe de jogo e bola",
        orientation: "square",
      },
    ],
  },
  {
    id: "chapter-5",
    chapterNumber: "05",
    title: "O pequeno campeão",
    subtitle: "Ano 5",
    layoutType: "portrait-hero",
    bgTheme: "light",
    primaryPhoto: {
      src: "/images/stan/story/chapter-05/primary.png",
      alt: "Stan a celebrar 5 anos",
      orientation: "portrait",
      focalPosition: "center",
    },
  },
];

export const STAN_HERO_PHOTO: StanPhoto = {
  src: "/images/stan/hero/hero-main.png",
  alt: "Retrato Principal do Stan no seu 5º Aniversário",
  orientation: "portrait",
  focalPosition: "center 18%",
};

export const STAN_CLOSING_PHOTO: StanPhoto = {
  src: "/images/stan/closing/closing-stan.png",
  alt: "Fotografia de Encerramento do Stan",
  orientation: "portrait",
  focalPosition: "center",
};

export const STAN_IDOL_PHOTOS = {
  stan: {
    src: "/images/stan/idols/stanley.png",
    alt: "Stanley Mayse — o pequeno campeão",
    orientation: "portrait" as const,
    focalPosition: "center 22%",
  },
  mbappe: {
    src: "/images/stan/idols/mbappe.jpg",
    alt: "Kylian Mbappé — inspiração",
    orientation: "portrait" as const,
    focalPosition: "center 22%",
  },
  cristiano: {
    src: "/images/stan/idols/cristiano-ronaldo.jpg",
    alt: "Cristiano Ronaldo — inspiração",
    orientation: "portrait" as const,
    focalPosition: "center 35%",
  },
} as const;

export const STAN_STADIUM_BG = {
  desktop: "/images/stan/hero/stadium-bg-desktop.png",
  mobile: "/images/stan/hero/stadium-bg-mobile.png",
} as const;

export const STAN_TUNNEL_BG = {
  desktop: "/images/stan/hero/tunnel-desktop.png",
  mobile: "/images/stan/hero/tunnel-mobile.png",
} as const;

/** Auditoria rápida — devolve srcs inválidos (não deveriam existir) */
export function auditStanGallerySrcs(): string[] {
  const invalid: string[] = [];
  const collect = (photo?: StanPhoto) => {
    if (!photo) return;
    if (!isValidStanImageSrc(photo.src)) invalid.push(photo.src);
  };

  collect(STAN_HERO_PHOTO);
  collect(STAN_CLOSING_PHOTO);
  Object.values(STAN_IDOL_PHOTOS).forEach((p) => collect(p));
  STAN_CHAPTERS_DATA.forEach((chapter) => {
    collect(chapter.primaryPhoto);
    chapter.secondaryPhotos?.forEach(collect);
  });

  // História editorial (fonte activa da narrativa)
  STAN_STORY_ACTS.forEach((act) => {
    if (!isValidStanImageSrc(act.heroImage.src)) invalid.push(act.heroImage.src);
    act.supportingImages?.forEach((img) => {
      if (!isValidStanImageSrc(img.src)) invalid.push(img.src);
    });
  });

  return invalid;
}
