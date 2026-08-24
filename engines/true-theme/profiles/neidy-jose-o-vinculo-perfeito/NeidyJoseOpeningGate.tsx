"use client";

import React from "react";
import { NeidyJoseRingsOpening } from "./NeidyJoseRingsOpening";
import "./neidy-jose.css";

interface NeidyJoseOpeningGateProps {
  onComplete: () => void;
}

export function NeidyJoseOpeningGate({ onComplete }: NeidyJoseOpeningGateProps) {
  return <NeidyJoseRingsOpening onComplete={onComplete} />;
}

