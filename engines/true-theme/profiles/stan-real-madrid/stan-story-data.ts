/**
 * Narrativa editorial — Os Cinco Actos de um Pequeno Campeão
 * Dados desacoplados do UI. Trocar fotografias / copy aqui sem abrir o componente.
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
 * Arco com as fotos reais (sem repetir):
 * I ultrassom + recém-nascido
 * II mãe + bebé sentado
 * III STANLEY 10 + toddler + parque
 * IV 4º aniversário + parque ao pôr do sol
 * V campeão
 */
export const STAN_STORY_ACTS: StanStoryAct[] = [
  {
    id: "act-1",
    actNumber: "01",
    roman: "I",
    age: "O início",
    title: "O Começo",
    text: "Antes do primeiro choro, já havia um sonho a ganhar forma e depois um sono quieto que mudou tudo.",
    tone: "light",
    layout: "intimate-portrait",
    heroImage: {
      id: "act1-hero",
      src: "/images/stan/story/chapter-01/ultrasound.png",
      alt: "Ultrassom — o primeiro encontro com o Stan",
      orientation: "landscape",
      focalPosition: "center 45%",
    },
    supportingImages: [
      {
        id: "act1-support",
        src: "/images/stan/story/chapter-01/newborn.png",
        alt: "Stan recém-nascido a dormir",
        orientation: "portrait",
        focalPosition: "center 30%",
        caption: "O primeiro capítulo, em silêncio.",
      },
    ],
  },
  {
    id: "act-2",
    actNumber: "02",
    roman: "II",
    age: "Ano 1",
    title: "Nos Braços do Amor",
    text: "Entre sorrisos, tecidos claros e o olhar de quem o segura, o mundo tornou-se casa e cada dia um novo abraço.",
    tone: "dark",
    layout: "asymmetric-duo",
    heroImage: {
      id: "act2-hero",
      src: "/images/stan/story/chapter-02/primary.png",
      alt: "Stan bebé com a mãe",
      orientation: "portrait",
      focalPosition: "center 35%",
    },
    supportingImages: [
      {
        id: "act2-support",
        src: "/images/stan/story/chapter-02/detail.png",
        alt: "Stan bebé sentado, a sorrir",
        orientation: "landscape",
        focalPosition: "center 40%",
        caption: "O sorriso que abre o segundo acto.",
      },
    ],
  },
  {
    id: "act-3",
    actNumber: "03",
    roman: "III",
    age: "Anos 2–3",
    title: "O Mundo em Movimento",
    text: "Do pátio ao parque, cada dia uma descoberta. Correr, explorar, imaginar — a infância ganhou velocidade e a bola encontrou o seu lugar.",
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
        id: "act3-a",
        src: "/images/stan/story/chapter-03/detail.png",
        alt: "Stan em pé, nas primeiras descobertas do dia a dia",
        orientation: "portrait",
        focalPosition: "center 18%",
      },
      {
        id: "act3-b",
        src: "/images/stan/story/chapter-03/detail-b.png",
        alt: "Stan a brincar no parque, a escalar e a sorrir",
        orientation: "portrait",
        focalPosition: "center 25%",
      },
      {
        id: "act3-c",
        src: "/images/stan/story/chapter-03/detail-c.png",
        alt: "Stan a sorrir junto a um pneu, a explorar o exterior",
        orientation: "portrait",
        focalPosition: "center 30%",
      },
      {
        id: "act3-d",
        src: "/images/stan/story/chapter-03/detail-d.png",
        alt: "Stan no pátio, nas primeiras aventuras ao ar livre",
        orientation: "portrait",
        focalPosition: "center 20%",
      },
    ],
  },
  {
    id: "act-4",
    actNumber: "04",
    roman: "IV",
    age: "Ano 4",
    title: "Nasce uma Paixão",
    text: "Entre balões, luzes e uma camisola branca, o sonho ganhou cor e o coração começou a bater ao ritmo do jogo.",
    tone: "dark",
    layout: "editorial-mosaic",
    heroImage: {
      id: "act4-hero",
      src: "/images/stan/story/chapter-04/primary.png",
      alt: "Stan no 4º aniversário com a camisola do Real Madrid",
      orientation: "portrait",
      focalPosition: "center 20%",
    },
    supportingImages: [
      {
        id: "act4-support",
        src: "/images/stan/story/chapter-04/detail.png",
        alt: "Stan no parque ao pôr do sol",
        orientation: "portrait",
        focalPosition: "center 30%",
      },
    ],
  },
  {
    id: "act-5",
    actNumber: "05",
    roman: "V",
    age: "Ano 5",
    title: "O Pequeno Campeão",
    text: "Braços cruzados, camisola branca, olhar firme. Cinco anos depois, o pequeno campeão prepara-se para o seu maior acto até agora.",
    tone: "light",
    layout: "champion-finale",
    heroImage: {
      id: "act5-hero",
      src: "/images/stan/story/chapter-05/primary.png",
      alt: "Stan de braços cruzados com a camisola do Real Madrid — o pequeno campeão",
      orientation: "portrait",
      focalPosition: "center 18%",
    },
    supportingImages: [
      {
        id: "act5-support",
        src: "/images/stan/story/chapter-05/detail.png",
        alt: "Stan com a bola — navy e chuteiras azuis, pronto para o jogo",
        orientation: "portrait",
        focalPosition: "center 20%",
        caption: "O plantel está formado.",
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
