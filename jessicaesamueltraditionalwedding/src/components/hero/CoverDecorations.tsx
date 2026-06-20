export function SwirlPattern({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 400"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <pattern
          id="swirl"
          x="0"
          y="0"
          width="120"
          height="120"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M10 60c20-30 50-20 60 0s-10 50-30 40-40-10-30-40zm40 20c15-20 35-10 40 5s-5 30-20 25-25-5-20-30z"
            fill="none"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="1.2"
          />
          <path
            d="M60 10c-10 25 5 45 25 45s35-15 30-40-25-30-55-5zm20 80c10-15 30-5 35 10s-10 25-25 20-30-10-10-30z"
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1"
          />
          <circle cx="90" cy="30" r="2" fill="rgba(255,255,255,0.12)" />
          <circle cx="25" cy="95" r="1.5" fill="rgba(255,255,255,0.1)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#swirl)" />
    </svg>
  );
}

export function MandalaEmblem({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`} aria-hidden>
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gold via-gold-light to-spring-orange shadow-[0_8px_32px_rgba(212,175,55,0.45),inset_0_2px_4px_rgba(255,255,255,0.35)]" />
      <div className="absolute inset-[5px] rounded-full bg-gradient-to-br from-[#faf6f0] to-[#f0e8dc] shadow-inner" />
      <svg
        className="absolute inset-[10px]"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="mandalaGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d4af37" />
            <stop offset="50%" stopColor="#f5a623" />
            <stop offset="100%" stopColor="#e87722" />
          </linearGradient>
        </defs>
        {[0, 45, 90, 135].map((angle) => (
          <g key={angle} transform={`rotate(${angle} 50 50)`}>
            <path
              d="M50 8 C58 20, 62 30, 50 42 C38 30, 42 20, 50 8 Z"
              fill="url(#mandalaGold)"
              opacity="0.85"
            />
            <path
              d="M50 58 C58 70, 62 80, 50 92 C38 80, 42 70, 50 58 Z"
              fill="url(#mandalaGold)"
              opacity="0.6"
            />
          </g>
        ))}
        <circle
          cx="50"
          cy="50"
          r="12"
          fill="none"
          stroke="url(#mandalaGold)"
          strokeWidth="1.5"
        />
        <circle cx="50" cy="50" r="5" fill="url(#mandalaGold)" />
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i * 45 * Math.PI) / 180;
          const x = 50 + Math.cos(a) * 22;
          const y = 50 + Math.sin(a) * 22;
          return <circle key={i} cx={x} cy={y} r="2.5" fill="#d4af37" />;
        })}
      </svg>
    </div>
  );
}

export function MandalaWatermark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="wmGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d4af37" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#e87722" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      {[0, 60, 120].map((angle) => (
        <g key={angle} transform={`rotate(${angle} 100 100)`}>
          <path
            d="M100 20 C115 50, 120 70, 100 90 C80 70, 85 50, 100 20 Z"
            fill="url(#wmGold)"
          />
        </g>
      ))}
      <circle
        cx="100"
        cy="100"
        r="30"
        fill="none"
        stroke="url(#wmGold)"
        strokeWidth="2"
      />
    </svg>
  );
}
