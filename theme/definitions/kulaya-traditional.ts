import { getCeremonialPalette } from "../experience-tokens";
import type { TrueTheme } from "../true-types";

export const kulayaTrueTheme: TrueTheme = {
  identity: "kulaya-traditional",
  renderProfile: "standard",
  structure: "ceremonial",
  flow: "ritual-entry",
  visuals: {
    shapes: "shield",
    spacing: "expansive",
    composition: "center-focus",
  },
  mood: {
    energy: "low",
    emotion: "ceremonial",
  },
  audio: {
    type: "ritual",
    fadeIn: 7500,
    volume: 0.55,
    src: "/audio/bg-music-web.mp3",
    fadeOut: 800,
  },
  colors: {
    primary: "#FAF5F0",
    secondary: "rgba(250, 245, 240, 0.7)",
    accent: "#D4AF37",
    background: "#120A07",
  },
  palette: getCeremonialPalette(),
  assets: {
    heroImage: "/images/jessica-kulaya-hero-bg.webp",
    logoImage: "/images/haxr-logo-vertical.png",
    monogram: "KM",
  },
  copy: {
    enterCta: "Entrar na Cerimónia",
    heroEyebrow: "Uma celebração de raízes",
    detailsTitle: "Dignidade & Continuidade",
    detailsQuote:
      "A Cerimónia de Kulaya é um ritual de passagem — um momento sagrado onde as raízes encontram o futuro.",
    location: {
      name: "Condomínio Matola Village",
      address: "Matola, Moçambique",
      directions:
        "Utilize o mapa para traçar a rota até ao local da cerimónia.",
      mapCoordinates: "Condomínio Matola Village Matola Moçambique",
      externalMapUrl: "https://maps.app.goo.gl/cbEE9GtmFK5EMvzW8?g_st=ac",
      mapFilter:
        "grayscale(1) invert(0.9) sepia(0.55) hue-rotate(335deg) saturate(1.8) contrast(1.15) brightness(0.95)",
    },
    rsvpClosing: "A vossa presença honra as nossas raízes.",
  },
};
