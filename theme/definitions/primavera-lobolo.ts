import {
  TRADITIONAL_COPY,
  TRADITIONAL_EVENT,
  TRADITIONAL_VENUE,
} from "@lib/jessica-samuel-traditional/event-details";
import { getPrimaveraLoboloPalette } from "../experience-tokens";
import type { TrueTheme } from "../true-types";

export const primaveraLoboloTheme: TrueTheme = {
  identity: "primavera-lobolo",
  renderProfile: "primavera-lobolo",
  structure: "ceremonial",
  flow: "reveal",
  visuals: {
    shapes: "soft-curves",
    spacing: "expansive",
    composition: "magazine-layout",
  },
  mood: {
    energy: "low",
    emotion: "ceremonial",
  },
  audio: {
    type: "ambient",
    fadeIn: 5500,
    fadeOut: 2000,
    volume: 0.32,
    src: "/audio/famba-kwatsi.mp3",
    credit: {
      title: "Famba Kwatsi",
      artist: "Nordino Chambal",
      rightsHolder: "Nordino Chambal",
      disclaimer:
        "Música de ambiente no convite. Todos os direitos da obra pertencem aos respectivos titulares. HAXR Signature não detém nem reivindica qualquer direito sobre este conteúdo musical.",
    },
  },
  colors: {
    primary: "#2A1810",
    secondary: "#C45C26",
    accent: "#C9A227",
    background: "#F5EDE4",
  },
  palette: getPrimaveraLoboloPalette(),
  assets: {
    logoImage: "/images/haxr-logo-vertical.png",
    faviconImage: "/images/haxr-favicon.png",
    monogram: "J · S",
  },
  copy: {
    enterCta: "Entrar na Celebração",
    heroEyebrow: "Tema Primavera",
    detailsTitle: "Os Detalhes",
    detailsQuote: TRADITIONAL_COPY.intro,
    intro: {
      headline: "Jessica",
      surname: "& Samuel",
      subline: TRADITIONAL_EVENT.ceremonyLabel,
    },
    dressCode: {
      label: "Dress Code",
      title: TRADITIONAL_EVENT.dressCode,
      description: TRADITIONAL_COPY.dressCodeLead,
    },
    location: {
      name: TRADITIONAL_VENUE.name,
      address: TRADITIONAL_VENUE.city,
      directions:
        "Na Casa D'Artista Kutenga, em Matola. Utilize o botão abaixo para abrir a localização no Google Maps.",
      mapCoordinates: TRADITIONAL_VENUE.full,
      externalMapUrl: TRADITIONAL_VENUE.mapsUrl,
      mapFilter:
        "grayscale(0.15) sepia(0.12) hue-rotate(5deg) saturate(0.9) contrast(1.02)",
    },
    rsvpClosing: TRADITIONAL_COPY.closing,
    rsvp: {
      title: TRADITIONAL_COPY.rsvpTitle,
      subtitle: TRADITIONAL_COPY.rsvpSubtitle,
      deadlineIso: "2026-07-18",
      deadlineLabel: "18 de Julho de 2026",
    },
  },
};
