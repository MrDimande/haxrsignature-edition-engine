import type { Metadata } from "next";
import { HAXR_AUTH, formatCopyrightShort } from "@lib/brand/authorship";

export const metadata: Metadata = {
  title: HAXR_AUTH.product,
  description: HAXR_AUTH.description,
  authors: [{ name: HAXR_AUTH.brand, url: HAXR_AUTH.website }],
  creator: HAXR_AUTH.brand,
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function PrivateRootPage() {
  return (
    <div className="pattern-overlay relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(212,175,55,0.06)_0%,transparent_55%),radial-gradient(ellipse_at_50%_100%,rgba(61,27,11,0.35)_0%,transparent_50%)]"
      />

      <main className="relative z-10 flex max-w-md flex-col items-center text-center">
        <div className="animate-fade-up mb-8">
          <p className="font-[family-name:var(--font-body)] text-[10px] tracking-[0.5em] text-[#D4AF37]/60 uppercase">
            {HAXR_AUTH.brand}
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-light tracking-wide text-[#F5F0E8] md:text-4xl">
            Edition
          </h1>
        </div>

        <div
          aria-hidden
          className="animate-fade-up-delay-1 mb-8 h-px w-16 bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent"
        />

        <p className="animate-fade-up-delay-1 font-[family-name:var(--font-body)] text-sm leading-relaxed tracking-wide text-[#F5F0E8]/45">
          Acesso privado por convite.
          <br />
          Utilize o link exclusivo que recebeu.
        </p>

        <p className="animate-fade-up-delay-2 mt-12 font-[family-name:var(--font-body)] text-[10px] tracking-[0.35em] text-[#F5F0E8]/25 uppercase">
          {HAXR_AUTH.editionHost}
        </p>
        <p className="animate-fade-up-delay-2 mt-4 font-[family-name:var(--font-body)] text-[9px] tracking-[0.2em] text-[#F5F0E8]/20">
          {formatCopyrightShort()}
        </p>
      </main>
    </div>
  );
}
