import { primaveraLoboloTheme } from "./definitions/primavera-lobolo";
import { jessicaSamuelWeddingTheme } from "./definitions/jessica-samuel-wedding";
import { brideToBeIllustrationTheme } from "./definitions/bride-to-be-illustration";
import { corporateMinimalTrueTheme } from "./definitions/corporate-minimal";
import { kulayaTrueTheme } from "./definitions/kulaya-traditional";
import { pinkLingerieTrueTheme } from "./definitions/pink-lingerie";
import { roseEleganceFarewellTheme } from "./definitions/rose-elegance-farewell";
import type { TrueTheme } from "./true-types";
import type { RegistryThemeKey } from "./registry-types";

/**
 * ThemeRegistry — VISUAL SYSTEM ONLY
 */
export const ThemeRegistry: Record<RegistryThemeKey, TrueTheme> = {
  "pink-lingerie": pinkLingerieTrueTheme,
  "kulaya-traditional": kulayaTrueTheme,
  "corporate-minimal": corporateMinimalTrueTheme,
  "bride-to-be-illustration": brideToBeIllustrationTheme,
  "rose-elegance-farewell": roseEleganceFarewellTheme,
  "primavera-lobolo": primaveraLoboloTheme,
  "jessica-samuel-wedding": jessicaSamuelWeddingTheme,
};

export type { RegistryThemeKey };

export function getRegistryTheme(name: string): TrueTheme | undefined {
  return ThemeRegistry[name as RegistryThemeKey];
}

export function getThemeKeys(): RegistryThemeKey[] {
  return Object.keys(ThemeRegistry) as RegistryThemeKey[];
}
