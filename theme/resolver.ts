import { ThemeRegistry, getRegistryTheme } from "./registry";
import { resolveExperienceTokens } from "./experience-tokens";
import type { ExperienceTokens, ResolvedExperience, TrueTheme } from "./true-types";
import type { RegistryThemeKey } from "./registry-types";

const DEFAULT_THEME_KEY: RegistryThemeKey = "pink-lingerie";

/**
 * Resolves a visual theme from ThemeRegistry.
 * Visual system only — no engine or invitation logic.
 */
export function getTheme(themeName?: string): TrueTheme {
  if (!themeName) {
    return ThemeRegistry[DEFAULT_THEME_KEY];
  }
  return getRegistryTheme(themeName) ?? ThemeRegistry[DEFAULT_THEME_KEY];
}

/** @deprecated Alias — use getTheme */
export function getTrueTheme(name?: string): TrueTheme {
  return getTheme(name);
}

/** Computes layout/motion tokens from a visual theme definition */
export function resolveThemeTokens(theme: TrueTheme): ExperienceTokens {
  return resolveExperienceTokens(theme);
}

/**
 * @deprecated Use getTheme + resolveThemeTokens separately.
 * Kept for internal engine backward compatibility during migration.
 */
export function resolveExperience(themeName?: string): ResolvedExperience {
  const theme = getTheme(themeName);
  return { theme, tokens: resolveThemeTokens(theme) };
}

export { pinkLingerieTrueTheme } from "./definitions/pink-lingerie";
export { kulayaTrueTheme } from "./definitions/kulaya-traditional";
export {
  corporateMinimalTrueTheme,
  corporateTrueTheme,
} from "./definitions/corporate-minimal";
export { brideToBeIllustrationTheme } from "./definitions/bride-to-be-illustration";
export { roseEleganceFarewellTheme } from "./definitions/rose-elegance-farewell";

export { ThemeRegistry, type RegistryThemeKey } from "./registry";
