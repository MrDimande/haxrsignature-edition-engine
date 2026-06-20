import { LenisProvider } from "@/components/LenisProvider";
import type { Metadata } from "next";
import { Great_Vibes, Montserrat, Playfair_Display } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "Jessica & Samuel — Lobolo | HAXR Signature",
  description:
    "Convite digital de casamento tradicional (Lobolo) de Jessica e Samuel. Uma experiência HAXR Signature — cada celebração merece uma assinatura.",
  keywords: [
    "casamento",
    "lobolo",
    "wedding",
    "HAXR Signature",
    "convite digital",
    "Jessica Muege",
    "Samuel Govene",
  ],
  openGraph: {
    title: "Jessica Muege & Samuel Govene — Lobolo",
    description:
      "Está cordialmente convidado(a) para o Lobolo de Jessica Muege e Samuel Govene. 15 de Agosto de 2026.",
    type: "website",
    locale: "pt_MZ",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt"
      className={`${playfair.variable} ${greatVibes.variable} ${montserrat.variable}`}
    >
      <body>
        <LenisProvider>{children}</LenisProvider>
      </body>
    </html>
  );
}
