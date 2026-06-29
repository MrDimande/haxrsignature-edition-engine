"use client";

import { createContext, useContext, type Dispatch, type SetStateAction } from "react";
import type { InvitationConfig } from "@data/invitations";
import type { ExperienceDefinition } from "@experience/types";
import type { ExperienceTokens, TrueTheme } from "../../theme/true-types";
import type { ExperienceAudioPlayer } from "./audio";

export interface ExperienceContextValue {
  theme: TrueTheme;
  tokens: ExperienceTokens;
  experience: ExperienceDefinition;
  config: InvitationConfig;
  audioPlayer: ExperienceAudioPlayer | null;
  audioEnabled: boolean;
  setAudioEnabled: (enabled: boolean) => void;
  introComplete: boolean;
  setIntroComplete: (complete: boolean) => void;
  rsvpStatus: "idle" | "sending" | "success" | "error";
  setRsvpStatus: Dispatch<
    SetStateAction<"idle" | "sending" | "success" | "error">
  >;
}

const ExperienceContext = createContext<ExperienceContextValue | undefined>(
  undefined
);

export const ExperienceProvider = ExperienceContext.Provider;

export function useExperience(): ExperienceContextValue {
  const ctx = useContext(ExperienceContext);
  if (!ctx) {
    throw new Error("useExperience must be used within TrueThemeEngine");
  }
  return ctx;
}
