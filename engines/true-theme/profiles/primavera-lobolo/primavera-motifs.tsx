"use client";

/** Motivos cerimoniais Primavera — geométricos, sem cliché étnico */

export function CeremonialFrame({
  className = "",
  stroke = "#C9A227",
}: {
  className?: string;
  stroke?: string;
}) {
  return (
    <svg
      viewBox="0 0 400 520"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect
        x="12"
        y="12"
        width="376"
        height="496"
        stroke={stroke}
        strokeWidth="0.75"
        opacity="0.55"
      />
      <path
        d="M12 48 H388 M12 472 H388 M48 12 V508 M352 12 V508"
        stroke={stroke}
        strokeWidth="0.5"
        opacity="0.35"
      />
      <path
        d="M200 12 L212 28 L200 44 L188 28 Z M200 508 L212 492 L200 476 L188 492 Z"
        fill={stroke}
        opacity="0.4"
      />
    </svg>
  );
}

export function WovenDivider({
  className = "",
  color = "#C9A227",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 240 12"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M0 6 H88 M152 6 H240 M96 2 L104 6 L96 10 M136 2 L128 6 L136 10"
        stroke={color}
        strokeWidth="0.75"
        strokeLinecap="round"
      />
      <circle cx="120" cy="6" r="2.5" fill={color} opacity="0.7" />
    </svg>
  );
}

export function SpringPetalCluster({
  className = "",
  fill = "#C45C26",
}: {
  className?: string;
  fill?: string;
}) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden>
      <ellipse cx="32" cy="20" rx="8" ry="14" fill={fill} opacity="0.22" />
      <ellipse cx="20" cy="32" rx="14" ry="8" fill={fill} opacity="0.16" />
      <ellipse cx="44" cy="32" rx="14" ry="8" fill={fill} opacity="0.16" />
      <ellipse cx="32" cy="44" rx="8" ry="14" fill={fill} opacity="0.12" />
    </svg>
  );
}

/** Painel geométrico — inspiração em têxteis do sul de África, sobrio */
export function HeritagePanelPattern({
  className = "",
  color = "#C45C26",
  accent = "#C9A227",
}: {
  className?: string;
  color?: string;
  accent?: string;
}) {
  return (
    <svg
      viewBox="0 0 240 1000"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id="heritageChevron"
          width="80"
          height="96"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M0 24 L40 48 L0 72 M40 24 L80 48 L40 72"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinejoin="miter"
            opacity="0.55"
          />
          <rect x="34" y="44" width="12" height="12" fill={accent} opacity="0.35" transform="rotate(45 40 50)" />
        </pattern>
        <pattern
          id="heritageBars"
          width="120"
          height="180"
          patternUnits="userSpaceOnUse"
        >
          <rect x="8" y="12" width="104" height="6" fill={color} opacity="0.45" rx="1" />
          <rect x="18" y="28" width="84" height="3" fill={accent} opacity="0.35" rx="1" />
          <rect x="8" y="42" width="104" height="6" fill={color} opacity="0.45" rx="1" />
          <path
            d="M20 72 L100 132 M100 72 L20 132"
            stroke={accent}
            strokeWidth="2.5"
            opacity="0.3"
            strokeLinecap="round"
          />
          <circle cx="60" cy="102" r="5" fill="none" stroke={color} strokeWidth="1.5" opacity="0.4" />
        </pattern>
      </defs>
      <rect width="96" height="1000" fill="url(#heritageChevron)" />
      <line x1="98" y1="0" x2="98" y2="1000" stroke={accent} strokeWidth="2" opacity="0.5" />
      <rect x="102" y="0" width="138" height="1000" fill="url(#heritageBars)" />
      <line x1="238" y1="0" x2="238" y2="1000" stroke={accent} strokeWidth="1" opacity="0.35" />
    </svg>
  );
}

/** Contorno discreto do continente africano */
export function AfricaRootsMark({
  className = "",
  stroke = "#C9A227",
}: {
  className?: string;
  stroke?: string;
}) {
  return (
    <svg
      viewBox="0 0 50 55"
      fill="none"
      className={className}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M25 2 C22 2 18 4 16 7 C14 10 12 12 11 15 C10 18 9 20 8 22 C7 25 6 28 6 31 C6 34 7 37 9 39 C10 41 12 43 14 44 C16 46 18 48 20 49 C22 50 24 51 25 51 C27 51 29 50 31 49 C33 48 35 46 36 44 C38 42 39 40 40 38 C41 36 42 33 42 30 C42 27 41 24 40 22 C39 19 37 17 35 14 C33 11 31 8 29 6 C27 4 26 2 25 2Z"
        stroke={stroke}
        strokeWidth="1"
        opacity="0.75"
      />
      <path
        d="M22 15 C20 18 19 22 19 26 C19 30 20 33 22 36"
        stroke={stroke}
        strokeWidth="0.5"
        opacity="0.35"
      />
    </svg>
  );
}

/** Transição hero → cerimónia: meia-lua voltada para baixo */
export function PrimaveraHeroWave() {
  return (
    <div className="primavera-hero-intro__transition" aria-hidden>
      <div className="primavera-hero-intro__feather" />
      <svg
        className="primavera-hero-intro__curve"
        viewBox="0 0 1440 132"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="#FBF6F0"
          d="M0,20 Q720,126 1440,20 L1440,132 L0,132 Z"
        />
      </svg>
    </div>
  );
}

/** Emblema cerimonial Lobolo — círculo com cruz geométrica */
export function LoboloCrest({
  className = "",
  stroke = "#C9A227",
  fill = "#C45C26",
}: {
  className?: string;
  stroke?: string;
  fill?: string;
}) {
  return (
    <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden>
      <circle cx="60" cy="60" r="54" stroke={stroke} strokeWidth="0.75" opacity="0.55" />
      <circle cx="60" cy="60" r="46" stroke={stroke} strokeWidth="0.5" opacity="0.3" />
      <path
        d="M60 24 V96 M24 60 H96 M36 36 L84 84 M84 36 L36 84"
        stroke={stroke}
        strokeWidth="0.6"
        opacity="0.4"
      />
      <rect x="54" y="54" width="12" height="12" fill={fill} opacity="0.5" transform="rotate(45 60 60)" />
    </svg>
  );
}
