import {
  WEDDING_COPY,
  WEDDING_EVENT,
  WEDDING_VENUE,
} from "@lib/jessica-samuel-wedding/event-details";
import { getJessicaSamuelWeddingPalette } from "../experience-tokens";
import type { TrueTheme } from "../true-types";

export const jessicaSamuelWeddingTheme: TrueTheme = {
  identity: "jessica-samuel-wedding",
  renderProfile: "jessica-samuel-wedding",
  structure: "editorial",
  flow: "reveal",
  visuals: {
    shapes: "soft-curves",
    spacing: "expansive",
    composition: "magazine-layout",
  },
  mood: {
    energy: "low",
    emotion: "luxury",
  },
  audio: {
    type: "ambient",
    fadeIn: 5200,
    fadeOut: 2000,
    volume: 0.26,
    src: "/audio/everything-is-romantic.mp3",
    credit: {
      title: "Everything is romantic",
      artist: "Charli XCX",
      rightsHolder: "Atlantic Records · Charli XCX",
      disclaimer:
        "Música de ambiente no convite. Todos os direitos da obra pertencem aos respectivos titulares. HAXR Signature não detém nem reivindica qualquer direito sobre este conteúdo musical.",
    },
  },
  colors: {
    primary: "#171312",
    secondary: "#C9939B",
    accent: "#7A2332",
    background: "#F1E3CF",
  },
  palette: getJessicaSamuelWeddingPalette(),
  assets: {
    logoImage: "/images/haxr-logo-vertical.png",
    faviconImage: "/images/haxr-favicon.png",
    monogram: "J · S",
  },
  copy: {
    enterCta: "Entrar na Celebração",
    heroEyebrow: "Black-tie",
    detailsTitle: "Os Detalhes",
    detailsQuote: WEDDING_COPY.intro,
    intro: {
      headline: "Jessica",
      surname: "& Samuel",
      subline: WEDDING_EVENT.ceremonyLabel,
    },
    dressCode: {
      label: "Dress Code",
      title: WEDDING_EVENT.dressCode,
      description: WEDDING_COPY.dressCodeLead,
    },
    location: {
      name: WEDDING_VENUE.name,
      address: WEDDING_VENUE.city,
      directions:
        "No Salão de Eventos Vila Verde, em Matola. Utilize o botão abaixo para abrir a localização no Google Maps.",
      mapCoordinates: WEDDING_VENUE.full,
      externalMapUrl: WEDDING_VENUE.mapsUrl,
      mapFilter:
        "grayscale(0.08) sepia(0.06) contrast(1.02) brightness(1.04)",
    },
    rsvpClosing: WEDDING_COPY.closing,
    rsvp: {
      title: WEDDING_COPY.rsvpTitle,
      subtitle: WEDDING_COPY.rsvpSubtitle,
      deadlineIso: "2026-08-01",
      deadlineLabel: "1 de Agosto de 2026",
    },
  },
};
