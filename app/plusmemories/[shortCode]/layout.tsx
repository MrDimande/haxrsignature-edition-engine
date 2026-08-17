import type { ReactNode } from "react";
import { Inter, Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair-display",
  weight: ["400", "500", "600"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500"],
  display: "swap",
});

export default function PlusMemoriesShareLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className={`${playfair.variable} ${inter.variable} min-h-screen`}>
      {children}
    </div>
  );
}
