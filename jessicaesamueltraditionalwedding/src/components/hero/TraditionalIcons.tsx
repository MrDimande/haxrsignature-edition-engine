export function TraditionalIcons({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`} aria-hidden>
      <svg
        viewBox="0 0 220 140"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full drop-shadow-[0_12px_24px_rgba(0,0,0,0.18)]"
      >
        <defs>
          <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e8f4fc" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#b8d4e8" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="wickerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#c4922a" />
            <stop offset="50%" stopColor="#a06820" />
            <stop offset="100%" stopColor="#7a4f18" />
          </linearGradient>
          <linearGradient id="shellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff8ee" />
            <stop offset="100%" stopColor="#e8dcc8" />
          </linearGradient>
          <linearGradient id="stickGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B6914" />
            <stop offset="100%" stopColor="#c4922a" />
          </linearGradient>
        </defs>

        {/* Garrafa de vime */}
        <g transform="translate(20, 10)">
          <ellipse cx="45" cy="115" rx="28" ry="6" fill="rgba(0,0,0,0.12)" />
          <path
            d="M30 35 L30 105 Q30 118 45 118 Q60 118 60 105 L60 35 Q45 25 30 35 Z"
            fill="url(#glassGrad)"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="0.5"
          />
          {[40, 50, 60, 70, 80, 90, 100].map((y) => (
            <path
              key={y}
              d={`M32 ${y} Q45 ${y - 2} 58 ${y}`}
              fill="none"
              stroke="url(#wickerGrad)"
              strokeWidth="2.5"
            />
          ))}
          {[38, 48, 58, 68, 78, 88].map((y) => (
            <path
              key={`v${y}`}
              d={`M34 ${y} L56 ${y + 4}`}
              fill="none"
              stroke="url(#wickerGrad)"
              strokeWidth="1.5"
              opacity="0.7"
            />
          ))}
          <rect x="38" y="18" width="14" height="18" rx="2" fill="#5c3d2e" />
          <rect x="40" y="12" width="10" height="8" rx="1" fill="#4a3225" />
          <ellipse cx="45" cy="35" rx="12" ry="3" fill="rgba(255,255,255,0.3)" />
        </g>

        {/* Búzios */}
        <g transform="translate(115, 55)">
          <ellipse cx="30" cy="55" rx="22" ry="5" fill="rgba(0,0,0,0.1)" />
          <path
            d="M15 40 Q30 20 45 40 Q48 55 30 58 Q12 55 15 40 Z"
            fill="url(#shellGrad)"
            stroke="#d4c4a8"
            strokeWidth="0.8"
          />
          <path
            d="M18 42 Q30 28 42 42"
            fill="none"
            stroke="#c4b498"
            strokeWidth="0.6"
          />
          <path
            d="M25 48 Q30 38 35 48"
            fill="none"
            stroke="#c4b498"
            strokeWidth="0.5"
          />
        </g>
        <g transform="translate(155, 70) rotate(15)">
          <path
            d="M10 30 Q22 15 34 30 Q36 42 22 44 Q8 42 10 30 Z"
            fill="url(#shellGrad)"
            stroke="#d4c4a8"
            strokeWidth="0.8"
          />
        </g>

        {/* Bastões */}
        <g transform="translate(95, 15)">
          <rect x="0" y="0" width="6" height="55" rx="3" fill="url(#stickGrad)" transform="rotate(-8 3 55)" />
          <rect x="10" y="5" width="5" height="50" rx="2.5" fill="url(#stickGrad)" transform="rotate(4 12 55)" />
          <rect x="19" y="2" width="5" height="52" rx="2.5" fill="url(#stickGrad)" transform="rotate(12 21 54)" />
          <rect x="28" y="8" width="4" height="48" rx="2" fill="url(#stickGrad)" transform="rotate(-5 30 56)" />
          {/* Vime que liga */}
          <path
            d="M-2 48 Q20 42 38 50"
            fill="none"
            stroke="url(#wickerGrad)"
            strokeWidth="2"
          />
        </g>
      </svg>
    </div>
  );
}
