import type { Metadata, Viewport } from "next";
import { Playfair_Display, Cinzel, Inter, Montserrat } from "next/font/google";
import { AppProvider } from "@/lib/context";
import "./globals.css";

// ─── Font Declarations ───
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

// ─── SEO Metadata ───
export const metadata: Metadata = {
  title: "Cerimónia de Kulaya — Jessica Muege | HAXR Signature",
  description: "Convite Digital Imersivo para a Cerimónia de Kulaya de Jessica Muege. Uma celebração de raízes, dignidade e continuidade cultural.",
  keywords: ["Jessica Muege", "Kulaya", "Convite Digital", "HAXR Signature", "Moçambique", "Tradição"],
  authors: [{ name: "HAXR Signature" }],
  openGraph: {
    title: "Cerimónia de Kulaya — Jessica Muege | HAXR Signature",
    description: "Convite Digital Imersivo para a Cerimónia de Kulaya de Jessica Muege.",
    type: "website",
    locale: "pt_MZ",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#120A07",
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
      className={`${playfair.variable} ${cinzel.variable} ${inter.variable} ${montserrat.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col antialiased">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
