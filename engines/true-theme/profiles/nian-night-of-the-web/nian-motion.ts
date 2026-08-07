/** Motion tokens — Nian · NIGHT OF THE WEB */
export const NIAN_EASE = [0.22, 1, 0.36, 1] as const;

export const NIAN_COLORS = {
  /** First-paint / SSR-aligned night ground (Nian only). */
  bg: "#03050b",
  royal: "#4169E1",
  crimson: "#E10600",
  ink: "#0A0A0C",
  snow: "#F4F6FB",
  mist: "#8FA3D1",
  /** Body copy on dark — slightly above mist for desktop readability */
  mistStrong: "#A4B4D4",
} as const;
