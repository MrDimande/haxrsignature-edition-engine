/**
 * Design Tokens — Baby Aylla | Dior Collection Rosa
 * Digital Haute Couture Design System
 */

export const AYLLA_TOKENS = {
  colors: {
    // Dior Collection Rosa Palette
    diorRose: "#C87A6E",
    blushAccent: "#D4958A",
    powderPink: "#ECCBC0",
    babyPink: "#F4D8CD",
    nudeRose: "#DFC0B7",
    champagne: "#F5EFEB",
    softIvory: "#FBF8F5",
    creme: "#FAF3EE",
    pearlWhite: "#FFFFFF",
    warmBronze: "#7A6662",
    deepCocoa: "#4A3B39",
    paleGold: "#DFBA73",
    goldTrim: "#D8C39D",
    goldFoil: "linear-gradient(135deg, #F7E7B4 0%, #DFBA73 50%, #B38728 100%)",
    silkGlow: "0 8px 32px rgba(200, 122, 110, 0.16)",
    pearlGlow: "0 4px 16px rgba(223, 186, 115, 0.22)",
  },
  typography: {
    serif: "'Playfair Display', Georgia, serif",
    calligraphy: "'Great Vibes', cursive",
    sans: "'Montserrat', system-ui, -apple-system, sans-serif",
  },
  shadows: {
    card: "0 16px 40px -12px rgba(74, 59, 57, 0.06), 0 0 1px 1px rgba(223, 186, 115, 0.2)",
    gate: "0 25px 60px -15px rgba(200, 122, 110, 0.12)",
    pearl: "0 4px 12px rgba(0, 0, 0, 0.08), inset 0 2px 4px rgba(255, 255, 255, 0.8)",
  },
  transitions: {
    smooth: "cubic-bezier(0.16, 1, 0.3, 1)",
    silk: "cubic-bezier(0.25, 1, 0.5, 1)",
  },
} as const;
