"use client";

import { useExperience } from "./context";
import { ExperienceFlow as StandardExperienceFlow } from "./ExperienceFlow";
import { IllustrationIntroFlow } from "./profiles/illustration-ceremony/IllustrationIntroFlow";
import { RoseEleganceIntroFlow } from "./profiles/rose-elegance/RoseEleganceIntroFlow";
import { PrimaveraLoboloIntroFlow } from "./profiles/primavera-lobolo/PrimaveraLoboloIntroFlow";
import { JessicaSamuelIntroFlow } from "./profiles/jessica-samuel-wedding/JessicaSamuelIntroFlow";

/** Routes intro flow by theme render profile — not by slug */
export function ExperienceFlowRouter() {
  const { theme } = useExperience();

  if (theme.renderProfile === "illustration-ceremony") {
    return <IllustrationIntroFlow />;
  }

  if (theme.renderProfile === "rose-elegance") {
    return <RoseEleganceIntroFlow />;
  }

  if (theme.renderProfile === "primavera-lobolo") {
    return <PrimaveraLoboloIntroFlow />;
  }

  if (theme.renderProfile === "jessica-samuel-wedding") {
    return <JessicaSamuelIntroFlow />;
  }

  return <StandardExperienceFlow />;
}
