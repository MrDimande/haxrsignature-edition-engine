"use client";

import { useExperience } from "./context";
import { AmbientBackground } from "./AmbientBackground";
import { IllustrationAmbient } from "./profiles/illustration-ceremony/IllustrationAmbient";
import { RoseEleganceAmbient } from "./profiles/rose-elegance/RoseEleganceAmbient";
import { PrimaveraLoboloAmbient } from "./profiles/primavera-lobolo/PrimaveraLoboloAmbient";
import { JessicaSamuelAmbient } from "./profiles/jessica-samuel-wedding/JessicaSamuelAmbient";

export function AmbientLayer() {
  const { theme } = useExperience();

  if (theme.renderProfile === "illustration-ceremony") {
    return <IllustrationAmbient />;
  }

  if (theme.renderProfile === "rose-elegance") {
    return <RoseEleganceAmbient />;
  }

  if (theme.renderProfile === "primavera-lobolo") {
    return <PrimaveraLoboloAmbient />;
  }

  if (theme.renderProfile === "jessica-samuel-wedding") {
    return <JessicaSamuelAmbient />;
  }

  return <AmbientBackground />;
}
