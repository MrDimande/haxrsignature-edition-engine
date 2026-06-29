export interface EventTheme {
  name: string;
  colors: {
    // Background and base layers
    bgGradient: string;       // linear gradient css classes (e.g., from-pink-50 via-white to-pink-50)
    bgBase: string;           // base hex color (e.g., #FAF5F0 or #120A07)
    
    // Typography colors
    textPrimary: string;      // main heading / title colors
    textSecondary: string;    // subtext / descriptions
    accent: string;           // highlight color (pink or gold)
    accentLight: string;      // light/translucent background highlights
    gold: string;             // gold border / accent highlights
    
    // Card styling
    cardBg: string;           // glassmorphic card classes
    cardBorder: string;       // glass card borders
    cardGlow: string;         // card shadow glow classes
    
    // Interactive buttons
    btnBg: string;
    btnText: string;
    btnBorder: string;
    btnHoverBg: string;
    btnHoverText: string;
    
    // Animated ambient background blobs (GPU blur)
    blob1: string;            // hex/rgba color for blob 1
    blob2: string;            // hex/rgba color for blob 2
    blob3: string;            // hex/rgba color for blob 3
    
    // Divider line color
    divider: string;
  };
  fonts: {
    title: string;            // font family variable
    body: string;             // font family variable
  };
  visuals: {
    monogram: string;         // center initial monogram (e.g., "JM")
    mapFilter: string;        // map tint CSS filter (rose-pink or gold-sepia)
    mapCoordinates: string;   // Google Map latitude, longitude coordinates
    hasWatermark: boolean;    // show tribal SVG watermark
    frameStyle: "classic-rect" | "african-shield"; // portrait frame style
    enterButtonClass: string; // custom button styles
  };
  audio: {
    src: string;
    targetVolume: number;
    fadeInMs: number;
    fadeOutMs: number;
  };
}
