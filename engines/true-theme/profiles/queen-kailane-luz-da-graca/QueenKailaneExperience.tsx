"use client";

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
 * Queen Kailane · LUZ DA GRAÇA
 * Isolado a renderProfile "queen-kailane-luz-da-graca".
 *
 * Capítulos:
 * 00 Gate · 01 Hero · 02 Story · 03 Celebração · 04 À Mesa
 * 05 Versículo · 06 Confirmação · 07 Encerramento · 08 HAXR
 */
export function QueenKailaneLuzDaGracaExperience() {
  return (
    <div
      className="queen-luz-da-graca w-full min-h-screen"
      data-render-profile="queen-kailane-luz-da-graca"
      style={{
        backgroundColor: QUEEN_COLORS.pearl,
        color: QUEEN_COLORS.ink,
        fontFamily:
          "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
      }}
    >
      <QueenKailaneGate />
      <QueenKailaneFloatingNav />
      <QueenKailaneHero />
      <QueenKailaneStory />
      <QueenKailaneCelebracao />
      <QueenKailaneAlmoco />
      <QueenKailaneVersiculo />
      <QueenKailaneRsvp />
      <QueenKailaneClosing />
      <QueenKailaneHaxrSignature />
    </div>
  );
}
