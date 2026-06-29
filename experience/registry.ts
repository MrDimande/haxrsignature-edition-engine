import type { ExperienceDefinition, ExperienceType } from "./types";

/**
 * ExperienceRegistry — EMOTIONAL BEHAVIOR ONLY
 *
 * Controls animation intensity, interaction density, emotional tone.
 * MUST NOT contain visual tokens or engine components.
 */
export const ExperienceRegistry: Record<ExperienceType, ExperienceDefinition> = {
  intimate: {
    id: "intimate",
    label: "Intimate Celebration",
    status: "active",
    animationIntensity: "medium",
    interactionDensity: "balanced",
    emotionalTone: "warm",
    interactionStyle: "reveal",
  },
  ceremonial: {
    id: "ceremonial",
    label: "Ceremonial Ritual",
    status: "active",
    animationIntensity: "low",
    interactionDensity: "immersive",
    emotionalTone: "solemn",
    interactionStyle: "ritual",
  },
  editorial: {
    id: "editorial",
    label: "Editorial Magazine",
    status: "active",
    animationIntensity: "medium",
    interactionDensity: "balanced",
    emotionalTone: "editorial",
    interactionStyle: "narrative",
  },
  "luxury-minimal": {
    id: "luxury-minimal",
    label: "Luxury Minimal",
    status: "active",
    animationIntensity: "high",
    interactionDensity: "minimal",
    emotionalTone: "corporate",
    interactionStyle: "direct",
  },
  "bride-to-be": {
    id: "bride-to-be",
    label: "Bride-to-Be Journey",
    status: "active",
    animationIntensity: "medium",
    interactionDensity: "immersive",
    emotionalTone: "celebratory",
    interactionStyle: "narrative",
  },
  "romantic-editorial": {
    id: "romantic-editorial",
    label: "Romantic Editorial",
    status: "future",
    animationIntensity: "medium",
    interactionDensity: "balanced",
    emotionalTone: "warm",
    interactionStyle: "narrative",
  },
  "celebration-luxury": {
    id: "celebration-luxury",
    label: "Celebration Luxury",
    status: "future",
    animationIntensity: "high",
    interactionDensity: "immersive",
    emotionalTone: "celebratory",
    interactionStyle: "reveal",
  },
  "ceremonial-ritual": {
    id: "ceremonial-ritual",
    label: "Ceremonial Ritual (Extended)",
    status: "future",
    animationIntensity: "low",
    interactionDensity: "immersive",
    emotionalTone: "solemn",
    interactionStyle: "ritual",
  },
};

const DEFAULT_EXPERIENCE: ExperienceType = "intimate";

export function getExperience(type: ExperienceType): ExperienceDefinition {
  return ExperienceRegistry[type];
}

export function getExperienceOrDefault(
  type?: ExperienceType
): ExperienceDefinition {
  if (!type) return ExperienceRegistry[DEFAULT_EXPERIENCE];
  return ExperienceRegistry[type] ?? ExperienceRegistry[DEFAULT_EXPERIENCE];
}

export function getExperienceKeys(): ExperienceType[] {
  return Object.keys(ExperienceRegistry) as ExperienceType[];
}

/** @deprecated Use getExperience */
export function getExperienceDefinition(
  type: ExperienceType
): ExperienceDefinition {
  return getExperience(type);
}

/** @deprecated Use ExperienceRegistry */
export const EXPERIENCE_DEFINITIONS = ExperienceRegistry;
