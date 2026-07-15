"use client";

import { useExperience } from "../../context";
import { PRIMAVERA_SURFACES } from "./primavera-surfaces";
import { SpringPetalCluster } from "./primavera-motifs";

/** Fundo cerimonial Primavera v2 — calor, profundidade, terracota visível */
export function PrimaveraLoboloAmbient() {
  const { theme } = useExperience();

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden -z-10"
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(165deg, ${PRIMAVERA_SURFACES.ivoryLight} 0%, ${PRIMAVERA_SURFACES.ivory} 38%, ${PRIMAVERA_SURFACES.terracottaWash} 100%)`,
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            ${PRIMAVERA_SURFACES.gold} 0px,
            ${PRIMAVERA_SURFACES.gold} 1px,
            transparent 1px,
            transparent 14px
          )`,
        }}
      />
      <div
        className="absolute -top-[15%] -right-[5%] w-[min(75vw,580px)] h-[min(75vw,580px)] rounded-full blur-3xl"
        style={{ backgroundColor: theme.palette.blob1 }}
      />
      <div
        className="absolute bottom-[-10%] -left-[5%] w-[min(70vw,520px)] h-[min(70vw,520px)] rounded-full blur-3xl"
        style={{ backgroundColor: theme.palette.blob3 }}
      />
      <SpringPetalCluster
        className="absolute top-[18%] left-[6%] w-16 h-16 md:w-24 md:h-24 opacity-80"
        fill={PRIMAVERA_SURFACES.terracotta}
      />
      <SpringPetalCluster
        className="absolute bottom-[22%] right-[8%] w-20 h-20 md:w-28 md:h-28 opacity-70 rotate-45"
        fill={PRIMAVERA_SURFACES.gold}
      />
    </div>
  );
}
