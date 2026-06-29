import type { InvitationConfig } from "@data/invitations";
import type { ExperienceDefinition } from "@experience/types";
import type { TrueTheme } from "../theme/true-types";

export interface InvitationEngineProps {
  /** Full invitation config — slug lives here; engines must not branch on it */
  config: InvitationConfig;
  /** Registry-resolved visual theme */
  theme: TrueTheme;
  /** Registry-resolved emotional behavior */
  experience: ExperienceDefinition;
}
