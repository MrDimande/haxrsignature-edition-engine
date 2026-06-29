"use client";

import { useExperience } from "./context";
import { AmbientBackground } from "./AmbientBackground";
import { IllustrationAmbient } from "./profiles/illustration-ceremony/IllustrationAmbient";
import { RoseEleganceAmbient } from "./profiles/rose-elegance/RoseEleganceAmbient";

export function AmbientLayer() {
  const { theme } = useExperience();

  if (theme.renderProfile === "illustration-ceremony") {
    return <IllustrationAmbient />;
  }

  if (theme.renderProfile === "rose-elegance") {
    return <RoseEleganceAmbient />;
  }

  return <AmbientBackground />;
}
