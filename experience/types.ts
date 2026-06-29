/**
 * Experience Type System — emotional behavior model ONLY
 *
 * NO visual tokens. NO engine logic.
 */

/** Active experience types used by production invitations */
export type ActiveExperienceType =
  | "intimate"
  | "ceremonial"
  | "editorial"
  | "luxury-minimal"
  | "bride-to-be";

/** Future emotional worlds — architecture prepared, not yet wired to UI */
export type FutureExperienceType =
  | "romantic-editorial"
  | "celebration-luxury"
  | "ceremonial-ritual";

export type ExperienceType = ActiveExperienceType | FutureExperienceType;

export interface ExperienceDefinition {
  id: ExperienceType;
  label: string;
  status: "active" | "future";
  /** Animation intensity — controls motion speed and transition weight */
  animationIntensity: "low" | "medium" | "high";
  /** Interaction density — controls how much the guest interacts before content */
  interactionDensity: "minimal" | "balanced" | "immersive";
  /** Emotional tone — narrative rhythm, not visual color */
  emotionalTone: "warm" | "solemn" | "editorial" | "corporate" | "celebratory";
  /** Entry interaction pattern */
  interactionStyle: "ritual" | "reveal" | "direct" | "narrative";
}
