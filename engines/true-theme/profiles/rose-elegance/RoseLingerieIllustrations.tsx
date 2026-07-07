"use client";

type RoseIllustrationProps = {
  className?: string;
  pink?: string;
  gold?: string;
  ink?: string;
  wash?: string;
};

/** Cena hero — sapato, brinde e perfume · estilo aquarela + traço dourado */
export function RoseLingerieHeroIllustration({
  className = "",
  pink = "#FF2D8A",
  gold = "#C9A86C",
  ink = "#3D2430",
  wash = "#FFE5F0",
}: RoseIllustrationProps) {
  return (
    <svg
      viewBox="0 0 520 380"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <radialGradient id="rose-hero-wash" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor={pink} stopOpacity="0.28" />
          <stop offset="55%" stopColor={pink} stopOpacity="0.12" />
          <stop offset="100%" stopColor={wash} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="rose-heel-fill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor={pink} stopOpacity="0.22" />
        </linearGradient>
        <linearGradient id="rose-drink-fill" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={pink} stopOpacity="0.35" />
          <stop offset="100%" stopColor={pink} stopOpacity="0.65" />
        </linearGradient>
        <linearGradient id="rose-perfume-fill" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor={pink} stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* Wash aquarela */}
      <ellipse cx="260" cy="200" rx="220" ry="150" fill="url(#rose-hero-wash)" />
      <ellipse cx="180" cy="240" rx="90" ry="60" fill={pink} opacity="0.08" />
      <ellipse cx="360" cy="220" rx="70" ry="48" fill={pink} opacity="0.06" />

      {/* Sparkles */}
      {[
        [120, 95],
        [400, 110],
        [260, 70],
        [90, 210],
        [430, 250],
        [310, 300],
      ].map(([cx, cy], i) => (
        <circle
          key={`spark-${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r={i % 2 === 0 ? 2.2 : 1.5}
          fill={gold}
          opacity={0.45}
        />
      ))}

      {/* ── Sapato stiletto + laço ── */}
      <g transform="translate(48, 88)">
        <path
          d="M38 198 C20 198 8 186 8 168 C8 150 22 138 42 132 L78 118 C98 112 118 118 128 132 L148 168 C156 184 146 198 124 198 Z"
          fill="url(#rose-heel-fill)"
          stroke={gold}
          strokeWidth="1.2"
        />
        <path
          d="M42 132 L128 132 L138 168 L32 168 Z"
          fill={`${pink}18`}
          stroke={gold}
          strokeWidth="0.9"
        />
        <path
          d="M118 128 C132 118 148 122 154 136 C160 150 150 162 134 162 C122 162 112 154 108 142"
          fill={`${pink}25`}
          stroke={gold}
          strokeWidth="0.9"
        />
        <path
          d="M108 142 C104 150 98 156 90 158 C82 160 76 154 78 146 C80 138 90 132 100 134"
          fill="#FFFFFF"
          stroke={gold}
          strokeWidth="0.7"
        />
        <circle cx="96" cy="148" r="5" fill="#FFFFFF" stroke={gold} strokeWidth="0.6" />
        <circle cx="92" cy="146" r="1.2" fill={gold} opacity="0.7" />
        <circle cx="98" cy="150" r="1" fill={gold} opacity="0.5" />
        <path d="M128 132 L148 168" stroke={gold} strokeWidth="1" />
        <path d="M148 168 L168 176 L172 184 L36 184 L40 176 L60 168" stroke={gold} strokeWidth="0.8" fill="none" />
      </g>

      {/* ── Copa de brinde ── */}
      <g transform="translate(198, 72)">
        <path
          d="M60 8 L92 108 L28 108 Z"
          fill="url(#rose-drink-fill)"
          stroke={gold}
          strokeWidth="1.2"
        />
        <path d="M60 8 L60 0" stroke={gold} strokeWidth="0.8" />
        <ellipse cx="60" cy="108" rx="34" ry="6" fill={`${pink}15`} stroke={gold} strokeWidth="0.8" />
        <path d="M60 114 L60 168" stroke={gold} strokeWidth="1" />
        <ellipse cx="60" cy="174" rx="22" ry="5" stroke={gold} strokeWidth="0.9" fill="#FFFFFF" />
        <path
          d="M88 36 C104 28 118 34 120 48 C122 58 112 64 100 60"
          stroke={gold}
          strokeWidth="0.8"
          fill="none"
        />
        <circle cx="118" cy="42" r="5" fill={pink} stroke={gold} strokeWidth="0.7" />
        <path d="M122 40 L132 34" stroke={gold} strokeWidth="0.7" />
      </g>

      {/* ── Perfume + laço de seda ── */}
      <g transform="translate(338, 78)">
        <rect
          x="44"
          y="52"
          width="52"
          height="96"
          rx="6"
          fill="url(#rose-perfume-fill)"
          stroke={gold}
          strokeWidth="1.1"
        />
        <path
          d="M52 52 L88 52 L84 28 L56 28 Z"
          fill="#FFFFFF"
          stroke={gold}
          strokeWidth="0.9"
        />
        <rect x="62" y="12" width="16" height="18" rx="3" fill={`${pink}20`} stroke={gold} strokeWidth="0.8" />
        <ellipse cx="70" cy="10" rx="10" ry="4" stroke={gold} strokeWidth="0.7" fill={`${pink}15`} />
        <path
          d="M58 88 C70 96 90 96 102 88"
          stroke={gold}
          strokeWidth="0.6"
          opacity="0.5"
          fill="none"
        />
        <path
          d="M18 118 C30 104 48 100 62 108 C76 116 88 132 82 148 C76 164 52 170 34 160 C16 150 8 132 18 118 Z"
          fill={`${pink}22`}
          stroke={gold}
          strokeWidth="0.9"
        />
        <path
          d="M38 128 C44 122 54 122 58 128 C62 134 56 142 48 142 C40 142 34 136 38 128 Z"
          fill="#FFFFFF"
          stroke={gold}
          strokeWidth="0.6"
        />
        <path
          d="M108 124 C118 112 132 114 138 126 C144 138 134 152 120 154 C106 156 100 136 108 124 Z"
          fill={`${pink}18`}
          stroke={gold}
          strokeWidth="0.8"
        />
      </g>

      {/* Laço decorativo inferior */}
      <path
        d="M220 318 C240 300 280 300 300 318 C280 336 240 336 220 318 Z"
        fill={`${pink}12`}
        stroke={gold}
        strokeWidth="0.7"
        opacity="0.85"
      />
      <path d="M260 318 L260 334" stroke={gold} strokeWidth="0.6" opacity="0.5" />
    </svg>
  );
}

/** Ícone flutuante — sutiã em renda (accent decorativo) */
export function RoseLingerieAccent({
  className = "",
  pink = "#FF2D8A",
  gold = "#C9A86C",
}: RoseIllustrationProps) {
  return (
    <svg viewBox="0 0 64 48" className={className} aria-hidden>
      <path
        d="M8 28 C16 18 28 16 32 22 C36 16 48 18 56 28 C52 36 40 40 32 38 C24 40 12 36 8 28 Z"
        fill={`${pink}22`}
        stroke={gold}
        strokeWidth="0.8"
      />
      <path d="M32 22 L32 38" stroke={gold} strokeWidth="0.5" opacity="0.6" />
      <circle cx="22" cy="28" r="4" fill="#FFFFFF" stroke={gold} strokeWidth="0.5" />
      <circle cx="42" cy="28" r="4" fill="#FFFFFF" stroke={gold} strokeWidth="0.5" />
    </svg>
  );
}
