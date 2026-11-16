"use client";

import Image from "next/image";

export function AlexandrinaKennethFooter() {
  return (
    <footer className="premium-footer ak-footer relative overflow-hidden" aria-label="Rodapé do convite">
      {/* Top golden hairline divider com degradé luminoso */}
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
        {/* 1. Monograma Oficial de Alta Joalharia dos Noivos (AK em Ouro Nobre) */}
        <div className="ak-footer-monogram-wrap mb-5">
          <Image
            src="/images/alexandrina-kenneth/monograma.png"
            alt="Monograma Oficial de Alexandrina & Kenneth"
            width={240}
            height={240}
            priority
            unoptimized
            className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 object-contain drop-shadow-[0_10px_28px_rgba(212,175,55,0.4)] transition-transform duration-500 hover:scale-105"
          />
        </div>

        {/* 2. Eyebrow Cerimonial */}
        <p className="ak-footer-eyebrow font-sans text-[0.68rem] md:text-xs tracking-[0.32em] uppercase text-[#d4af37]/90 font-semibold mb-2">
          Celebração Matrimonial
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

        {/* 4. Data Oficial com Espaçamento Editorial */}
        <p className="ak-footer-date-badge font-sans text-[0.75rem] md:text-xs tracking-[0.28em] uppercase text-[#d4af37] font-semibold mt-2 mb-6">
          09 de Janeiro de 2027
        </p>

        {/* 5. Inscrição Sagrada (Epígrafe Bíblica de Alta-Costura) */}
        <div className="ak-footer-verse-box max-w-xl mx-auto my-4 px-6 py-6 rounded-2xl border border-[#d4af37]/25 bg-[#14110e]/65 backdrop-blur-xl shadow-[0_12px_36px_rgba(0,0,0,0.35)]">
          <blockquote className="m-0">
            <p className="ak-footer-verse-text font-playfair italic text-lg sm:text-xl md:text-2xl leading-relaxed text-[#fff8f0]/95 font-normal">
              &ldquo;Agora permanecem a fé, a esperança e o amor. O maior deles, porém, é o amor.&rdquo;
            </p>
            <cite className="ak-footer-verse-ref block not-italic font-sans text-[0.7rem] md:text-xs tracking-[0.26em] uppercase text-[#d4af37] font-bold mt-3">
              1 Coríntios 13:13
            </cite>
          </blockquote>
        </div>

        {/* 6. Palavra de Afecto dos Noivos */}
        <p className="ak-footer-farewell font-sans text-sm md:text-base text-[#fff8f0]/85 font-light tracking-wide mt-4 mb-6 max-w-md leading-relaxed">
          A vossa presença é a nossa maior bênção e alegria. Esperamos por ti para celebrarmos juntos o início da nossa história de vida.
        </p>

        {/* Divisor Heráldico de Alta Costura */}
        <div
          className="flex items-center justify-center gap-4 w-full my-6 max-w-xs mx-auto"
          style={{ margin: "24px auto" }}
          aria-hidden="true"
        >
          <div className="h-[1px] w-16 sm:w-24 bg-gradient-to-r from-transparent to-[#d4af37]/50" />
          <span className="text-xs text-[#d4af37] drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]">❖</span>
          <div className="h-[1px] w-16 sm:w-24 bg-gradient-to-l from-transparent to-[#d4af37]/50" />
        </div>

        {/* 7. Assinatura Oficial da Maison HAXR Signature */}
        <div className="ak-footer-maison w-full max-w-sm flex flex-col items-center text-center">
          <p
            className="ak-footer-maison-label text-[9.5px] uppercase font-sans font-medium text-[#d4af37]/80 mb-2"
            style={{ letterSpacing: "0.34em" }}
          >
           Design &amp; Assinatura Digital
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
            Alta-Costura Digital · Private Wedding Editions
          </p>
        </div>

        {/* 8. Copyright Oficial */}
        <p
          className="ak-footer-copyright text-[9.5px] tracking-wider text-[#ffe9b8]/50 mt-6 font-sans"
          style={{ marginTop: "24px" }}
        >
          © 2027 Alexandrina Mitilane &amp; Kenneth Novele · Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
