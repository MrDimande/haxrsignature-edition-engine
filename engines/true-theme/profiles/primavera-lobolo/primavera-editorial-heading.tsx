"use client";

import { WovenDivider } from "./primavera-motifs";
import { PRIMAVERA_SURFACES } from "./primavera-surfaces";

export function PrimaveraEditorialHeading({
  eyebrow,
  title,
  align = "center",
  tone = "default",
  compact = false,
  showWoven = true,
  className = "",
}: {
  eyebrow: string;
  title: string;
  align?: "center" | "left";
  tone?: "default" | "light";
  compact?: boolean;
  showWoven?: boolean;
  className?: string;
}) {
  const titleClass = [
    "primavera-editorial-heading__title",
    tone === "light" ? "primavera-editorial-heading__title--light" : "",
    compact ? "primavera-editorial-heading__title--compact" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={`primavera-editorial-heading ${
        align === "center"
          ? "primavera-editorial-heading--center"
          : "primavera-editorial-heading--left"
      } ${className}`.trim()}
    >
      <p className="primavera-editorial-heading__eyebrow">{eyebrow}</p>
      <h2 className={titleClass}>{title}</h2>
      {showWoven ? (
        <WovenDivider
          className={`w-36 sm:w-44 h-3 mt-5 md:mt-6 ${align === "center" ? "mx-auto" : ""}`}
          color={PRIMAVERA_SURFACES.gold}
        />
      ) : (
        <div className="primavera-editorial-heading__divider" aria-hidden />
      )}
    </div>
  );
}
