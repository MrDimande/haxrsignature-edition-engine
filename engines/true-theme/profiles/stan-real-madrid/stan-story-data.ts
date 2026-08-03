/**
 * Narrativa editorial — Os Cinco Actos de um Pequeno Campeão
 * Dados desacoplados do UI. Textos universais (sem factos inventados).
 * Trocar fotografias / copy aqui sem abrir o componente.
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
 * Acto IV: sem fotografia que confirme futebol explícito nesta fase —
 * título neutro (não inventar “primeiro golo” / Real Madrid).
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
      alt: "Primeiro acto — o começo da história do Stan",
      orientation: "portrait",
      focalPosition: "center",
    },
    supportingImages: [
      {
        id: "act1-support",
        src: "/images/stan/story/chapter-01/detail.png",
        alt: "Um momento íntimo dos primeiros dias",
        orientation: "portrait",
        focalPosition: "center top",
      },
    ],
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
      alt: "Stan nas primeiras descobertas",
      orientation: "portrait",
      focalPosition: "center 20%",
    },
    supportingImages: [
      {
        id: "act2-support",
        src: "/images/stan/story/chapter-02/detail.png",
        alt: "Um instante espontâneo de descoberta",
        orientation: "portrait",
        focalPosition: "center",
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
      alt: "Stan em movimento, a explorar o mundo",
      orientation: "landscape",
      focalPosition: "center 30%",
    },
    supportingImages: [
      {
        id: "act3-a",
        src: "/images/stan/story/chapter-02/detail.png",
        alt: "Detalhe de um dia em movimento",
        orientation: "portrait",
        focalPosition: "center",
      },
      {
        id: "act3-b",
        src: "/images/stan/story/chapter-02/primary.png",
        alt: "Alegria e energia da infância",
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
    title: "A Paixão Começa a Ganhar Forma",
    text: "Entre movimento, alegria e imaginação, um universo começou a ganhar forma — um lugar onde os sonhos correm com o coração aberto.",
    tone: "dark",
    layout: "editorial-mosaic",
    heroImage: {
      id: "act4-hero",
      src: "/images/stan/story/chapter-04/primary.png",
      alt: "Stan — a paixão a ganhar forma",
      orientation: "portrait",
      focalPosition: "center 15%",
    },
    supportingImages: [
      {
        id: "act4-a",
        src: "/images/stan/story/chapter-03/primary.png",
        alt: "Energia e imaginação",
        orientation: "landscape",
        focalPosition: "center",
      },
      {
        id: "act4-b",
        src: "/images/stan/story/chapter-02/detail.png",
        alt: "Um momento de luz",
        orientation: "portrait",
        focalPosition: "center",
      },
    ],
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
      src: "/images/stan/closing/closing-stan.png",
      alt: "Stan — o pequeno campeão",
      orientation: "portrait",
      focalPosition: "center 18%",
    },
    supportingImages: [
      {
        id: "act5-joy",
        src: "/images/stan/story/chapter-04/primary.png",
        alt: "A alegria que antecipa o grande dia",
        orientation: "portrait",
        focalPosition: "center 20%",
      },
    ],
  },
];

export function isValidStanStorySrc(src: string): boolean {
  if (!src || typeof src !== "string") return false;
  const trimmed = src.trim();
  if (!trimmed.startsWith("/")) return false;
  if (/\s/.test(trimmed)) return false;
  return /\.(jpe?g|png|webp|gif|avif)$/i.test(trimmed);
}
