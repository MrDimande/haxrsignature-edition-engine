"use client";

import Image from "next/image";

/* ==========================================================================
   Bespoke Authorial SVG Icons & Monogram Seal (1.2px Hairline Elegance)
   Haute Couture digital craftsmanship for Alexandrina & Kenneth Wedding Atelier
   ========================================================================== */

function HeraldicCoupleMonogram({ className = "w-20 h-20" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      aria-label="Monograma HerÃ¡ldico de Alexandrina & Kenneth"
    >
      {/* Outer subtle gold ring */}
      <circle cx="60" cy="60" r="56" stroke="#d4af37" strokeWidth="1" strokeOpacity="0.38" />

      {/* Inner dotted halo */}
      <circle cx="60" cy="60" r="51" stroke="#d4af37" strokeWidth="1" strokeDasharray="3 3.5" strokeOpacity="0.6" />

      {/* Laurel branches at base symbolizing eternal union */}
      <path
        d="M32 78C38 88 49 92 60 92C71 92 82 88 88 78"
        stroke="#d4af37"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeOpacity="0.8"
      />
      <path
        d="M34 74C32 80 35 84 40 86"
        stroke="#d4af37"
        strokeWidth="1"
        strokeLinecap="round"
        strokeOpacity="0.6"
      />
      <path
        d="M86 74C88 80 85 84 80 86"
        stroke="#d4af37"
        strokeWidth="1"
        strokeLinecap="round"
        strokeOpacity="0.6"
      />

      {/* Apex Diamond Emblem */}
      <path
        d="M60 22L64 28L60 34L56 28Z"
        fill="#d4af37"
        stroke="#f7e7a9"
        strokeWidth="0.5"
      />

      {/* Intertwined Calligraphic Initials A & K */}
      <text
        x="47"
        y="65"
        fill="#ffe9b8"
        fontFamily="var(--font-playfair-display), 'Playfair Display', Georgia, serif"
        fontSize="34"
        fontStyle="italic"
        fontWeight="400"
        textAnchor="middle"
        style={{ filter: "drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5))" }}
      >
        A
      </text>

      {/* Center gold dot */}
      <circle cx="60" cy="58" r="1.5" fill="#d4af37" />

      <text
        x="74"
        y="68"
        fill="#d4af37"
        fontFamily="var(--font-playfair-display), 'Playfair Display', Georgia, serif"
        fontSize="34"
        fontWeight="400"
        textAnchor="middle"
        style={{ filter: "drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5))" }}
      >
        K
      </text>

      {/* Roman Year Inscription */}
      <text
        x="60"
        y="83"
        fill="#d4af37"
        fontFamily="'Montserrat', sans-serif"
        fontSize="7.5"
        letterSpacing="0.28em"
        fontWeight="600"
        textAnchor="middle"
        opacity="0.9"
      >
        MMXXVII
      </text>
    </svg>
  );
}

function HauteCoutureMusicDiscIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2a10 10 0 0 1 10 10" strokeDasharray="2 3" opacity="0.6" />
      <path d="M12 22a10 10 0 0 1-10-10" strokeDasharray="2 3" opacity="0.6" />
    </svg>
  );
}

export function AlexandrinaKennethFooter() {
  return (
    <footer className="premium-footer ak-footer relative overflow-hidden" aria-label="RodapÃ© do convite">
      {/* Top golden hairline divider com degradÃ© luminoso */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px] z-10 pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(212, 175, 55, 0.25) 15%, rgba(212, 175, 55, 0.85) 50%, rgba(212, 175, 55, 0.25) 85%, transparent 100%)",
        }}
        aria-hidden="true"
      />

      <div
        className="container premium-footer__inner relative z-10 px-4 pt-16 md:pt-24 pb-[130px] max-w-3xl mx-auto flex flex-col items-center text-center"
        style={{ paddingBottom: "130px" }}
      >
        {/* 1. Monograma HerÃ¡ldico Real A â– K */}
        <div className="ak-footer-monogram-wrap mb-4">
          <HeraldicCoupleMonogram className="w-20 h-20 sm:w-24 sm:h-24 drop-shadow-[0_4px_20px_rgba(212,175,55,0.3)]" />
        </div>

        {/* 2. Eyebrow Cerimonial */}
        <p className="ak-footer-eyebrow font-sans text-[0.68rem] md:text-xs tracking-[0.32em] uppercase text-[#d4af37]/90 font-semibold mb-2">
          CelebraÃ§Ã£o Matrimonial
        </p>

        {/* 3. Nomes Monumentais dos Noivos em Caligrafia Oficial */}
        <h3
          className="ak-footer-names text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal text-[#ffe9b8] leading-tight my-2"
          style={{
            fontFamily: "var(--font-great-vibes), 'Great Vibes', var(--font-playfair-display), var(--font-display), 'Playfair Display', Georgia, serif",
            textShadow: "0 4px 28px rgba(0, 0, 0, 0.7), 0 0 36px rgba(212, 175, 55, 0.35)",
          }}
          aria-label="Alexandrina e Kenneth"
        >
          Alexandrina <span className="font-serif italic text-2xl sm:text-3xl md:text-4xl text-[#d4af37]/90 mx-1.5" aria-hidden="true">&amp;</span> Kenneth
        </h3>

        {/* 4. Data e Localidade com EspaÃ§amento Editorial */}
        <p className="ak-footer-date-badge font-sans text-[0.75rem] md:text-xs tracking-[0.28em] uppercase text-[#d4af37] font-semibold mt-2 mb-6">
          09 de Janeiro de 2027 Â·
        </p>

        {/* 5. InscriÃ§Ã£o Sagrada (EpÃ­grafe BÃ­blica de Alta-Costura) */}
        <div className="ak-footer-verse-box max-w-xl mx-auto my-4 px-6 py-6 rounded-2xl border border-[#d4af37]/25 bg-[#14110e]/65 backdrop-blur-xl shadow-[0_12px_36px_rgba(0,0,0,0.35)]">
          <blockquote className="m-0">
            <p className="ak-footer-verse-text font-playfair italic text-lg sm:text-xl md:text-2xl leading-relaxed text-[#fff8f0]/95 font-normal">
              &ldquo;Agora permanecem a fÃ©, a esperanÃ§a e o amor. O maior deles, porÃ©m, Ã© o amor.&rdquo;
            </p>
            <cite className="ak-footer-verse-ref block not-italic font-sans text-[0.7rem] md:text-xs tracking-[0.26em] uppercase text-[#d4af37] font-bold mt-3">
              1 CorÃ­ntios 13:13
            </cite>
          </blockquote>
        </div>

        {/* 6. Palavra de Afeto dos Noivos */}
        <p className="ak-footer-farewell font-sans text-sm md:text-base text-[#fff8f0]/85 font-light tracking-wide mt-4 mb-6 max-w-md leading-relaxed">
          A vossa presenÃ§a Ã© a nossa maior bÃªnÃ§Ã£o e alegria. Esperamos por ti para celebrarmos juntos o inÃ­cio da nossa histÃ³ria de vida.
        </p>

        {/* 7. Micro-NavegaÃ§Ã£o Cerimonial (Atelier Index) */}
        <nav className="ak-footer-nav w-full max-w-lg mx-auto my-4" aria-label="NavegaÃ§Ã£o rÃ¡pida do convite">
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[10px] sm:text-[11px] tracking-[0.2em] uppercase font-sans font-medium text-[#ffe9b8]/80">
            <li><a href="#convite" className="hover:text-[#d4af37] transition-colors">InÃ­cio</a></li>
            <li className="text-[#d4af37]/40" aria-hidden="true">Â·</li>
            <li><a href="#noivos" className="hover:text-[#d4af37] transition-colors">Os Noivos</a></li>
            <li className="text-[#d4af37]/40" aria-hidden="true">Â·</li>
            <li><a href="#cerimonias" className="hover:text-[#d4af37] transition-colors">Programa</a></li>
            <li className="text-[#d4af37]/40" aria-hidden="true">Â·</li>
            <li><a href="#localizacao" className="hover:text-[#d4af37] transition-colors">Locais</a></li>
            <li className="text-[#d4af37]/40" aria-hidden="true">Â·</li>
            <li><a href="#presentes" className="hover:text-[#d4af37] transition-colors">Presentes</a></li>
            <li className="text-[#d4af37]/40" aria-hidden="true">Â·</li>
            <li><a href="#rsvp" className="hover:text-[#d4af37] transition-colors">RSVP</a></li>
          </ul>
        </nav>

        {/* 8. CÃ¡psula Minimalista da Trilha Sonora Oficial */}
        <aside
          className="ak-footer-soundtrack my-5 flex items-center gap-3.5 px-5 py-2.5 rounded-full border border-[#d4af37]/35 bg-gradient-to-r from-[#14110e]/90 via-[#1f1a14]/85 to-[#14110e]/90 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.4)] max-w-sm sm:max-w-md mx-auto"
          aria-label="Trilha sonora oficial de casamento"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#d4af37]/50 bg-gradient-to-br from-[#d4af37]/20 to-transparent text-[#d4af37]">
            <HauteCoutureMusicDiscIcon className="w-4 h-4 text-[#d4af37]" />
          </div>
          <div className="text-left min-w-0 flex-1">
            <p className="text-[8.5px] uppercase tracking-[0.24em] text-[#d4af37] font-semibold">
              Trilha Sonora Oficial
            </p>
            <p className="text-xs sm:text-[13px] text-[#fff8f0] font-medium truncate mt-0.5">
              Say You Won&apos;t Let Go <span className="text-[#d4af37]/70">Â·</span> <span className="text-[#fff8f0]/80">James Arthur</span>
            </p>
          </div>
        </aside>


        {/* Divisor HerÃ¡ldico de Alta Costura */}
        <div
          className="flex items-center justify-center gap-4 w-full my-6 max-w-xs mx-auto"
          style={{ margin: "24px auto" }}
          aria-hidden="true"
        >
          <div className="h-[1px] w-16 sm:w-24 bg-gradient-to-r from-transparent to-[#d4af37]/50" />
          <span className="text-xs text-[#d4af37] drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]">â–</span>
          <div className="h-[1px] w-16 sm:w-24 bg-gradient-to-l from-transparent to-[#d4af37]/50" />
        </div>

        {/* 10. Assinatura Oficial da Maison HAXR Signature */}
        <div className="ak-footer-maison w-full max-w-sm flex flex-col items-center text-center">
          <p
            className="ak-footer-maison-label text-[9.5px] uppercase font-sans font-medium text-[#d4af37]/80 mb-2"
            style={{ letterSpacing: "0.34em" }}
          >
           Design & Assinatura Digital
          </p>

          <div className="ak-signature-logo-wrap my-1 transition-transform duration-300 hover:scale-[1.02] flex items-center justify-center">
            <Image
              src="/images/haxr-logo-horizontal-white.png"
              alt="HAXR Signature"
              width={180}
              height={44}
              priority
              unoptimized
              className="h-[36px] md:h-[42px] w-auto object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]"
            />
          </div>

          <p
            className="ak-footer-maison-sub text-[13px] md:text-[14px] italic text-[#e6d5b8] mt-1"
            style={{
              fontFamily: "var(--font-playfair-display), var(--font-display), 'Playfair Display', Georgia, serif",
              letterSpacing: "0.14em",
            }}
          >
            Alta-Costura Digital Â· Private Wedding Editions
          </p>
        </div>

        {/* 11. Copyright Oficial */}
        <p
          className="ak-footer-copyright text-[9.5px] tracking-wider text-[#ffe9b8]/50 mt-6 font-sans"
          style={{ marginTop: "24px" }}
        >
          Â© 2027 Alexandrina Mitilane &amp; Kenneth Novele Â· Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
