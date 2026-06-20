"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { EngineType, InvitationConfig } from "@data/invitations";
import { InvitationLoader } from "./InvitationLoader";
import type { InvitationEngineProps } from "./types";

const ENGINES: Record<
  EngineType,
  ComponentType<InvitationEngineProps>
> = {
  kulaya: dynamic(() => import("./kulayaEngine"), {
    loading: () => <InvitationLoader />,
  }),
  lobolo: dynamic(() => import("./loboloEngine"), {
    loading: () => <InvitationLoader />,
  }),
  traditional: dynamic(() => import("./traditionalEngine"), {
    loading: () => <InvitationLoader />,
  }),
};

export interface EngineRenderProps {
  config: InvitationConfig;
  slug: string;
}

export function EngineRenderer({ config, slug }: EngineRenderProps) {
  const Engine = ENGINES[config.engine];
  return <Engine config={config} slug={slug} />;
}
