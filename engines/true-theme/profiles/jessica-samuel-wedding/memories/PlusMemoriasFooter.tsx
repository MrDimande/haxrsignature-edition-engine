import React from "react";
import Image from "next/image";
import { Globe, Mail } from "lucide-react";
import { HAXR_AUTH } from "@lib/brand/authorship";

export function PlusMemoriasFooter({ displayName }: { displayName: string }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-16 pt-12 pb-10 px-6 border-t border-[#C9939B]/25 bg-[#F1E3CF] text-center">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Logótipo Oficial HAXR Signature */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <a
            href={HAXR_AUTH.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block transition-transform hover:scale-[1.02]"
            aria-label={`${HAXR_AUTH.brand} — site oficial`}
          >
            <div className="relative w-56 h-20 sm:w-72 sm:h-24 mx-auto my-1">
              <Image
                src={HAXR_AUTH.assets.logoHorizontal}
                alt={HAXR_AUTH.brand}
                fill
                sizes="288px"
                className="object-contain object-center"
              />
            </div>
          </a>

          <div className="w-44 h-px bg-[#C9939B]/40 mx-auto" aria-hidden />
        </div>

        {/* Assinatura */}
        <div className="space-y-1">
          <p className="font-display text-[10px] sm:text-[11px] font-medium tracking-[0.45em] uppercase text-[#7A2332]">
            ALTA-COSTURA DIGITAL
          </p>
          <p className="font-body text-xs sm:text-sm text-[#171312]/60 italic max-w-md mx-auto">
            &ldquo;Engenharia de experiências digitais de luxo, desenhadas à medida com precisão, arte e sofisticação.&rdquo;
          </p>
        </div>

        {/* Contactos & Redes Sociais */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs font-display text-[#171312]">
          <a
            href="https://www.haxrsignature.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFF9F2] border border-[#C9939B]/25 hover:border-[#7A2332] transition-all text-[#171312] hover:text-[#7A2332]"
          >
            <Globe className="w-3.5 h-3.5 text-[#7A2332]" />
            <span>www.haxrsignature.com</span>
          </a>

          <a
            href="https://instagram.com/haxrsignature"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFF9F2] border border-[#C9939B]/25 hover:border-[#7A2332] transition-all text-[#171312] hover:text-[#7A2332]"
          >
            <svg className="w-3.5 h-3.5 text-[#7A2332]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
            </svg>
            <span>@haxrsignature</span>
          </a>

          <a
            href="mailto:hello@haxrsignature.com"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFF9F2] border border-[#C9939B]/25 hover:border-[#7A2332] transition-all text-[#171312] hover:text-[#7A2332]"
          >
            <Mail className="w-3.5 h-3.5 text-[#7A2332]" />
            <span>hello@haxrsignature.com</span>
          </a>
        </div>

        {/* Copyright & Selo */}
        <div className="pt-4 border-t border-[#C9939B]/15 text-[10px] tracking-[0.2em] uppercase text-[#171312]/45 space-y-1">
          <p>© {currentYear} HAXR Signature · Todos os direitos reservados.</p>
          <p className="text-[9px] text-[#7A2332] font-medium tracking-[0.25em]">
            EDITION · PLUS MEMORIES · {displayName}
          </p>
        </div>
      </div>
    </footer>
  );
}
