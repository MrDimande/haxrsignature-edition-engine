import type { TrueTheme } from "../true-types";
import {
  QUEEN_KAILANE_COPY,
  QUEEN_KAILANE_EVENT,
  QUEEN_KAILANE_RSVP,
  QUEEN_KAILANE_SIGNATURE,
} from "@lib/queen-kailane/event-details";

/**
 * Queen Kailane — LUZ DA GRAÇA
 * Paleta: pérola / marfim / champagne / dourado fosco / sálvia / taupe
 */
export const queenKailaneLuzDaGracaTheme: TrueTheme = {
  identity: "queen-kailane-luz-da-graca",
  renderProfile: "queen-kailane-luz-da-graca",
  structure: "editorial",
  flow: "ritual-entry",
  visuals: {
    shapes: "soft-curves",
    spacing: "expansive",
    composition: "immersive-scroll",
  },
  mood: {
    energy: "low",
    emotion: "ceremonial",
  },
  audio: {
    type: "silent",
    fadeIn: 0,
    volume: 0,
    src: null,
  },
  colors: {
    primary: "#3F3832",
    secondary: "#736B62",
    accent: "#B9975B",
    background: "#FFFDFC",
  },
  palette: {
    bgBase: "#FFFDFC",
    textPrimary: "text-[#3F3832]",
    textSecondary: "text-[#736B62]",
    accent: "#B9975B",
    accentLight: "rgba(185, 151, 91, 0.14)",
    cardBg: "bg-[#F6F1E8]/70 backdrop-blur-md border border-[#E7D7C1]/60",
    blob1: "rgba(231, 215, 193, 0.45)",
    blob2: "rgba(216, 190, 135, 0.22)",
    blob3: "rgba(174, 178, 161, 0.18)",
    divider: "rgba(185, 151, 91, 0.35)",
  },
  assets: {
    logoImage: "/images/haxr-logo-vertical.png",
    faviconImage: "/images/haxr-favicon.png",
    monogram: "QKC",
  },
  copy: {
    enterCta: QUEEN_KAILANE_COPY.gateCta,
    heroEyebrow: QUEEN_KAILANE_COPY.heroEyebrow,
    detailsTitle: QUEEN_KAILANE_EVENT.conceptualTitle,
    detailsQuote: `${QUEEN_KAILANE_SIGNATURE.line1} ${QUEEN_KAILANE_SIGNATURE.line2}`,
    intro: {
      headline: "QUEEN",
      surname: "KAILANE CANDE",
      subline: QUEEN_KAILANE_EVENT.dateDisplayShort,
    },
    location: {
      name: QUEEN_KAILANE_EVENT.ceremonyVenueShort,
      address: QUEEN_KAILANE_EVENT.ceremonyParish,
      directions: QUEEN_KAILANE_EVENT.ceremonyVenue,
      mapCoordinates: "3FG8+97Q, Matola",
      externalMapUrl: "https://www.google.com/maps/search/?api=1&query=3FG8%2B97Q+Matola",
      mapFilter: "grayscale(0.2) contrast(1.05) saturate(0.9)",
    },
    rsvpClosing: QUEEN_KAILANE_RSVP.closing,
    rsvp: {
      title: QUEEN_KAILANE_RSVP.title,
      subtitle: QUEEN_KAILANE_RSVP.subtitle,
      deadlineIso: QUEEN_KAILANE_RSVP.deadlineIso ?? "",
      deadlineLabel: QUEEN_KAILANE_RSVP.deadlineLabel ?? "",
    },
  },
};
