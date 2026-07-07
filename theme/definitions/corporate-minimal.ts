import type { TrueTheme } from "../true-types";
import { getCorporatePalette } from "../experience-tokens";

export const corporateMinimalTrueTheme: TrueTheme = {
  identity: "corporate-minimal",
  renderProfile: "standard",
  structure: "minimal",
  flow: "direct",
  visuals: {
    shapes: "grid",
    spacing: "tight-luxury",
    composition: "center-focus",
  },
  mood: {
    energy: "high",
    emotion: "luxury",
  },
  audio: {
    type: "silent",
    fadeIn: 0,
    volume: 0,
    src: null,
    fadeOut: 0,
  },
  colors: {
    primary: "#1A1A2E",
    secondary: "#4A4A68",
    accent: "#2D3561",
    background: "#F8F9FA",
  },
  palette: getCorporatePalette(),
  assets: {
    heroImage: "/images/haxr-logo-vertical.png",
    logoImage: "/images/haxr-logo-vertical.png",
    monogram: "HX",
  },
  copy: {
    enterCta: "Aceder ao Evento",
    heroEyebrow: "Convite Institucional",
    detailsTitle: "Informações do Evento",
    detailsQuote:
      "Um encontro profissional desenhado com precisão e elegância.",
    location: {
      name: "Local a confirmar",
      address: "Maputo, Moçambique",
      directions: "Instruções de acesso serão enviadas por email.",
      mapCoordinates: "-25.9653,32.5892",
      externalMapUrl: "https://maps.google.com",
      mapFilter: "grayscale(1) contrast(1.1)",
    },
    rsvpClosing: "Aguardamos a sua confirmação.",
  },
};

/** @deprecated Use corporateMinimalTrueTheme */
export const corporateTrueTheme = corporateMinimalTrueTheme;
