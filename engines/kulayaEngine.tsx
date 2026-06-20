"use client";

import {
  Playfair_Display,
  Cinzel,
  Inter,
  Montserrat,
} from "next/font/google";
import { AppProvider } from "@legacy/jessicakhulaya/context";
import "@legacy/jessicakhulaya/globals.css";
import KulayaPage from "@legacy/jessicakhulaya/page";
import type { InvitationEngineProps } from "./types";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair-display",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const fontClasses = `${playfair.variable} ${cinzel.variable} ${inter.variable} ${montserrat.variable}`;

export default function KulayaEngine({ config, slug }: InvitationEngineProps) {
  return (
    <div
      data-engine="kulaya"
      data-invitation={slug}
      data-source={config.sourcePath}
      className={`${fontClasses} min-h-full flex flex-col antialiased`}
    >
      <AppProvider>
        <KulayaPage />
      </AppProvider>
    </div>
  );
}
