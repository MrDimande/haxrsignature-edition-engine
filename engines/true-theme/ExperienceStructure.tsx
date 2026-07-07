"use client";

import type { ReactNode } from "react";
import { useExperience } from "./context";

interface ExperienceStructureProps {
  children: ReactNode;
}

export function ExperienceStructure({ children }: ExperienceStructureProps) {
  const { theme, tokens } = useExperience();

  switch (theme.structure) {
    case "editorial":
      return (
        <EditorialStructure layout={tokens.layout}>{children}</EditorialStructure>
      );
    case "ceremonial":
      return (
        <CeremonialStructure layout={tokens.layout}>{children}</CeremonialStructure>
      );
    case "minimal":
      return (
        <MinimalStructure layout={tokens.layout}>{children}</MinimalStructure>
      );
    case "immersive":
      return (
        <ImmersiveStructure layout={tokens.layout}>{children}</ImmersiveStructure>
      );
    default: {
      const _exhaustive: never = theme.structure;
      return _exhaustive;
    }
  }
}

interface StructureShellProps {
  children: ReactNode;
  layout: ReturnType<typeof useExperience>["tokens"]["layout"];
}

function EditorialStructure({ children, layout }: StructureShellProps) {
  return (
    <main
      className={`relative w-full flex flex-col items-center ${layout.maxWidth} mx-auto`}
    >
      {children}
    </main>
  );
}

function CeremonialStructure({ children, layout }: StructureShellProps) {
  const { theme } = useExperience();

  return (
    <main className="relative w-full flex flex-col items-center">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 0%, ${theme.colors.accent} 0%, transparent 60%)`,
        }}
      />
      <div className={`relative w-full ${layout.maxWidth} mx-auto flex flex-col items-center`}>
        {children}
      </div>
    </main>
  );
}

function MinimalStructure({ children, layout }: StructureShellProps) {
  return (
    <main
      className={`relative w-full flex flex-col ${layout.maxWidth} mx-auto px-4`}
    >
      <div className="w-full border-l border-r border-black/5 min-h-full">
        {children}
      </div>
    </main>
  );
}

function ImmersiveStructure({ children, layout }: StructureShellProps) {
  return (
    <main className="relative w-full flex flex-col">
      <div className={`w-full ${layout.maxWidth} mx-auto`}>{children}</div>
    </main>
  );
}
