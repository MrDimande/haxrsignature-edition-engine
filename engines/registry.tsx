"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { ExperienceDefinition } from "@experience/types";
import type { TrueTheme } from "../theme/true-types";
import type { RegistryEngineMetaKey } from "./registry-meta";
import { resolveCanonicalEngineKey } from "./registry-meta";
import type { InvitationConfig } from "@data/invitations";
import { InvitationLoader } from "./InvitationLoader";
import type { InvitationEngineProps } from "./types";

const TrueThemeEngine = dynamic(() => import("./TrueThemeEngine"), {
  loading: () => <InvitationLoader />,
});

const KulayaEngine = dynamic(() => import("./kulayaEngine"), {
  loading: () => <InvitationLoader />,
});

const LoboloEngine = dynamic(() => import("./loboloEngine"), {
  loading: () => <InvitationLoader />,
});

const TraditionalEngine = dynamic(() => import("./traditionalEngine"), {
  loading: () => <InvitationLoader />,
});

/**
 * EngineRegistry — RENDERING SYSTEM ONLY
 *
 * Maps engine keys → components. Legacy aliases route to unchanged legacy engines.
 * MUST NOT contain theme definitions or invitation data.
 */
export const EngineRegistry: Record<
  RegistryEngineMetaKey,
  ComponentType<InvitationEngineProps>
> = {
  theme: TrueThemeEngine,
  kulaya: KulayaEngine,
  legacyKulaya: KulayaEngine,
  lobolo: LoboloEngine,
  legacyLobolo: LoboloEngine,
  traditional: TraditionalEngine,
  legacyTraditional: TraditionalEngine,
};

export type EngineRegistryKey = RegistryEngineMetaKey;

export function getEngine(
  engineKey: EngineRegistryKey
): ComponentType<InvitationEngineProps> {
  const canonical = resolveCanonicalEngineKey(engineKey);
  return EngineRegistry[canonical];
}

export interface EngineRenderProps {
  config: InvitationConfig;
  theme: TrueTheme;
  experience: ExperienceDefinition;
}

/**
 * Registry-driven render flow — strict separation pipeline.
 * Engine receives config + theme + experience. Never resolves slugs.
 */
export function EngineRenderer({
  config,
  theme,
  experience,
}: EngineRenderProps) {
  const Engine = getEngine(config.engine);
  return <Engine config={config} theme={theme} experience={experience} />;
}

export { ENGINE_META, getEngineMeta, resolveCanonicalEngineKey } from "./registry-meta";
export type { RegistryEngineMetaKey, EngineMeta } from "./registry-meta";
