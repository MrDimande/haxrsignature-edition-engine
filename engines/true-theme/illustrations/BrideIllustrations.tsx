"use client";

/** Illustration primitives — 100% vector, zero photography */

interface IllustrationProps {
  className?: string;
  accent?: string;
  primary?: string;
}

export function IllustratedBride({
  className = "",
  accent = "#E8899A",
  primary = "#5C2A3A",
  fill = "#F7F1EC",
}: IllustrationProps & { fill?: string }) {
  return (
    <svg
      viewBox="0 0 280 420"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <ellipse cx="140" cy="380" rx="90" ry="12" fill={accent} opacity="0.12" />
      <path
        d="M140 60 C100 60 75 95 75 135 C75 155 85 170 95 175 L95 320 C95 340 115 355 140 355 C165 355 185 340 185 320 L185 175 C195 170 205 155 205 135 C205 95 180 60 140 60 Z"
        fill={`${accent}22`}
        stroke={primary}
        strokeWidth="1.2"
      />
      <circle cx="140" cy="105" r="38" fill={fill} stroke={primary} strokeWidth="1" />
      <path
        d="M102 105 C102 75 118 55 140 55 C162 55 178 75 178 105"
        stroke={accent}
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M110 130 Q140 155 170 130"
        stroke={primary}
        strokeWidth="0.8"
        opacity="0.5"
      />
      <path
        d="M120 175 L160 175 L155 240 L125 240 Z"
        fill={`${accent}33`}
        stroke={accent}
        strokeWidth="0.8"
      />
      <path
        d="M95 175 C70 190 55 220 50 260 L75 255 C80 225 90 200 95 195"
        fill={`${accent}18`}
        stroke={accent}
        strokeWidth="0.6"
      />
      <path
        d="M185 175 C210 190 225 220 230 260 L205 255 C200 225 190 200 185 195"
        fill={`${accent}18`}
        stroke={accent}
        strokeWidth="0.6"
      />
      <circle cx="125" cy="200" r="4" fill={accent} opacity="0.6" />
      <circle cx="155" cy="200" r="4" fill={accent} opacity="0.6" />
      <path d="M130 320 L150 320" stroke={accent} strokeWidth="0.8" opacity="0.4" />
    </svg>
  );
}

export function FloatingRose({
  className = "",
  accent = "#E8899A",
}: IllustrationProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <circle cx="24" cy="20" r="8" fill={`${accent}44`} stroke={accent} strokeWidth="0.6" />
      <circle cx="18" cy="24" r="6" fill={`${accent}33`} stroke={accent} strokeWidth="0.5" />
      <circle cx="30" cy="24" r="6" fill={`${accent}33`} stroke={accent} strokeWidth="0.5" />
      <path d="M24 28 L24 42" stroke={accent} strokeWidth="0.8" opacity="0.5" />
      <path d="M24 34 Q18 36 16 32" stroke={accent} strokeWidth="0.5" fill="none" opacity="0.4" />
    </svg>
  );
}

export function FloatingLily({
  className = "",
  accent = "#E8899A",
}: IllustrationProps) {
  return (
    <svg viewBox="0 0 40 56" className={className} aria-hidden>
      <ellipse cx="20" cy="18" rx="10" ry="14" fill={`${accent}28`} stroke={accent} strokeWidth="0.5" />
      <ellipse cx="12" cy="22" rx="6" ry="10" fill={`${accent}18`} stroke={accent} strokeWidth="0.4" />
      <ellipse cx="28" cy="22" rx="6" ry="10" fill={`${accent}18`} stroke={accent} strokeWidth="0.4" />
      <line x1="20" y1="30" x2="20" y2="52" stroke={accent} strokeWidth="0.6" opacity="0.45" />
    </svg>
  );
}

export function ChampagneFlutes({
  className = "",
  accent = "#E8899A",
  primary = "#5C2A3A",
}: IllustrationProps) {
  return (
    <svg viewBox="0 0 80 100" className={className} aria-hidden>
      <path d="M20 20 L28 55 L12 55 Z" fill={`${accent}22`} stroke={primary} strokeWidth="0.8" />
      <line x1="20" y1="55" x2="20" y2="85" stroke={primary} strokeWidth="0.8" />
      <ellipse cx="20" cy="88" rx="10" ry="3" stroke={primary} strokeWidth="0.6" fill="none" />
      <path d="M52 25 L60 58 L44 58 Z" fill={`${accent}22`} stroke={primary} strokeWidth="0.8" />
      <line x1="52" y1="58" x2="52" y2="85" stroke={primary} strokeWidth="0.8" />
      <ellipse cx="52" cy="88" rx="10" ry="3" stroke={primary} strokeWidth="0.6" fill="none" />
      <circle cx="24" cy="18" r="3" fill={accent} opacity="0.35" />
      <circle cx="56" cy="22" r="2.5" fill={accent} opacity="0.35" />
    </svg>
  );
}

export function FabricDrape({ className = "", accent = "#E8899A" }: IllustrationProps) {
  return (
    <svg viewBox="0 0 400 120" className={className} preserveAspectRatio="none" aria-hidden>
      <path
        d="M0 0 Q100 80 200 40 T400 0 L400 120 L0 120 Z"
        fill={`${accent}15`}
        stroke={accent}
        strokeWidth="0.5"
        opacity="0.7"
      />
      <path
        d="M0 20 Q120 100 240 50 T400 15"
        fill="none"
        stroke={accent}
        strokeWidth="0.4"
        opacity="0.35"
      />
    </svg>
  );
}

export function PerfumeJewelry({ className = "", accent = "#E8899A", primary = "#5C2A3A" }: IllustrationProps) {
  return (
    <svg viewBox="0 0 100 60" className={className} aria-hidden>
      <rect x="10" y="8" width="20" height="40" rx="4" fill={`${accent}18`} stroke={primary} strokeWidth="0.6" />
      <circle cx="20" cy="8" r="5" stroke={primary} strokeWidth="0.5" fill="none" />
      <circle cx="65" cy="30" r="14" fill="none" stroke={accent} strokeWidth="0.8" />
      <circle cx="65" cy="30" r="4" fill={accent} opacity="0.4" />
      <path d="M79 30 L88 30" stroke={accent} strokeWidth="0.6" />
    </svg>
  );
}

export function InvitationCardFrame({
  className = "",
  accent = "#E8899A",
  primary = "#5C2A3A",
  fill = "rgba(247, 241, 236, 0.65)",
}: IllustrationProps & { fill?: string }) {
  return (
    <svg viewBox="0 0 320 440" className={className} aria-hidden>
      <rect x="8" y="8" width="304" height="424" rx="2" fill={fill} stroke={accent} strokeWidth="1" opacity="0.9" />
      <rect x="20" y="20" width="280" height="400" fill="none" stroke={accent} strokeWidth="0.5" opacity="0.4" />
      <path d="M20 20 L40 20 L20 40 Z" fill={`${accent}25`} />
      <path d="M300 20 L280 20 L300 40 Z" fill={`${accent}25`} />
      <path d="M20 420 L40 420 L20 400 Z" fill={`${accent}25`} />
      <path d="M300 420 L280 420 L300 400 Z" fill={`${accent}25`} />
      <circle cx="160" cy="55" r="18" fill="none" stroke={primary} strokeWidth="0.6" opacity="0.5" />
      <path d="M60 380 L260 380" stroke={accent} strokeWidth="0.4" opacity="0.3" />
    </svg>
  );
}

export function IllustratedMapFrame({
  className = "",
  accent = "#E8899A",
  primary = "#5C2A3A",
  fill = "rgba(247, 241, 236, 0.65)",
}: IllustrationProps & { fill?: string }) {
  return (
    <svg viewBox="0 0 400 280" className={className} aria-hidden>
      <rect x="4" y="4" width="392" height="272" fill={fill} stroke={accent} strokeWidth="1.2" />
      <rect x="16" y="16" width="368" height="248" fill={`${accent}08`} stroke={accent} strokeWidth="0.4" />
      <path d="M80 200 Q160 120 240 180 T360 140" stroke={accent} strokeWidth="1" fill="none" opacity="0.5" />
      <circle cx="200" cy="150" r="24" fill={`${accent}25`} stroke={primary} strokeWidth="0.8" />
      <circle cx="200" cy="150" r="6" fill={accent} />
      <path d="M40 60 L80 60 M40 80 L100 80 M40 100 L70 100" stroke={primary} strokeWidth="0.4" opacity="0.25" />
      <path d="M280 200 L340 200 M260 220 L340 220" stroke={primary} strokeWidth="0.4" opacity="0.25" />
    </svg>
  );
}

export function CelebrationBurst({
  className = "",
  accent = "#E8899A",
}: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <line
          key={deg}
          x1="100"
          y1="100"
          x2={100 + 70 * Math.cos((deg * Math.PI) / 180)}
          y2={100 + 70 * Math.sin((deg * Math.PI) / 180)}
          stroke={accent}
          strokeWidth="0.8"
          opacity="0.35"
        />
      ))}
      <circle cx="100" cy="100" r="20" fill={`${accent}30`} stroke={accent} strokeWidth="0.8" />
      <circle cx="100" cy="100" r="6" fill={accent} opacity="0.6" />
    </svg>
  );
}

export function LingerieSymbol({ className = "", accent = "#E8899A" }: IllustrationProps) {
  return (
    <svg viewBox="0 0 64 48" className={className} aria-hidden>
      <path
        d="M8 20 Q32 8 56 20 L52 38 Q32 44 12 38 Z"
        fill={`${accent}20`}
        stroke={accent}
        strokeWidth="0.7"
      />
      <path d="M20 20 L32 32 L44 20" stroke={accent} strokeWidth="0.5" fill="none" opacity="0.5" />
    </svg>
  );
}
