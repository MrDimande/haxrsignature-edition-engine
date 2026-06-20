"use client";

import React, { ReactNode } from "react";
import { ReactLenis } from "lenis/react";

export default function LenisProvider({ children }: { children: ReactNode }) {
  return (
    <ReactLenis 
      root 
      options={{ 
        lerp: 0.08, 
        duration: 1.5, 
        smoothWheel: true,
        wheelMultiplier: 1.0,
        touchMultiplier: 1.2,
      }}
    >
      {children}
    </ReactLenis>
  );
}
