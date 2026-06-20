"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export type RSVPStatus = "idle" | "sending" | "success" | "error";

interface AppContextType {
  audioEnabled: boolean;
  setAudioEnabled: (enabled: boolean) => void;
  introComplete: boolean;
  setIntroComplete: (complete: boolean) => void;
  scrollProgress: number;
  setScrollProgress: (progress: number) => void;
  rsvpStatus: RSVPStatus;
  setRsvpStatus: (status: RSVPStatus) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [rsvpStatus, setRsvpStatus] = useState<RSVPStatus>("idle");

  return (
    <AppContext.Provider
      value={{
        audioEnabled,
        setAudioEnabled,
        introComplete,
        setIntroComplete,
        scrollProgress,
        setScrollProgress,
        rsvpStatus,
        setRsvpStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
