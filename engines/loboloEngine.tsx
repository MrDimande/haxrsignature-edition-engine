"use client";

import { LenisProvider } from "@legacy/lobolo/lenis";
import "@legacy/lobolo/globals.css";
import LoboloPage from "@legacy/lobolo/page";
import type { InvitationEngineProps } from "./types";
import { LoboloFonts } from "./loboloFonts";

export default function LoboloEngine({ config, slug }: InvitationEngineProps) {
  return (
    <LoboloFonts>
      <LenisProvider>
        <div
          data-engine="lobolo"
          data-invitation={slug}
          data-source={config.sourcePath}
        >
          <LoboloPage />
        </div>
      </LenisProvider>
    </LoboloFonts>
  );
}
