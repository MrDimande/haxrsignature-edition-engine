import type { TrueTheme } from "../true-types";
import { BABY_AYLLA_EVENT } from "@lib/aylla/event-details";

/**
 * Baby Aylla — The Bow Collection
 * Paleta: Rosa Suave / Nude Rose / Champanhe / Dourado Fosco / Marfim Pérola / Vibrant Pink (#FF0164)
 */
export const babyAyllaCoutureTheme: TrueTheme = {
  identity: "baby-aylla-couture",
  renderProfile: "baby-aylla-couture",
  structure: "editorial",
  flow: "ritual-entry",
  visuals: {
    shapes: "soft-curves",
    spacing: "expansive",
    composition: "immersive-scroll",
  },
  mood: {
    energy: "low",
    emotion: "soft-intimate",
  },
  audio: {
    type: "ambient",
    fadeIn: 3000,
    fadeOut: 600,
    volume: 0.24,
    src: BABY_AYLLA_EVENT.music.src,
    loop: false,
    audioStartMode: "explicit-user-choice",
  },
  colors: {
    primary: "#C49B94",
    secondary: "#D4AEA8",
    accent: "#C87A6E",
    background: "#FBF8F5",
  },
  palette: {
    bgBase: "#FBF8F5",
    textPrimary: "text-[#4A3B39]",
    textSecondary: "text-[#7A6662]",
    accent: "#C87A6E",
    accentLight: "rgba(200, 122, 110, 0.12)",
    cardBg: "bg-[#FFF9F8]/85 backdrop-blur-md border border-[#F2D6D0]/60",
    blob1: "rgba(250, 219, 216, 0.4)",
    blob2: "rgba(212, 174, 168, 0.25)",
    blob3: "rgba(200, 122, 110, 0.08)",
    divider: "rgba(223, 186, 115, 0.3)",
  },
  assets: {
    logoImage: "/images/haxr-logo-vertical.png",
    faviconImage: "/images/haxr-favicon.png",
    monogram: "BA",
  },
  copy: {
    enterCta: BABY_AYLLA_EVENT.editorial.ctaLabel,
    heroEyebrow: BABY_AYLLA_EVENT.editorial.coverEyebrow,
    detailsTitle: `${BABY_AYLLA_EVENT.celebrant} · ${BABY_AYLLA_EVENT.collection}`,
    detailsQuote: BABY_AYLLA_EVENT.editorial.coverTagline,
    intro: {
      headline: BABY_AYLLA_EVENT.editorial.titlePart1,
      surname: BABY_AYLLA_EVENT.editorial.titlePart2,
      subline: `${BABY_AYLLA_EVENT.editorial.occasionBadge} · ${BABY_AYLLA_EVENT.eventDateFormatted}`,
    },
    dressCode: {
      label: "DRESS CODE",
      title: BABY_AYLLA_EVENT.dressCode.title,
      description: BABY_AYLLA_EVENT.dressCode.description,
    },
    location: {
      name: BABY_AYLLA_EVENT.venue.name,
      address: BABY_AYLLA_EVENT.venue.address,
      directions: "Vila do Mar Eventos · Costa do Sol, Maputo",
      mapCoordinates: "-25.9189,32.6167",
      externalMapUrl: BABY_AYLLA_EVENT.venue.mapsUrl ?? "https://maps.google.com",
      mapFilter: "grayscale(0.1) contrast(1.02) saturate(0.95)",
    },
    rsvpClosing: "Agradecemos a confirmação de presença assim que os detalhes forem finalizados.",
    rsvp: {
      title: "Confirmação de Presença",
      subtitle: "Abertura em breve pela organização",
      deadlineIso: "",
      deadlineLabel: "A anunciar",
    },
  },
};
