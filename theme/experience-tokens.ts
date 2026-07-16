import type {
  ExperienceLayoutTokens,
  ExperienceMotionTokens,
  ExperienceTokens,
  FlowLayer,
  MoodEmotion,
  MoodEnergy,
  StructureLayer,
  TrueTheme,
  VisualComposition,
  VisualShape,
  VisualSpacing,
} from "./true-types";

const EASE_LUXURY = [0.16, 1, 0.3, 1] as const;
const EASE_CEREMONIAL = [0.76, 0, 0.24, 1] as const;
const EASE_MINIMAL = [0.4, 0, 0.2, 1] as const;

const MOTION_BY_ENERGY: Record<MoodEnergy, ExperienceMotionTokens> = {
  low: {
    duration: 1.6,
    stagger: 0.35,
    ease: EASE_LUXURY,
    introDuration: 2.0,
    scrollLerp: 0.06,
  },
  medium: {
    duration: 1.2,
    stagger: 0.25,
    ease: EASE_LUXURY,
    introDuration: 1.6,
    scrollLerp: 0.08,
  },
  high: {
    duration: 0.85,
    stagger: 0.15,
    ease: EASE_MINIMAL,
    introDuration: 1.0,
    scrollLerp: 0.1,
  },
};

const LAYOUT_BY_STRUCTURE: Record<StructureLayer, ExperienceLayoutTokens> = {
  editorial: {
    sectionPadding: "py-28 md:py-36",
    maxWidth: "max-w-6xl",
    heroGrid: "grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8",
    cardRadius: "rounded-xs",
    frameStyle: "classic-rect",
  },
  ceremonial: {
    sectionPadding: "py-32 md:py-40",
    maxWidth: "max-w-5xl",
    heroGrid: "flex flex-col items-center text-center",
    cardRadius: "rounded-none",
    frameStyle: "african-shield",
  },
  minimal: {
    sectionPadding: "py-20 md:py-28",
    maxWidth: "max-w-4xl",
    heroGrid: "grid grid-cols-1 gap-8",
    cardRadius: "rounded-sm",
    frameStyle: "grid-frame",
  },
  immersive: {
    sectionPadding: "py-36 md:py-48",
    maxWidth: "max-w-7xl",
    heroGrid: "flex flex-col min-h-screen justify-center",
    cardRadius: "rounded-none",
    frameStyle: "glass-panel",
  },
};

const COMPOSITION_OVERRIDES: Record<
  VisualComposition,
  Partial<ExperienceLayoutTokens>
> = {
  "center-focus": {
    heroGrid: "flex flex-col items-center justify-center text-center",
  },
  "magazine-layout": {
    heroGrid: "grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center",
  },
  "immersive-scroll": {
    sectionPadding: "py-40 md:py-52",
    heroGrid: "flex flex-col min-h-[90vh] justify-end pb-24",
  },
};

const SHAPE_FRAME_MAP: Record<VisualShape, ExperienceLayoutTokens["frameStyle"]> = {
  shield: "african-shield",
  glass: "glass-panel",
  "soft-curves": "classic-rect",
  grid: "grid-frame",
};

const SPACING_SECTION_MAP: Record<VisualSpacing, string> = {
  "tight-luxury": "py-20 md:py-24",
  "air-medium": "py-28 md:py-36",
  expansive: "py-36 md:py-48",
};

const FLOW_INTRO_DURATION: Record<FlowLayer, number> = {
  "ritual-entry": 2.4,
  reveal: 1.6,
  direct: 0,
  "story-driven": 2.8,
};

const TYPOGRAPHY_BY_EMOTION: Record<
  MoodEmotion,
  { display: string; body: string }
> = {
  romantic: {
    display: "var(--font-playfair-display), serif",
    body: "var(--font-inter), sans-serif",
  },
  ceremonial: {
    display: "var(--font-playfair-display), serif",
    body: "var(--font-inter), sans-serif",
  },
  luxury: {
    display: "var(--font-playfair-display), serif",
    body: "var(--font-montserrat), sans-serif",
  },
  "soft-intimate": {
    display: "var(--font-playfair-display), serif",
    body: "var(--font-inter), sans-serif",
  },
  celebratory: {
    display: "var(--font-playfair-display), serif",
    body: "var(--font-inter), sans-serif",
  },
};

export function resolveExperienceTokens(theme: TrueTheme): ExperienceTokens {
  const baseMotion = MOTION_BY_ENERGY[theme.mood.energy];
  const baseLayout = LAYOUT_BY_STRUCTURE[theme.structure];
  const compositionOverride = COMPOSITION_OVERRIDES[theme.visuals.composition];

  const motion: ExperienceMotionTokens = {
    ...baseMotion,
    introDuration: FLOW_INTRO_DURATION[theme.flow] || baseMotion.introDuration,
  };

  const layout: ExperienceLayoutTokens = {
    ...baseLayout,
    ...compositionOverride,
    frameStyle: SHAPE_FRAME_MAP[theme.visuals.shapes],
    sectionPadding: SPACING_SECTION_MAP[theme.visuals.spacing],
  };

  const baseTypography = TYPOGRAPHY_BY_EMOTION[theme.mood.emotion];

  const typography =
    theme.renderProfile === "rose-elegance"
      ? {
          display: 'var(--font-cormorant), "Cormorant Garamond", Georgia, serif',
          body: 'var(--font-jost), "Jost", system-ui, sans-serif',
          script: 'var(--font-great-vibes), "Great Vibes", cursive',
        }
      : theme.renderProfile === "primavera-lobolo"
        ? {
            display:
              'var(--font-cormorant), "Cormorant Garamond", Georgia, serif',
            body: 'var(--font-jost), "Jost", system-ui, sans-serif',
            script: 'var(--font-great-vibes), "Great Vibes", cursive',
          }
        : theme.renderProfile === "jessica-samuel-wedding"
          ? {
              display:
                'var(--font-cormorant), "Cormorant Garamond", Georgia, serif',
              body: 'var(--font-inter), "Inter", system-ui, sans-serif',
            }
          : baseTypography;

  return {
    motion,
    layout,
    typography,
  };
}

export function buildPaletteFromColors(
  colors: TrueTheme["colors"]
): TrueTheme["palette"] {
  return {
    bgBase: colors.background,
    textPrimary: colors.primary,
    textSecondary: colors.secondary,
    accent: colors.accent,
    accentLight: `${colors.accent}18`,
    cardBg: "bg-white/40 backdrop-blur-md border border-white/70",
    blob1: `${colors.accent}35`,
    blob2: `${colors.background}`,
    blob3: `${colors.secondary}30`,
    divider: `${colors.accent}40`,
  };
}

export function getCeremonialPalette(): TrueTheme["palette"] {
  return {
    bgBase: "#120A07",
    textPrimary: "text-[#FAF5F0]",
    textSecondary: "text-[#FAF5F0]/70",
    accent: "#D4AF37",
    accentLight: "rgba(212, 175, 55, 0.1)",
    cardBg: "bg-[#1E100A]/35 backdrop-blur-md border border-[#FAF5F0]/5",
    blob1: "rgba(78, 42, 24, 0.25)",
    blob2: "rgba(45, 25, 16, 0.2)",
    blob3: "rgba(197, 160, 89, 0.15)",
    divider: "rgba(212, 175, 55, 0.4)",
  };
}

export function getIntimatePalette(): TrueTheme["palette"] {
  return {
    bgBase: "#FFF9FA",
    textPrimary: "text-[#4A1825]",
    textSecondary: "text-[#7D4F5A]",
    accent: "#E05A75",
    accentLight: "rgba(255, 240, 242, 0.75)",
    cardBg: "bg-white/40 backdrop-blur-md border border-white/70",
    blob1: "rgba(255, 204, 213, 0.35)",
    blob2: "rgba(255, 240, 242, 0.3)",
    blob3: "rgba(251, 207, 232, 0.2)",
    divider: "rgba(224, 90, 117, 0.25)",
  };
}

export function getCorporatePalette(): TrueTheme["palette"] {
  return {
    bgBase: "#F8F9FA",
    textPrimary: "text-[#1A1A2E]",
    textSecondary: "text-[#4A4A68]",
    accent: "#2D3561",
    accentLight: "rgba(45, 53, 97, 0.08)",
    cardBg: "bg-white/80 backdrop-blur-sm border border-[#E8E8ED]",
    blob1: "rgba(45, 53, 97, 0.06)",
    blob2: "rgba(200, 200, 210, 0.15)",
    blob3: "rgba(100, 100, 120, 0.08)",
    divider: "rgba(45, 53, 97, 0.2)",
  };
}

export function getBrideIllustrationPalette(): TrueTheme["palette"] {
  return {
    bgBase: "#FFF5F8",
    textPrimary: "text-[#5C2A3A]",
    textSecondary: "text-[#9B6B7D]",
    accent: "#E8899A",
    accentLight: "rgba(255, 228, 235, 0.85)",
    cardBg: "bg-white/55 backdrop-blur-lg border border-[#F5D0DA]/60",
    blob1: "rgba(255, 192, 203, 0.35)",
    blob2: "rgba(255, 240, 245, 0.5)",
    blob3: "rgba(232, 137, 154, 0.2)",
    divider: "rgba(232, 137, 154, 0.35)",
  };
}

export function getRoseElegancePalette(): TrueTheme["palette"] {
  return {
    bgBase: "#FFE5F0",
    textPrimary: "text-[#3D2430]",
    textSecondary: "text-[#6B3548]",
    accent: "#C9A86C",
    accentLight: "rgba(255, 45, 138, 0.28)",
    cardBg: "bg-white/55 backdrop-blur-lg border border-[#FF2D8A]/38",
    blob1: "rgba(255, 45, 138, 0.32)",
    blob2: "rgba(255, 229, 240, 0.85)",
    blob3: "rgba(255, 45, 138, 0.18)",
    divider: "rgba(201, 168, 108, 0.32)",
  };
}

export function getPrimaveraLoboloPalette(): TrueTheme["palette"] {
  return {
    bgBase: "#F5EDE4",
    textPrimary: "text-[#2A1810]",
    textSecondary: "text-[#5C3A28]",
    accent: "#C9A227",
    accentLight: "rgba(201, 162, 39, 0.18)",
    cardBg:
      "bg-[#FFFAF5]/90 backdrop-blur-sm border border-[#C9A227]/30 shadow-[0_8px_32px_rgba(196,92,38,0.08)]",
    blob1: "rgba(196, 92, 38, 0.14)",
    blob2: "rgba(243, 223, 208, 0.9)",
    blob3: "rgba(201, 162, 39, 0.16)",
    divider: "rgba(201, 162, 39, 0.55)",
  };
}

export function getJessicaSamuelWeddingPalette(): TrueTheme["palette"] {
  return {
    bgBase: "#F1E3CF",
    textPrimary: "text-[#171312]",
    textSecondary: "text-[rgba(23,19,18,0.72)]",
    accent: "#7A2332",
    accentLight: "rgba(122, 35, 50, 0.14)",
    cardBg:
      "bg-[#FFF9F2]/92 backdrop-blur-md border border-[rgba(214,191,162,0.7)] shadow-[0_18px_40px_rgba(23,19,18,0.06)]",
    blob1: "rgba(201, 147, 155, 0.16)",
    blob2: "rgba(255, 249, 242, 0.9)",
    blob3: "rgba(214, 191, 162, 0.28)",
    divider: "rgba(214, 191, 162, 0.75)",
  };
}

export function getFlowExitTransition(flow: FlowLayer): {
  duration: number;
  ease: readonly [number, number, number, number];
} {
  switch (flow) {
    case "ritual-entry":
      return { duration: 1.6, ease: EASE_CEREMONIAL };
    case "reveal":
      return { duration: 1.6, ease: EASE_CEREMONIAL };
    case "story-driven":
      return { duration: 2.0, ease: EASE_LUXURY };
    case "direct":
      return { duration: 0, ease: EASE_MINIMAL };
    default: {
      const _exhaustive: never = flow;
      return _exhaustive;
    }
  }
}
