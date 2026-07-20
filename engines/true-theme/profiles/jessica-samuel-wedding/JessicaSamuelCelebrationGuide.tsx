"use client";

import Image from "next/image";
import {
  Camera,
  Church,
  GlassWater,
  HandHeart,
  MapPin,
  Navigation,
  Phone,
  Scale,
  type LucideIcon,
} from "lucide-react";
import { motion } from "motion/react";
import {
  WEDDING_ASSETS,
  WEDDING_CHARITY_REQUEST,
  WEDDING_ITINERARY,
} from "@lib/jessica-samuel-wedding/event-details";
import {
  WEDDING_GIFT_GUIDANCE,
  shouldShowWeddingGiftGuideCard,
} from "@lib/jessica-samuel-wedding/gifts/catalog";
import { jsType } from "./jessica-samuel-typography";
import { JS_SURFACES } from "./jessica-samuel-surfaces";
import { JessicaSamuelEditorialHeading } from "./jessica-samuel-editorial-heading";
import { jsReveal, jsStagger, jsViewport } from "./jessica-samuel-motion";
import { CardMediaParallax } from "./CardMediaParallax";

const ITINERARY_ICONS: Record<
  (typeof WEDDING_ITINERARY)[number]["id"],
  LucideIcon
> = {
  "cerimonia-religiosa": Church,
  "cerimonia-civil": Scale,
  "sessao-fotografias": Camera,
  "copo-de-agua": GlassWater,
};

function TimelineGestureCallout() {
  const charity = WEDDING_CHARITY_REQUEST;

  return (
    <div className="js-celeb-guide__timeline-gesture" role="note">
      <p className="js-celeb-guide__timeline-gesture-kicker">
        <HandHeart
          className="js-celeb-guide__timeline-gesture-icon"
          size={10}
          strokeWidth={1.35}
          aria-hidden
        />
        <span>{charity.optionalLabel}</span>
      </p>
      <p className="js-celeb-guide__timeline-gesture-copy">
        {charity.timelineSummary}
      </p>
      <p className="js-celeb-guide__timeline-gesture-ref">
        {charity.verseReference}
      </p>
    </div>
  );
}

function ItineraryTimeline({ tone = "panel" }: { tone?: "panel" | "wine" }) {
  const isWine = tone === "wine";

  return (
    <ol
      className={`js-celeb-guide__timeline${
        isWine
          ? " js-celeb-guide__timeline--on-wine js-celeb-guide__timeline--editorial"
          : ""
      }`}
    >
      {WEDDING_ITINERARY.map((moment, index) => {
        const isLast = index === WEDDING_ITINERARY.length - 1;
        const lines =
          moment.locationLines ??
          (moment.location ? [moment.location] : null);
        const Icon = ITINERARY_ICONS[moment.id];

        return (
          <li
            key={moment.id}
            className={`js-celeb-guide__timeline-item${
              isLast ? " is-last" : ""
            }`}
          >
            <div className="js-celeb-guide__timeline-rail" aria-hidden>
              {isWine ? (
                <span className="js-celeb-guide__timeline-icon">
                  <Icon strokeWidth={1.25} size={15} />
                </span>
              ) : (
                <span className="js-celeb-guide__timeline-dot" />
              )}
              {!isLast ? (
                <span className="js-celeb-guide__timeline-line" />
              ) : null}
            </div>
            <div className="js-celeb-guide__timeline-body">
              <p className="js-celeb-guide__timeline-time">
                {moment.timeLabel}
              </p>
              <h3 className="js-celeb-guide__timeline-title">{moment.title}</h3>
              {lines ? (
                <div className="js-celeb-guide__timeline-place-block">
                  {isWine ? (
                    <MapPin
                      className="js-celeb-guide__timeline-pin"
                      size={12}
                      strokeWidth={1.4}
                      aria-hidden
                    />
                  ) : null}
                  <div>
                    {lines.map((line) => (
                      <p key={line} className="js-celeb-guide__timeline-place">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              ) : null}
              {isWine && moment.id === "cerimonia-religiosa" ? (
                <TimelineGestureCallout />
              ) : null}
              {moment.note ? (
                <p className="js-celeb-guide__timeline-note">{moment.note}</p>
              ) : null}
              {moment.mapsUrl ? (
                <a
                  href={moment.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={
                    isWine
                      ? "js-wedding-cover__cta js-celeb-guide__timeline-maps-cta"
                      : "js-celeb-guide__maps-btn"
                  }
                >
                  {isWine ? (
                    <>
                      <Navigation size={11} strokeWidth={1.5} aria-hidden />
                      <span className="js-wedding-cover__cta-label">
                        Abrir no Maps
                      </span>
                    </>
                  ) : (
                    "Ver localização"
                  )}
                </a>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function ItineraryInlineCard() {
  return (
    <article
      className="js-celeb-guide__card js-celeb-guide__card--wine js-celeb-guide__card--static js-celeb-guide__card--has-media"
      aria-labelledby="js-itinerary-card-title"
    >
      <span className="js-celeb-guide__card-shine" aria-hidden />
      <span className="js-celeb-guide__card-hairline" aria-hidden />

      <CardMediaParallax
        className="js-celeb-guide__card-media"
        amplitude={6}
      >
        <Image
          src={WEDDING_ASSETS.coverImage}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 48vw"
          className="js-celeb-guide__card-img js-celeb-guide__card-img--wine"
        />
        <span className="js-celeb-guide__card-veil js-celeb-guide__card-veil--wine" />
      </CardMediaParallax>

      <div className="js-celeb-guide__card-body js-celeb-guide__card-body--full">
        <p className="js-celeb-guide__card-eyebrow">O nosso dia</p>
        <h3 className="js-celeb-guide__card-title" id="js-itinerary-card-title">
          Cada momento, no tempo certo.
        </h3>
        <span className="js-celeb-guide__card-rule" aria-hidden />
        <p className="js-celeb-guide__card-desc">
          Um percurso pensado para celebrar com calma — da fé ao brinde.
        </p>
        <ItineraryTimeline tone="wine" />
      </div>
    </article>
  );
}

function GiftsInlineCard() {
  const guidance = WEDDING_GIFT_GUIDANCE;
  const hasStoreMaps = Boolean(guidance.storeMapsUrl);
  const phoneHref = `tel:+${guidance.storePhoneTel}`;

  return (
    <article
      className="js-celeb-guide__card js-celeb-guide__card--ivory js-celeb-guide__card--static js-celeb-guide__card--has-media"
      aria-labelledby="js-gifts-card-title"
    >
      <span className="js-celeb-guide__card-shine" aria-hidden />
      <span className="js-celeb-guide__card-hairline" aria-hidden />

      <CardMediaParallax
        className="js-celeb-guide__card-media"
        amplitude={6}
      >
        <Image
          src={WEDDING_ASSETS.coupleImage}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 48vw"
          className="js-celeb-guide__card-img"
        />
        <span className="js-celeb-guide__card-veil" />
      </CardMediaParallax>

      <div className="js-celeb-guide__card-body js-celeb-guide__card-body--full">
        <p className="js-celeb-guide__card-eyebrow">Um gesto de carinho</p>
        <h3 className="js-celeb-guide__card-title" id="js-gifts-card-title">
          Para o nosso novo capítulo.
        </h3>
        <span className="js-celeb-guide__card-rule" aria-hidden />
        <p className="js-celeb-guide__card-desc">
          A sua presença é o nosso maior presente. Esta informação orienta quem
          desejar presentear-nos.
        </p>

        <div className="js-celeb-guide__gift-editorial">
          <p className="js-celeb-guide__gift-editorial-label">
            {guidance.consultLabel}
          </p>
          <p className="js-celeb-guide__gift-editorial-store">
            {guidance.storeName}
          </p>
          <p className="js-celeb-guide__gift-editorial-address">
            {guidance.storeAddress}
          </p>
          <a
            href={phoneHref}
            className="js-celeb-guide__gift-editorial-phone"
          >
            {guidance.storePhoneDisplay}
          </a>
          <div className="js-celeb-guide__gift-editorial-registry">
            <p className="js-celeb-guide__gift-editorial-registry-name">
              {guidance.registry.listName}
            </p>
            <p className="js-celeb-guide__gift-editorial-registry-quotation">
              {guidance.registry.quotationLine}
            </p>
            <p className="js-celeb-guide__gift-editorial-registry-issued">
              {guidance.registry.issuedLine}
            </p>
          </div>
          <p className="js-celeb-guide__gift-editorial-note">
            {guidance.consultNote}
          </p>

          <div className="js-celeb-guide__gift-editorial-actions">
            {hasStoreMaps ? (
              <a
                href={guidance.storeMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="js-celeb-guide__maps-btn"
              >
                <Navigation size={11} strokeWidth={1.5} aria-hidden />
                <span>{guidance.mapsCta}</span>
              </a>
            ) : null}
            <a href={phoneHref} className="js-celeb-guide__maps-btn">
              <Phone size={11} strokeWidth={1.5} aria-hidden />
              <span>{guidance.phoneCta}</span>
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

/** Guia da Celebração — itinerário e presentes. */
export function JessicaSamuelCelebrationGuideSection() {
  const showGiftCard = shouldShowWeddingGiftGuideCard();

  const gridClass = [
    "js-celeb-guide__grid",
    showGiftCard ? "js-celeb-guide__grid--duo" : "js-celeb-guide__grid--single",
  ].join(" ");

  return (
    <motion.section
      id="guia-celebracao"
      initial="hidden"
      whileInView="visible"
      viewport={jsViewport}
      variants={jsStagger}
      className="js-celeb-guide js-wedding-couple-section relative z-[1] py-10 sm:py-14 md:py-20"
      aria-label="Guia da Celebração"
    >
      <motion.div variants={jsReveal} className="js-wedding-couple-section__shell">
        <header className="js-celeb-guide__header text-center mb-10 md:mb-14">
          <JessicaSamuelEditorialHeading
            eyebrow="Guia da Celebração"
            title="Tudo o que precisa para viver este dia connosco."
          />
          <p
            className={`${jsType.body} max-w-2xl mx-auto mt-5`}
            style={{ color: JS_SURFACES.inkSoft }}
          >
            Horários, percursos e orientação de presentes — tudo no mesmo olhar.
          </p>
        </header>

        <div className={gridClass}>
          <ItineraryInlineCard />
          {showGiftCard ? <GiftsInlineCard /> : null}
        </div>
      </motion.div>
    </motion.section>
  );
}
