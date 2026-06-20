/**
 * Dados do evento — Casamento Tradicional (Lobolo) Jessica & Samuel
 */

export const COUPLE = {
  bride: "Jessica Muege",
  groom: "Samuel Govene",
  displayNames: "JESSICA & SAMUEL",
} as const;

/** Data e hora do evento (capa + contagem decrescente) */
export const EVENT_DATE = new Date("2026-07-25T10:00:00");

/** @deprecated Use COVER from cover-design.ts */
export { COVER, COVER_COLORS } from "./cover-design";

export const LOBOLO_THEME = {
  name: "Primavera",
  colors: ["Laranja", "Dourado", "Branco"],
} as const;

export const PARENTS = {
  bride: {
    label: "Pais da Noiva",
    names: [
      "Maria da Sagrada Família Andre Djive",
      "Lucas Jagino António Muege",
    ],
  },
  groom: {
    label: "Pais do Noivo",
    names: ["Maria Rosa Maxaieie", "Jaime Govene"],
  },
} as const;

export const TRADITIONAL_SECTION = {
  title: "Casamento Tradicional",
  subtitle: "O Lobolo",
  theme: LOBOLO_THEME.name,
  paragraphs: [
    "Com imensa alegria e gratidão, convidamo-vos a testemunhar a união das nossas famílias numa celebração que honra as nossas raízes, a nossa cultura e o amor que nos une.",
    "Sob o tema Primavera — em tons de laranja, dourado e branco — o Lobolo representa o reconhecimento solene do compromisso entre duas famílias que se tornam uma só.",
  ],
} as const;

export const LOCATIONS = [
  {
    id: "lobolo",
    type: "Casamento Tradicional — Lobolo",
    timeLabel: "Cerimónia",
    time: "10H00",
    name: "Local da Cerimónia",
    address: "Maputo, Moçambique",
    mapsUrl: "https://maps.app.goo.gl/BSynBHVrt2CB3W6bA?g_st=ac",
  },
] as const;

export const DRESS_CODE = "Formal";

export type GiftItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
};

/** Lista provisória — será actualizada (mesma lista do dia 15) */
export const GIFT_ITEMS: GiftItem[] = [
  {
    id: "gift-1",
    name: "Conjunto de Talheres Premium",
    description: "Serviço para 12 pessoas em aço inoxidável com acabamento dourado.",
    price: 8500,
    currency: "MZN",
  },
  {
    id: "gift-2",
    name: "Máquina de Café Espresso",
    description: "Modelo automático com moedor integrado — ideal para as manhãs a dois.",
    price: 12000,
    currency: "MZN",
  },
  {
    id: "gift-3",
    name: "Jogo de Lençóis de Seda",
    description: "Conjunto king size em seda natural, cor champanhe.",
    price: 6500,
    currency: "MZN",
  },
  {
    id: "gift-4",
    name: "Experiência Gastronómica",
    description: "Voucher para jantar romântico num restaurante de referência.",
    price: 15000,
    currency: "MZN",
  },
];

import { HAXR_AUTH } from "@lib/brand/authorship";

export const AGENCY = {
  name: HAXR_AUTH.brand,
  tagline: HAXR_AUTH.tagline,
  coverTagline: "DESPERTE A MAGIA",
} as const;

export const FAMILIES = {
  bride: "MUEGE",
  groom: "GOVENE",
} as const;

export const HERO = {
  term: "DOT",
  termSubtitle: "Lobolo",
  intro:
    "Honramos as nossas tradições, celebramos as nossas raízes e convidamo-vos a testemunhar a união das nossas famílias num capítulo de amor, respeito e herança.",
  invitationLine: "convidam-vos ao seu casamento tradicional",
  closingLine:
    "Será uma honra contar com a vossa presença nesta celebração solene.",
} as const;

export function formatEventDate(date: Date): string {
  return date.toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
