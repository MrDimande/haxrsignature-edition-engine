import {
  Great_Vibes,
  Montserrat,
  Playfair_Display,
} from "next/font/google";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const greatVibes = Great_Vibes({
  variable: "--font-great-vibes",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export function LoboloFonts({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${playfair.variable} ${greatVibes.variable} ${montserrat.variable}`}
    >
      {children}
    </div>
  );
}
