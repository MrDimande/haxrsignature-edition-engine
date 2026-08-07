import React from "react";
import Image from "next/image";
import { Globe, Mail } from "lucide-react";
import { HAXR_AUTH } from "@lib/brand/authorship";
import { LoboloCrest, WovenDivider } from "../primavera-motifs";

export function MemoriasFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-16 pt-12 pb-10 px-6 border-t border-[#C9A227]/30 bg-[#F5EDE4] text-center">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Logótipo Oficial HAXR Signature & Brasão Cerimonial */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <a
            href={HAXR_AUTH.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block transition-transform hover:scale-[1.02]"
            aria-label={`${HAXR_AUTH.brand} — site oficial`}
          >
            <div className="relative w-44 h-12 sm:w-56 sm:h-14 mx-auto">
              <Image
                src={HAXR_AUTH.assets.logoHorizontal}
                alt={HAXR_AUTH.brand}
                fill
                sizes="224px"
                className="object-contain object-center"
              />
            </div>
          </a>

          <WovenDivider className="w-44 h-3 opacity-70" color="#C9A227" />
        </div>

        {/* Marca & Assinatura de Alta-Costura */}
        <div className="space-y-1">
          <p className="font-display text-[10px] sm:text-[11px] font-medium tracking-[0.45em] uppercase text-[#C45C26]">
            ALTA-COSTURA DIGITAL
          </p>
          <h4 className="font-display text-lg sm:text-xl font-light text-[#2A1810] tracking-wide">
            Alta-Costura Digital
          </h4>
          <p className="font-body text-xs text-[#4A3020]/75 italic max-w-md mx-auto">
            "Engenharia de experiências digitais de luxo, desenhadas à medida com precisão, arte e sofisticação cerimonial."
          </p>
        </div>

        {/* Contactos & Redes Sociais */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs font-display text-[#2A1810]">
          <a
            href="https://www.haxrsignature.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FBF6F0] border border-[#C9A227]/30 hover:border-[#C45C26] transition-all text-[#2A1810] hover:text-[#C45C26]"
          >
            <Globe className="w-3.5 h-3.5 text-[#C45C26]" />
            <span>www.haxrsignature.com</span>
          </a>

          <a
            href="https://instagram.com/haxrsignature"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FBF6F0] border border-[#C9A227]/30 hover:border-[#C45C26] transition-all text-[#2A1810] hover:text-[#C45C26]"
          >
            <svg className="w-3.5 h-3.5 text-[#C45C26]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
            </svg>
            <span>@haxrsignature</span>
          </a>

          <a
            href="mailto:hello@haxrsignature.com"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FBF6F0] border border-[#C9A227]/30 hover:border-[#C45C26] transition-all text-[#2A1810] hover:text-[#C45C26]"
          >
            <Mail className="w-3.5 h-3.5 text-[#C45C26]" />
            <span>hello@haxrsignature.com</span>
          </a>
        </div>

        {/* Copyright & Selo */}
        <div className="pt-4 border-t border-[#C9A227]/15 text-[10px] tracking-[0.2em] uppercase text-[#4A3020]/60 space-y-1">
          <p>© {currentYear} HAXR Signature · Todos os direitos reservados.</p>
          <p className="text-[9px] text-[#C45C26] font-medium tracking-[0.25em]">
            EDITION · CASAMENTO TRADITIONAL JESSICA MUEGE &amp; SAMUEL GOVENE
          </p>
        </div>
      </div>
    </footer>
  );
}
