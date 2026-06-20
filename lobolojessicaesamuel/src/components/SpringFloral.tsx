"use client";

/**
 * SpringFloralElements — Decorative SVG spring flowers and leaves
 * Used as floating ornaments across sections.
 * Soft orange + gold + sage tones for the Primavera theme.
 */

interface SpringFloralProps {
  className?: string;
  variant?: "corner-top" | "corner-bottom" | "scattered" | "minimal";
}

export default function SpringFloral({
  className = "",
  variant = "scattered",
}: SpringFloralProps) {
  if (variant === "minimal") {
    return (
      <div className={`pointer-events-none ${className}`}>
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="animate-float-gentle"
        >
          {/* Small spring flower */}
          <circle cx="60" cy="50" r="4" fill="#F0A050" opacity="0.5" />
          <ellipse cx="60" cy="42" rx="3" ry="6" fill="#F4C088" opacity="0.4" />
          <ellipse cx="67" cy="47" rx="3" ry="6" fill="#F4C088" opacity="0.35" transform="rotate(72 67 47)" />
          <ellipse cx="65" cy="55" rx="3" ry="6" fill="#F4C088" opacity="0.3" transform="rotate(144 65 55)" />
          <ellipse cx="55" cy="55" rx="3" ry="6" fill="#F4C088" opacity="0.35" transform="rotate(216 55 55)" />
          <ellipse cx="53" cy="47" rx="3" ry="6" fill="#F4C088" opacity="0.4" transform="rotate(288 53 47)" />
          {/* Leaf */}
          <path d="M60 58 Q70 75 60 95" stroke="#A8B89C" strokeWidth="0.8" fill="none" opacity="0.4" />
          <path d="M60 70 Q68 68 72 75" stroke="#A8B89C" strokeWidth="0.5" fill="none" opacity="0.3" />
        </svg>
      </div>
    );
  }

  if (variant === "corner-top") {
    return (
      <div className={`pointer-events-none ${className}`}>
        <svg
          width="200"
          height="200"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Curved stem */}
          <path
            d="M0 0 Q60 30 80 100 Q90 140 70 180"
            stroke="#C8A24A"
            strokeWidth="0.6"
            fill="none"
            opacity="0.3"
          />
          {/* Leaves along stem */}
          <ellipse cx="30" cy="20" rx="12" ry="5" fill="#A8B89C" opacity="0.15" transform="rotate(-30 30 20)" />
          <ellipse cx="55" cy="55" rx="14" ry="5" fill="#C5D1BC" opacity="0.12" transform="rotate(-15 55 55)" />
          <ellipse cx="75" cy="95" rx="12" ry="4" fill="#A8B89C" opacity="0.1" transform="rotate(10 75 95)" />
          {/* Small orange flowers */}
          <circle cx="20" cy="15" r="3" fill="#F0A050" opacity="0.25" />
          <circle cx="50" cy="45" r="2.5" fill="#E67E22" opacity="0.2" />
          <circle cx="78" cy="85" r="2" fill="#F4C088" opacity="0.2" />
          {/* Gold dots */}
          <circle cx="40" cy="30" r="1" fill="#C8A24A" opacity="0.3" />
          <circle cx="65" cy="70" r="1.5" fill="#D4B86A" opacity="0.2" />
        </svg>
      </div>
    );
  }

  if (variant === "corner-bottom") {
    return (
      <div className={`pointer-events-none ${className}`}>
        <svg
          width="200"
          height="200"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="rotate-180"
        >
          <path
            d="M200 200 Q140 170 120 100 Q110 60 130 20"
            stroke="#C8A24A"
            strokeWidth="0.6"
            fill="none"
            opacity="0.3"
          />
          <ellipse cx="170" cy="180" rx="12" ry="5" fill="#A8B89C" opacity="0.15" transform="rotate(30 170 180)" />
          <ellipse cx="145" cy="145" rx="14" ry="5" fill="#C5D1BC" opacity="0.12" transform="rotate(15 145 145)" />
          <circle cx="180" cy="185" r="3" fill="#F0A050" opacity="0.25" />
          <circle cx="150" cy="155" r="2.5" fill="#E67E22" opacity="0.2" />
          <circle cx="160" cy="170" r="1" fill="#C8A24A" opacity="0.3" />
        </svg>
      </div>
    );
  }

  // Scattered variant (default)
  return (
    <div className={`pointer-events-none ${className}`}>
      {/* Top-left cluster */}
      <svg
        width="160"
        height="160"
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute top-8 left-4 md:left-8 animate-float-gentle opacity-40"
      >
        <circle cx="40" cy="40" r="4" fill="#F0A050" opacity="0.5" />
        <circle cx="25" cy="60" r="3" fill="#F4C088" opacity="0.4" />
        <ellipse cx="50" cy="30" rx="15" ry="5" fill="#A8B89C" opacity="0.2" transform="rotate(-20 50 30)" />
        <ellipse cx="20" cy="50" rx="12" ry="4" fill="#C5D1BC" opacity="0.15" transform="rotate(15 20 50)" />
        <path d="M35 45 Q45 70 35 100" stroke="#A8B89C" strokeWidth="0.5" fill="none" opacity="0.25" />
      </svg>

      {/* Bottom-right cluster */}
      <svg
        width="140"
        height="140"
        viewBox="0 0 140 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute bottom-8 right-4 md:right-8 animate-breeze opacity-35"
      >
        <circle cx="100" cy="100" r="3.5" fill="#E67E22" opacity="0.4" />
        <circle cx="85" cy="80" r="2.5" fill="#F4C088" opacity="0.35" />
        <ellipse cx="110" cy="90" rx="14" ry="5" fill="#A8B89C" opacity="0.2" transform="rotate(25 110 90)" />
        <path d="M95 95 Q85 115 95 130" stroke="#C5D1BC" strokeWidth="0.5" fill="none" opacity="0.2" />
        <circle cx="105" cy="70" r="1.5" fill="#C8A24A" opacity="0.3" />
      </svg>
    </div>
  );
}
