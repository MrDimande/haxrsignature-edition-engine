"use client";

import { useExperience } from "../../context";
import { QueenKailaneGate } from "./QueenKailaneGate";
import { QueenKailaneFloatingNav } from "./QueenKailaneFloatingNav";
import { QueenKailaneHero } from "./QueenKailaneHero";
import { QueenKailaneStory } from "./QueenKailaneStory";
import { QueenKailaneCelebracao } from "./QueenKailaneCelebracao";
import { QueenKailaneAlmoco } from "./QueenKailaneAlmoco";
import { QueenKailaneVersiculo } from "./QueenKailaneVersiculo";
import { QueenKailaneRsvp } from "./QueenKailaneRsvp";
import { QueenKailaneClosing } from "./QueenKailaneSignature";
import { QueenKailaneHaxrSignature } from "./QueenKailaneHaxrSignature";
import { QUEEN_COLORS } from "./queen-motion";

/**
 * Queen Kailane · LUZ DA GRAÇA — O LIVRO DA FÉ
 * Isolado a renderProfile "queen-kailane-luz-da-graca".
 *
 * Capítulos:
 * PRÓLOGO · Luz da Graça
 * CAPÍTULO I · A Caminhada
 * CAPÍTULO II · O Sacramento
 * CAPÍTULO III · A Palavra (Ápice Espiritual)
 * CAPÍTULO IV · À Mesa
 * CAPÍTULO V · Faz Parte Desta Página
 * EPÍLOGOS · Uma Página de Fé / HAXR Signature
 */
export function QueenKailaneLuzDaGracaExperience() {
  const { introComplete } = useExperience();

  return (
    <div
      className="queen-luz-da-graca relative w-full min-h-screen"
      data-render-profile="queen-kailane-luz-da-graca"
      style={{
        backgroundColor: QUEEN_COLORS.pearl,
        color: QUEEN_COLORS.ink,
        fontFamily:
          "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
      }}
    >
      {/* 3D Tactile Cover & Spine Light Gate */}
      <QueenKailaneGate />

      {/* Linha da Caminhada (Continuous Chronicle Trace) */}
      <div
        className="pointer-events-none fixed top-0 bottom-0 left-6 z-[30] hidden md:block w-px"
        style={{
          background: `linear-gradient(to bottom, ${QUEEN_COLORS.goldLight} 0%, ${QUEEN_COLORS.goldMatte} 50%, ${QUEEN_COLORS.champagne} 100%)`,
          opacity: introComplete ? 0.35 : 0,
          transition: "opacity 1.2s ease-in-out",
        }}
        aria-hidden="true"
      />

      {/* Content Layer: MANTIDO INERT E HIDDEN ENQUANTO A CAPA ESTIVER FECHADA */}
      <div
        {...({
          inert: !introComplete ? "" : undefined,
        } as Record<string, unknown>)}
        aria-hidden={!introComplete ? "true" : undefined}
        className="relative z-[10] transition-opacity duration-700"
        style={{ opacity: introComplete ? 1 : 0.95 }}
      >
        <QueenKailaneFloatingNav />
        <QueenKailaneHero />
        <QueenKailaneStory />
        <QueenKailaneCelebracao />
        <QueenKailaneVersiculo />
        <QueenKailaneAlmoco />
        <QueenKailaneRsvp />
        <QueenKailaneClosing />
        <QueenKailaneHaxrSignature />
      </div>
    </div>
  );
}
