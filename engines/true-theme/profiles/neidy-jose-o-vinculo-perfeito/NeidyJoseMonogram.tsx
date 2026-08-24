"use client";

import React from "react";

interface NeidyJoseMonogramProps {
  className?: string;
  variant?: "emboss" | "deboss" | "monochrome" | "outline" | "luminous" | "gold";
  size?: number | string;
}

export function NeidyJoseMonogram({
  className = "",
  variant = "emboss",
  size = 140,
}: NeidyJoseMonogramProps) {
  // Styles based on variant
  const getVariantStyles = () => {
    switch (variant) {
      case "emboss":
        return {
          filter: "drop-shadow(1px 2px 3px rgba(10,33,26,0.18)) drop-shadow(-1px -1px 2px rgba(255,255,255,0.9))",
          stroke: "#0A211A",
          fill: "#0A211A",
          opacity: 0.88,
        };
      case "deboss":
        return {
          filter: "drop-shadow(-1px -1px 2px rgba(10,33,26,0.22)) drop-shadow(1px 1px 2px rgba(255,255,255,0.95))",
          stroke: "#2D5A4C",
          fill: "#2D5A4C",
          opacity: 0.75,
        };
      case "luminous":
        return {
          filter: "drop-shadow(0 0 12px rgba(203,185,148,0.65)) drop-shadow(0 2px 4px rgba(10,33,26,0.2))",
          stroke: "#CBB994",
          fill: "#CBB994",
          opacity: 1,
        };
      case "outline":
        return {
          stroke: "#0A211A",
          strokeWidth: 1.5,
          fill: "none",
          opacity: 0.85,
        };
      case "gold":
        return {
          filter: "drop-shadow(0 2px 6px rgba(203,185,148,0.4))",
          stroke: "#CBB994",
          fill: "#CBB994",
          opacity: 0.95,
        };
      case "monochrome":
      default:
        return {
          stroke: "#0A211A",
          fill: "#0A211A",
          opacity: 0.9,
        };
    }
  };

  const currentStyle = getVariantStyles();

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 240 240"
        className="w-full h-full overflow-visible transition-all duration-700"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Subtle gradient for haute-couture mineral depth */}
          <linearGradient id="nj-monogram-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0A211A" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#1E3E34" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0A211A" stopOpacity="1" />
          </linearGradient>

          <linearGradient id="nj-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E2D4B7" />
            <stop offset="50%" stopColor="#CBB994" />
            <stop offset="100%" stopColor="#A89368" />
          </linearGradient>

          {/* Emboss filter */}
          <filter id="nj-emboss-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
            <feOffset in="blur" dx="1" dy="2" result="offset" />
            <feComponentTransfer in="offset" result="shadow">
              <feFuncA type="linear" slope="0.3" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="shadow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ambient halo ring */}
        <circle
          cx="120"
          cy="120"
          r="102"
          fill="none"
          stroke={variant === "gold" || variant === "luminous" ? "#CBB994" : "#0A211A"}
          strokeWidth="0.75"
          strokeDasharray="4 6"
          opacity="0.28"
        />
        <circle
          cx="120"
          cy="120"
          r="108"
          fill="none"
          stroke={variant === "gold" || variant === "luminous" ? "#CBB994" : "#0A211A"}
          strokeWidth="0.5"
          opacity="0.18"
        />

        {/* Interlocking Calligraphic Monogram N & J */}
        <g
          filter={variant === "emboss" ? "url(#nj-emboss-filter)" : undefined}
          style={currentStyle}
        >
          {/* Letter N: Regal Serif & Slanted Stem */}
          <path
            d="M 68,172 L 68,76 C 68,70 64,68 58,68 L 56,68 L 56,64 L 88,64 L 88,68 C 82,68 78,70 78,76 L 78,148 L 152,66 C 156,62 154,64 150,64 L 148,64 L 148,60 L 176,60 L 176,64 C 170,64 166,66 166,72 L 166,164 C 166,170 170,172 176,172 L 178,172 L 178,176 L 146,176 L 146,172 C 152,172 156,170 156,164 L 156,88 L 78,176 L 68,176 Z"
            fill={variant === "gold" ? "url(#nj-gold-grad)" : variant === "monochrome" || variant === "emboss" ? "url(#nj-monogram-grad)" : currentStyle.fill}
            strokeWidth="0.5"
          />

          {/* Letter J: Flowing Interlocking Swash with Harmonious Descender */}
          <path
            d="M 172,70 C 172,66 176,64 182,64 L 184,64 L 184,60 L 132,60 L 132,64 L 136,64 C 142,64 146,66 146,72 L 146,150 C 146,166 136,178 116,178 C 98,178 88,168 86,154 L 96,152 C 98,162 104,170 116,170 C 128,170 136,162 136,148 L 136,72 C 136,66 132,64 126,64 L 122,64 L 122,60 L 172,60 Z"
            fill={variant === "gold" ? "url(#nj-gold-grad)" : variant === "monochrome" || variant === "emboss" ? "url(#nj-monogram-grad)" : currentStyle.fill}
            strokeWidth="0.5"
            opacity="0.92"
          />

          {/* Elegant Ampersand Accent / Nexus Knot at the center */}
          <path
            d="M 116,118 C 114,114 116,110 120,110 C 124,110 127,113 125,117 C 123,121 117,126 112,130 C 108,133 104,136 104,141 C 104,147 109,151 116,151 C 123,151 129,146 132,141 L 134,143 C 130,150 123,155 114,155 C 105,155 98,149 98,140 C 98,133 103,128 109,123 C 115,118 118,115 118,112 C 118,109 116,108 114,108 C 111,108 109,110 108,113 Z"
            fill="#CBB994"
            opacity="0.85"
          />
        </g>
      </svg>
    </div>
  );
}
