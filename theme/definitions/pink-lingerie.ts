import type { TrueTheme } from "../true-types";
import { getIntimatePalette } from "../experience-tokens";

export const pinkLingerieTrueTheme: TrueTheme = {
  identity: "pink-lingerie",
  renderProfile: "standard",
  structure: "editorial",
  flow: "reveal",
  visuals: {
    shapes: "soft-curves",
    spacing: "air-medium",
    composition: "magazine-layout",
  },
  mood: {
    energy: "medium",
    emotion: "soft-intimate",
  },
  audio: {
    type: "ambient",
    fadeIn: 4000,
    volume: 0.45,
    src: "/audio/lingerie-ambient.mp3",
    fadeOut: 1200,
  },
  colors: {
    primary: "#4A1825",
    secondary: "#7D4F5A",
    accent: "#E05A75",
    background: "#FFF9FA",
  },
  palette: getIntimatePalette(),
  assets: {
    heroImage: "/images/jessica.jpg",
    logoImage: "/images/haxr-logo-vertical.png",
    monogram: "JM",
  },
  copy: {
    enterCta: "Enter Experience",
    heroEyebrow: "An exclusive celebration",
    detailsTitle: "Exclusividade & Elegância",
    detailsQuote:
      "Cada detalhe foi planeado para desenhar uma atmosfera de intimidade, cumplicidade e celebração da feminilidade. Aguardamos a sua presença para tornar esta tarde inesquecível.",
    dressCode: {
      label: "DRESS CODE MANDATÓRIO",
      title: "One piece in Pink",
      description:
        "Solicita-se a inclusão de uma peça de vestuário na tonalidade rosa para harmonizar a atmosfera de elegância e cumplicidade deste momento.",
    },
    location: {
      name: "Residência Muege",
      address: "Condomínio Matola Village, Matola, Moçambique",
      directions:
        "O evento realizar-se-á na residência da anfitriã. Use o botão abaixo para traçar a rota directa no seu aplicativo de navegação.",
      mapCoordinates: "-25.967886,32.483161",
      externalMapUrl: "https://maps.app.goo.gl/cbEE9GtmFK5EMvzW8?g_st=ac",
      mapFilter:
        "grayscale(1) invert(0.9) sepia(0.3) hue-rotate(300deg) saturate(1.8) contrast(1.12) brightness(0.98)",
    },
    rsvpClosing: "A vossa presença é a maior bênção para a nossa união.",
  },
};
