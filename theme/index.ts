import { kulayaTraditionalTheme } from "./kulaya-traditional";
import { pinkLingerieTheme } from "./pink-lingerie";
import type { EventTheme } from "./types";

export type { EventTheme };
export type { RenderProfile } from "./true-types";

export type {
  ExperienceType,
  ExperienceDefinition,
  ActiveExperienceType,
  FutureExperienceType,
} from "@experience/types";

export {
  ExperienceRegistry,
  getExperience,
  getExperienceOrDefault,
} from "@experience/registry";

export { ThemeRegistry, getRegistryTheme, getThemeKeys } from "./registry";
export type { RegistryThemeKey } from "./registry-types";

export {
  getTheme,
  getTrueTheme,
  resolveThemeTokens,
  resolveExperience,
} from "./resolver";

export { pinkLingerieTrueTheme } from "./definitions/pink-lingerie";
export { kulayaTrueTheme } from "./definitions/kulaya-traditional";
export {
  corporateMinimalTrueTheme,
  corporateTrueTheme,
} from "./definitions/corporate-minimal";
export { brideToBeIllustrationTheme } from "./definitions/bride-to-be-illustration";
export { roseEleganceFarewellTheme } from "./definitions/rose-elegance-farewell";

/** @deprecated Use ThemeRegistry — legacy color-skin resolver */
export const THEMES: Record<string, EventTheme> = {
  "pink-lingerie": pinkLingerieTheme,
  "kulaya-traditional": kulayaTraditionalTheme,
};

/** @deprecated Use getTheme from resolver */
export function getLegacyEventTheme(name?: string): EventTheme {
  if (!name) return kulayaTraditionalTheme;
  return THEMES[name] ?? kulayaTraditionalTheme;
}
