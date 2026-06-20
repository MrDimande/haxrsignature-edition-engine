import {
  Great_Vibes,
  Montserrat,
  Playfair_Display,
} from "next/font/google";
import "@legacy/traditional/globals.css";
import TraditionalPage from "@legacy/traditional/page";
import type { InvitationEngineProps } from "./types";

const playfair = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat-var",
  subsets: ["latin"],
  display: "swap",
});

const greatVibes = Great_Vibes({
  variable: "--font-great-vibes",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export default function TraditionalEngine({
  config,
  slug,
}: InvitationEngineProps) {
  return (
    <div
      data-engine="traditional"
      data-invitation={slug}
      data-source={config.sourcePath}
      className={`${playfair.variable} ${montserrat.variable} ${greatVibes.variable} min-h-screen antialiased`}
    >
      <TraditionalPage />
    </div>
  );
}
