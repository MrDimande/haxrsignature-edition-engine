"use client";


interface AlexandrinaKennethHeroProps {
  onBackToCover?: () => void;
  showBackToCover?: boolean;
}

function HeroExitTransition() {
  return (
    <div className="ak-hero-exit" aria-hidden="true">
      <svg
        className="ak-hero-exit__curve"
        viewBox="0 0 1440 72"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path fill="currentColor" d="M0,18 Q720,72 1440,18 L1440,72 L0,72 Z" />
      </svg>
    </div>
  );
}

export function AlexandrinaKennethHero({
  onBackToCover,
  showBackToCover = true,
}: AlexandrinaKennethHeroProps) {
  return (
    <>
      {onBackToCover && showBackToCover && (
        <button
          type="button"
          className="ak-back-to-cover cursor-pointer"
          onClick={onBackToCover}
          aria-label="Voltar Ã  capa do convite"
        >
          <svg
            className="ak-back-to-cover__icon"
            width="8"
            height="8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          <span className="ak-back-to-cover__text">Voltar Ã  capa</span>
        </button>
      )}

      {/* SEGUNDA CAPA / INTRO */}
      <section
        id="intro"
        className="hero hero-intro"
        aria-labelledby="intro-heading"
      >
        <div className="hero-intro__bg" aria-hidden="true">
          <picture>
            <source
              media="(orientation: landscape) and (min-width: 560px)"
              srcSet="/images/alexandrina-kenneth/segunda-capa.jpg"
            />
            <source
              media="(orientation: portrait) and (min-width: 768px)"
              srcSet="/images/alexandrina-kenneth/segunda-capa.jpg"
            />
            <img
              src="/images/alexandrina-kenneth/segunda-capa.jpg"
              alt="Alexandrina Mitilane e Kenneth Novele"
              className="hero-intro__bg-img"
              loading="eager"
              fetchPriority="high"
            />
          </picture>
          <div className="hero-intro__overlay" />
        </div>
        <div className="hero-intro__film" aria-hidden="true" />
        <div className="hero-intro__vignette" aria-hidden="true" />
        <div className="hero-content hero-content--intro">
          <div className="hero-intro__copy">
            <p className="eyebrow">O casamento de</p>
            <h1 className="names names--display names--lockup" id="intro-heading">
              <span className="names__line">Alexandrina Mitilane</span>
              <span className="names__amp">&amp;</span>
              <span className="names__line">Kenneth Novele</span>
            </h1>
            <p className="date">09&nbsp;â€¢&nbsp;01&nbsp;â€¢&nbsp;2027</p>
          </div>
          <a
            href="#convite"
            className="hero-intro__scroll cursor-pointer"
            aria-label="Descer para continuar a ler o convite"
          >
            <span className="hero-intro__scroll-chevrons" aria-hidden="true">
              <svg
                className="hero-intro__chev"
                width="22"
                height="14"
                viewBox="0 0 20 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                focusable="false"
              >
                <path
                  d="M1.5 2.5L10 9.5 18.5 2.5"
                  stroke="currentColor"
                  strokeWidth="1.35"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <svg
                className="hero-intro__chev hero-intro__chev--2"
                width="22"
                height="14"
                viewBox="0 0 20 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                focusable="false"
              >
                <path
                  d="M1.5 2.5L10 9.5 18.5 2.5"
                  stroke="currentColor"
                  strokeWidth="1.35"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </a>
        </div>
        <HeroExitTransition />
      </section>
    </>
  );
}

