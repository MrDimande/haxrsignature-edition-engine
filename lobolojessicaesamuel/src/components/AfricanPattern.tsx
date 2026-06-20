"use client";

interface AfricanPatternProps {
  className?: string;
  variant?: "bold-tribal" | "subtle" | "zigzag-strip";
  color?: string;
  opacity?: number;
}

/**
 * Bold African tribal geometric patterns.
 * "bold-tribal" variant matches the reference design with parallel vertical columns:
 * - Left column: bold zigzags / chevrons.
 * - Middle divider line.
 * - Right column: blocky geometric lines, triangles, bars, and cross crossings.
 */
export default function AfricanPattern({
  className = "",
  variant = "bold-tribal",
  color = "#E67E22",
  opacity = 1,
}: AfricanPatternProps) {
  if (variant === "bold-tribal") {
    return (
      <div className={`pointer-events-none ${className}`} style={{ opacity }}>
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 240 1000"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Left Column Pattern: Repeating Chevron/Zigzag chains */}
            <pattern
              id="leftZigzag"
              x="0"
              y="0"
              width="100"
              height="120"
              patternUnits="userSpaceOnUse"
            >
              {/* Chevron pointing right */}
              <path
                d="M -10 20 L 50 60 L -10 100"
                fill="none"
                stroke={color}
                strokeWidth="10"
                strokeLinejoin="miter"
                strokeLinecap="square"
              />
              <path
                d="M 40 20 L 100 60 L 40 100"
                fill="none"
                stroke={color}
                strokeWidth="10"
                strokeLinejoin="miter"
                strokeLinecap="square"
              />
              {/* Small accent diamonds in empty areas to feel handcrafted */}
              <polygon points="20,60 25,55 30,60 25,65" fill={color} />
              <polygon points="70,20 75,15 80,20 75,25" fill={color} />
              <polygon points="70,100 75,95 80,100 75,105" fill={color} />
            </pattern>

            {/* Right Column Pattern: Complex blocky geometric/X shapes */}
            <pattern
              id="rightGeometric"
              x="0"
              y="0"
              width="140"
              height="240"
              patternUnits="userSpaceOnUse"
            >
              {/* Section 1: Inverted chevron block */}
              <path
                d="M 15 20 L 70 65 L 125 20"
                fill="none"
                stroke={color}
                strokeWidth="8"
                strokeLinejoin="miter"
              />
              <path
                d="M 15 40 L 70 85 L 125 40"
                fill="none"
                stroke={color}
                strokeWidth="5"
                strokeLinejoin="miter"
              />
              <polygon points="62,85 70,95 78,85" fill={color} />

              {/* Section 2: Bold horizontal tribal lines / rectangles */}
              <rect x="15" y="110" width="110" height="10" fill={color} rx="2" />
              <rect x="25" y="128" width="90" height="5" fill={color} rx="1" />
              <rect x="15" y="141" width="110" height="10" fill={color} rx="2" />

              {/* Section 3: Cross crossing panel (X motif) with circles */}
              <path
                d="M 20 165 L 120 225 M 120 165 L 20 225"
                stroke={color}
                strokeWidth="6"
                strokeLinecap="round"
              />
              <circle cx="70" cy="195" r="9" fill="none" stroke={color} strokeWidth="3.5" />
              <circle cx="70" cy="195" r="3.5" fill={color} />
              <circle cx="30" cy="195" r="2.5" fill={color} />
              <circle cx="110" cy="195" r="2.5" fill={color} />
            </pattern>
          </defs>

          {/* Draw Left Column Zigzag Pattern */}
          <rect x="0" y="0" width="96" height="1000" fill="url(#leftZigzag)" />

          {/* Thick vertical separator line */}
          <line x1="98" y1="0" x2="98" y2="1000" stroke={color} strokeWidth="6" />

          {/* Draw Right Column Geometric Pattern */}
          <rect x="102" y="0" width="134" height="1000" fill="url(#rightGeometric)" />

          {/* Far-right border vertical separator line */}
          <line x1="237" y1="0" x2="237" y2="1000" stroke={color} strokeWidth="6" />
        </svg>
      </div>
    );
  }

  if (variant === "zigzag-strip") {
    return (
      <div className={`pointer-events-none ${className}`} style={{ opacity }}>
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 60 400"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="stripZigzag"
              x="0"
              y="0"
              width="60"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M0 20 L15 5 L30 20 L45 5 L60 20"
                fill="none"
                stroke={color}
                strokeWidth="3"
                strokeLinejoin="miter"
              />
              <path
                d="M0 20 L15 35 L30 20 L45 35 L60 20"
                fill="none"
                stroke={color}
                strokeWidth="3"
                strokeLinejoin="miter"
              />
            </pattern>
          </defs>
          <rect width="60" height="400" fill="url(#stripZigzag)" />
        </svg>
      </div>
    );
  }

  // Subtle variant (for light sections)
  return (
    <div className={`pointer-events-none ${className}`} style={{ opacity }}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 200 800"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="subtleTribal"
            x="0"
            y="0"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M20 0 L40 20 L20 40 L0 20 Z"
              fill="none"
              stroke={color}
              strokeWidth="0.8"
            />
            <path
              d="M20 8 L32 20 L20 32 L8 20 Z"
              fill="none"
              stroke={color}
              strokeWidth="0.5"
            />
            <circle cx="20" cy="20" r="1.5" fill={color} />
          </pattern>
        </defs>
        <rect width="200" height="800" fill="url(#subtleTribal)" />
      </svg>
    </div>
  );
}
