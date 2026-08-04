/**
 * Narrativa editorial — Os Cinco Actos de um Pequeno Campeão
 * Dados desacoplados do UI. Textos universais (sem factos inventados).
 * Trocar fotografias / copy aqui sem abrir o componente.
 *
 * Regra: cada `src` aparece no máximo uma vez em STAN_STORY_ACTS.
 */

export type StanImageOrientation = "portrait" | "landscape" | "square";

export type StanStoryLayout =
  | "intimate-portrait"
  | "asymmetric-duo"
  | "cinematic-landscape"
  | "editorial-mosaic"
  | "champion-finale";

export interface StanStoryImage {
  id: string;
  src: string;
  alt: string;
  orientation: StanImageOrientation;
  focalPosition?: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface StanStoryAct {
  id: string;
  actNumber: string;
  roman: string;
  age: string;
  year?: string;
  title: string;
  text?: string;
  tone: "light" | "dark";
  layout: StanStoryLayout;
  heroImage: StanStoryImage;
  supportingImages?: StanStoryImage[];
}

export const STAN_STORY_PROLOGUE = {
  id: "stan-story",
  mark: "HISTÓRIA",
  lead: "Antes das luzes, dos aplausos e do grande dia, houve uma história feita de pequenos momentos.",
  line: "Cinco anos. Cinco actos. Um pequeno campeão.",
  sectionTitle: "Os Cinco Actos de um Pequeno Campeão",
} as const;

export const STAN_STORY_EPILOGUE = {
  eyebrow: "Apito final",
  text: "Cinco actos. Um pequeno campeão. A estreia começa agora.",
  line: "Esta história ainda está apenas a começar.",
} as const;

/**
 * 7 fotografias reais — uma por slot, sem repetir.
 * Actos I e IV/V: um herói. Actos II e III: herói + apoio.
 */
export const STAN_STORY_ACTS: StanStoryAct[] = [
  {
    id: "act-1",
    actNumber: "01",
    roman: "I",
    age: "Ano 1",
    title: "O Começo",
    text: "Antes de o mundo conhecer a sua energia, chegou um sorriso pequeno o suficiente para caber nos braços — e grande o suficiente para transformar tudo.",
    tone: "light",
    layout: "intimate-portrait",
    heroImage: {
      id: "act1-hero",
      src: "/images/stan/story/chapter-01/primary.png",
      alt: "Stan bebé nos braços da mãe — o começo",
      orientation: "portrait",
      focalPosition: "center 35%",
    },
  },
  {
    id: "act-2",
    actNumber: "02",
    roman: "II",
    age: "Ano 2",
    title: "As Primeiras Descobertas",
    text: "O mundo começou a abrir-se diante dele: novas formas, novos sons, novos passos e a alegria de descobrir um pouco mais a cada dia.",
    tone: "dark",
    layout: "asymmetric-duo",
    heroImage: {
      id: "act2-hero",
      src: "/images/stan/story/chapter-02/primary.png",
      alt: "Stan em pé, sorridente, nas primeiras descobertas",
      orientation: "portrait",
      focalPosition: "center 18%",
    },
    supportingImages: [
      {
        id: "act2-support",
        src: "/images/stan/story/chapter-02/detail.png",
        alt: "Stan no parque ao pôr do sol",
        orientation: "portrait",
        focalPosition: "center 30%",
        caption: "Cada dia, um novo horizonte.",
      },
    ],
  },
  {
    id: "act-3",
    actNumber: "03",
    roman: "III",
    age: "Ano 3",
    title: "O Mundo em Movimento",
    text: "Correr, explorar, imaginar. A infância ganhou velocidade — e cada novo dia tornou-se uma aventura.",
    tone: "light",
    layout: "cinematic-landscape",
    heroImage: {
      id: "act3-hero",
      src: "/images/stan/story/chapter-03/primary.png",
      alt: "Stan de costas com a camisola STANLEY 10 e a bola no campo",
      orientation: "landscape",
      focalPosition: "center 55%",
    },
    supportingImages: [
      {
        id: "act3-support",
        src: "/images/stan/story/chapter-03/detail.png",
        alt: "Stan a brincar no parque, com a bola por perto",
        orientation: "portrait",
        focalPosition: "center 25%",
      },
    ],
  },
  {
    id: "act-4",
    actNumber: "04",
    roman: "IV",
    age: "Ano 4",
    title: "Nasce uma Paixão",
    text: "Entre balões, luzes e uma camisola branca, o sonho ganhou cor — e o coração começou a bater ao ritmo do jogo.",
    tone: "dark",
    layout: "editorial-mosaic",
    heroImage: {
      id: "act4-hero",
      src: "/images/stan/story/chapter-04/primary.png",
      alt: "Stan no 4º aniversário com a camisola do Real Madrid",
      orientation: "portrait",
      focalPosition: "center 20%",
    },
  },
  {
    id: "act-5",
    actNumber: "05",
    roman: "V",
    age: "Ano 5",
    title: "O Pequeno Campeão",
    text: "Cinco anos depois, o menino dos primeiros passos prepara-se para entrar em campo para o seu maior acto até agora.",
    tone: "light",
    layout: "champion-finale",
    heroImage: {
      id: "act5-hero",
      src: "/images/stan/story/chapter-05/primary.png",
      alt: "Stan de braços cruzados com a camisola do Real Madrid — o pequeno campeão",
      orientation: "portrait",
      focalPosition: "center 18%",
    },
  },
];

export function isValidStanStorySrc(src: string): boolean {
  if (!src || typeof src !== "string") return false;
  const trimmed = src.trim();
  if (!trimmed.startsWith("/")) return false;
  if (/\s/.test(trimmed)) return false;
  return /\.(jpe?g|png|webp|gif|avif)$/i.test(trimmed);
}

/** Garante que nenhum src se repete na narrativa activa */
export function findDuplicateStanStorySrcs(
  acts: StanStoryAct[] = STAN_STORY_ACTS
): string[] {
  const seen = new Set<string>();
  const dupes: string[] = [];
  for (const act of acts) {
    const srcs = [
      act.heroImage.src,
      ...(act.supportingImages?.map((img) => img.src) ?? []),
    ];
    for (const src of srcs) {
      if (seen.has(src)) dupes.push(src);
      else seen.add(src);
    }
  }
  return dupes;
}
