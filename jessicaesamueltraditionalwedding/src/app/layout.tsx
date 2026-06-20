import type { Metadata, Viewport } from "next";
import { Great_Vibes, Montserrat, Playfair_Display } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "Jessica Muege & Samuel Govene | Nosso Capitulo Tradicional",
  description:
    "Convite digital para o Casamento Tradicional (Lobolo) de Jessica Muege & Samuel Govene. Tema Primavera — laranja, dourado e branco. Copo de Água às 13h30.",
  keywords: [
    "casamento",
    "lobolo",
    "convite digital",
    "Jessica",
    "Samuel",
    "HAXR Signature",
  ],
  openGraph: {
    title: "Jessica & Samuel | Convite Digital",
    description: "O Início da Nossa Maior Celebração",
    type: "website",
    locale: "pt_MZ",
  },
};

export const viewport: Viewport = {
  themeColor: "#F5F2EC",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt"
      className={`${playfair.variable} ${montserrat.variable} ${greatVibes.variable}`}
    >
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
