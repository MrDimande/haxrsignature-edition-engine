"use client";

import React from "react";

/**
 * HAXR SIGNATURE — BABY AYLLA | DIOR COLLECTION ROSA
 * Haute Couture vector engravings with brushed pale gold, blush rose poudré and natural pearl beads.
 * Pure SVG vectors: 0 runtime dependencies, pixel-perfect at any retina scaling.
 */

interface IconProps {
  className?: string;
  size?: number;
}

export function CoutureBowIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="diorGoldSheen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DFBA73" />
          <stop offset="50%" stopColor="#F7E7B4" />
          <stop offset="100%" stopColor="#B38728" />
        </linearGradient>
        <linearGradient id="diorRoseSilk" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C87A6E" />
          <stop offset="50%" stopColor="#D4958A" />
          <stop offset="100%" stopColor="#A85A4E" />
        </linearGradient>
      </defs>
      {/* Left Ribbon Loop */}
      <path
        d="M24 23 C18 13 8 15 7 21 C6 26 13 28 24 24 Z"
        fill="url(#diorRoseSilk)"
        stroke="url(#diorGoldSheen)"
        strokeWidth="1"
      />
      {/* Right Ribbon Loop */}
      <path
        d="M24 23 C30 13 40 15 41 21 C42 26 35 28 24 24 Z"
        fill="url(#diorRoseSilk)"
        stroke="url(#diorGoldSheen)"
        strokeWidth="1"
      />
      {/* Ribbon Tails */}
      <path
        d="M22 25 C19 33 14 39 10 43 C14 39 19 34 22 27 Z"
        fill="url(#diorRoseSilk)"
        stroke="url(#diorGoldSheen)"
        strokeWidth="0.8"
      />
      <path
        d="M26 25 C29 33 34 39 38 43 C34 39 29 34 26 27 Z"
        fill="url(#diorRoseSilk)"
        stroke="url(#diorGoldSheen)"
        strokeWidth="0.8"
      />
      {/* Center Pearl Knot */}
      <circle cx="24" cy="23.5" r="4.2" fill="#FBF8F5" stroke="url(#diorGoldSheen)" strokeWidth="1.2" />
      <circle cx="23" cy="22.2" r="1.2" fill="white" opacity="0.9" />
    </svg>
  );
}

export function CoutureCalendarIcon({ className = "", size = 28 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="diorCalGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DFBA73" />
          <stop offset="50%" stopColor="#F7E7B4" />
          <stop offset="100%" stopColor="#B38728" />
        </linearGradient>
      </defs>
      <rect
        x="8"
        y="12"
        width="32"
        height="28"
        rx="5"
        fill="#FCF9F6"
        stroke="url(#diorCalGold)"
        strokeWidth="1.5"
      />
      <path d="M8 20H40" stroke="url(#diorCalGold)" strokeWidth="1.2" strokeDasharray="1 1" />
      <line x1="16" y1="8" x2="16" y2="14" stroke="url(#diorCalGold)" strokeWidth="2" strokeLinecap="round" />
      <line x1="32" y1="8" x2="32" y2="14" stroke="url(#diorCalGold)" strokeWidth="2" strokeLinecap="round" />
      {/* Editorial 23 typography mark */}
      <circle cx="24" cy="29" r="2.5" fill="#C87A6E" />
    </svg>
  );
}

export function CoutureClockIcon({ className = "", size = 28 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="diorClockGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DFBA73" />
          <stop offset="50%" stopColor="#F7E7B4" />
          <stop offset="100%" stopColor="#B38728" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="16" fill="#FCF9F6" stroke="url(#diorClockGold)" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="18" stroke="url(#diorClockGold)" strokeWidth="0.8" opacity="0.6" strokeDasharray="2 3" />
      <line x1="24" y1="24" x2="24" y2="14" stroke="#4A3B39" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="24" y1="24" x2="31" y2="24" stroke="#C87A6E" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="24" cy="24" r="2" fill="#DFBA73" />
    </svg>
  );
}

export function CouturePavilionIcon({ className = "", size = 28 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="diorPavGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DFBA73" />
          <stop offset="50%" stopColor="#F7E7B4" />
          <stop offset="100%" stopColor="#B38728" />
        </linearGradient>
      </defs>
      {/* Dome Top */}
      <path
        d="M12 20 C12 12 24 8 24 8 C24 8 36 12 36 20 Z"
        fill="#FCF9F6"
        stroke="url(#diorPavGold)"
        strokeWidth="1.5"
      />
      {/* Arch Columns */}
      <line x1="14" y1="20" x2="14" y2="36" stroke="url(#diorPavGold)" strokeWidth="1.5" />
      <line x1="20" y1="20" x2="20" y2="36" stroke="url(#diorPavGold)" strokeWidth="1.2" />
      <line x1="28" y1="20" x2="28" y2="36" stroke="url(#diorPavGold)" strokeWidth="1.2" />
      <line x1="34" y1="20" x2="34" y2="36" stroke="url(#diorPavGold)" strokeWidth="1.5" />
      {/* Base Foundation */}
      <rect x="10" y="36" width="28" height="4" rx="1" fill="#FCF9F6" stroke="url(#diorPavGold)" strokeWidth="1.2" />
      {/* Top Finial */}
      <circle cx="24" cy="6.5" r="1.8" fill="#DFBA73" />
    </svg>
  );
}

/**
 * Bespoke Monogram A with Botanical Rose Vine for AYLLA — ÉDITION ROSE
 */
export function CoutureMonogramAIcon({ className = "", size = 56 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="monoGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DFBA73" />
          <stop offset="50%" stopColor="#F7E7B4" />
          <stop offset="100%" stopColor="#B38728" />
        </linearGradient>
        <linearGradient id="monoRose" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D4958A" />
          <stop offset="100%" stopColor="#C87A6E" />
        </linearGradient>
      </defs>
      {/* Circular Filigree Ring */}
      <circle cx="32" cy="32" r="28" stroke="url(#monoGold)" strokeWidth="1" strokeDasharray="3 2" opacity="0.6" />
      <circle cx="32" cy="32" r="25" stroke="url(#monoGold)" strokeWidth="1.5" />

      {/* Classical Serif 'A' Letterform */}
      <path
        d="M23 44 L31 18 H33 L41 44 M26 36 H38"
        stroke="#4A3B39"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Intertwining French Botanical Rose Vine */}
      <path
        d="M20 38 C22 30 28 26 34 24 C38 22 42 25 43 28 C44 32 39 34 35 34 C30 34 26 40 28 44"
        stroke="url(#monoRose)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* Little Rosebud Accent */}
      <circle cx="43" cy="27" r="2.2" fill="#C87A6E" />
      <circle cx="41.5" cy="25.5" r="1.2" fill="#F4D8CD" />
    </svg>
  );
}

/**
 * Botanical French Rose Illustration Accent
 */
export function CoutureBotanicalRoseIcon({ className = "", size = 32 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M24 10 C21 10 18 13 18 16 C18 20 22 23 24 25 C26 23 30 20 30 16 C30 13 27 10 24 10 Z"
        fill="#ECCBC0"
        stroke="#C87A6E"
        strokeWidth="1"
      />
      <path
        d="M24 13 C22 13 20 15 20 17 C20 20 23 22 24 23 C25 22 28 20 28 17 C28 15 26 13 24 13 Z"
        fill="#F4D8CD"
        stroke="#C87A6E"
        strokeWidth="0.8"
      />
      <circle cx="24" cy="16" r="2" fill="#C87A6E" />
      {/* Stem & Leaves */}
      <path d="M24 25 V38" stroke="#7A6662" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M24 30 C20 29 17 32 16 34 C19 35 22 33 24 32" fill="#DFC0B7" stroke="#7A6662" strokeWidth="0.8" />
      <path d="M24 33 C28 32 31 35 32 37 C29 38 26 36 24 35" fill="#DFC0B7" stroke="#7A6662" strokeWidth="0.8" />
    </svg>
  );
}

export function CoutureFiligreeDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 w-full my-8 ${className}`} aria-hidden="true">
      <span className="h-[1px] w-12 sm:w-20 bg-gradient-to-r from-transparent via-[#DFBA73]/60 to-[#DFBA73]" />
      <CoutureBowIcon size={20} className="text-[#DFBA73]" />
      <span className="h-[1px] w-12 sm:w-20 bg-gradient-to-l from-transparent via-[#DFBA73]/60 to-[#DFBA73]" />
    </div>
  );
}
