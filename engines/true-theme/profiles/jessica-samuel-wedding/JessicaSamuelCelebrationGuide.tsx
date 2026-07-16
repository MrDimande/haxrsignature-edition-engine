"use client";

import React, {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  WEDDING_ASSETS,
  WEDDING_ITINERARY,
  WEDDING_ITINERARY_SCHEDULE_CONFIRMED,
} from "@lib/jessica-samuel-wedding/event-details";
import {
  WEDDING_GIFT_GUIDANCE,
  shouldShowWeddingGiftGuideCard,
} from "@lib/jessica-samuel-wedding/gifts/catalog";
import { jsType } from "./jessica-samuel-typography";
import { JS_SURFACES } from "./jessica-samuel-surfaces";
import { jsReveal, jsStagger, jsViewport } from "./jessica-samuel-motion";

type PanelId = "itinerary" | "gifts";

const EASE = [0.22, 1, 0.36, 1] as const;

function ArrowMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="12"
      viewBox="0 0 18 12"
      fill="none"
      aria-hidden
    >
      <path
        d="M0.75 6H16.25M16.25 6L11.25 1M16.25 6L11.25 11"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [locked]);
}

function useFocusTrap(
  active: boolean,
  containerRef: React.RefObject<HTMLElement | null>
) {
  useEffect(() => {
    if (!active) return;
    const root = containerRef.current;
    if (!root) return;

    const focusable = () =>
      Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);

    const nodes = focusable();
    const first = nodes[0];
    first?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const list = focusable();
      if (list.length === 0) return;
      const firstEl = list[0];
      const lastEl = list[list.length - 1];
      if (event.shiftKey && document.activeElement === firstEl) {
        event.preventDefault();
        lastEl.focus();
      } else if (!event.shiftKey && document.activeElement === lastEl) {
        event.preventDefault();
        firstEl.focus();
      }
    };

    root.addEventListener("keydown", onKeyDown);
    return () => root.removeEventListener("keydown", onKeyDown);
  }, [active, containerRef]);
}

function GuideCard({
  id,
  panelId,
  eyebrow,
  title,
  description,
  cta,
  variant,
  expanded,
  controlsId,
  onOpen,
  reduceMotion,
  backgroundSrc,
}: {
  id: string;
  panelId: PanelId;
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  variant: "wine" | "ivory";
  expanded: boolean;
  controlsId: string;
  onOpen: () => void;
  reduceMotion: boolean | null;
  backgroundSrc?: string;
}) {
  return (
    <button
      type="button"
      id={id}
      className={`js-celeb-guide__card js-celeb-guide__card--${variant}`}
      data-panel={panelId}
      aria-expanded={expanded}
      aria-controls={controlsId}
      onClick={onOpen}
    >
      <span className="js-celeb-guide__card-shine" aria-hidden />
      <span className="js-celeb-guide__card-hairline" aria-hidden />

      {backgroundSrc ? (
        <span className="js-celeb-guide__card-media" aria-hidden>
          <Image
            src={backgroundSrc}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 48vw"
            className="js-celeb-guide__card-img"
          />
          <span className="js-celeb-guide__card-veil" />
        </span>
      ) : null}

      <span className="js-celeb-guide__card-body">
        <span className="js-celeb-guide__card-eyebrow">{eyebrow}</span>
        <span className="js-celeb-guide__card-title">{title}</span>
        <span className="js-celeb-guide__card-rule" aria-hidden />
        <span className="js-celeb-guide__card-desc">{description}</span>
        <span className="js-celeb-guide__card-cta">
          <span>{cta}</span>
          <ArrowMark
            className={
              reduceMotion ? undefined : "js-celeb-guide__card-arrow"
            }
          />
        </span>
      </span>
    </button>
  );
}

function EditorialPanel({
  open,
  panelId,
  labelledBy,
  onClose,
  triggerRef,
  children,
  footerLabel,
}: {
  open: boolean;
  panelId: string;
  labelledBy: string;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
  footerLabel: string;
}) {
  const reduceMotion = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useBodyScrollLock(open);
  useFocusTrap(open, dialogRef);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const previous = triggerRef.current;
    return () => {
      previous?.focus();
    };
  }, [open, triggerRef]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="js-celeb-guide__overlay"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.35, ease: EASE }}
        >
          <button
            type="button"
            className="js-celeb-guide__backdrop"
            aria-label="Fechar painel"
            onClick={onClose}
          />
          <motion.div
            ref={dialogRef}
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            className="js-celeb-guide__dialog"
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 12 }}
            transition={{ duration: reduceMotion ? 0 : 0.42, ease: EASE }}
          >
            <div className="js-celeb-guide__dialog-chrome">
              <button
                ref={closeRef}
                type="button"
                className="js-celeb-guide__close"
                onClick={onClose}
              >
                Fechar
              </button>
            </div>

            <div className="js-celeb-guide__dialog-scroll" data-lenis-prevent>
              <div className="js-celeb-guide__dialog-inner">
                {children}
                <div className="js-celeb-guide__dialog-footer">
                  <button
                    type="button"
                    className="js-celeb-guide__footer-btn"
                    onClick={onClose}
                  >
                    {footerLabel}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function ItineraryTimeline() {
  return (
    <ol className="js-celeb-guide__timeline">
      {WEDDING_ITINERARY.map((moment, index) => {
        const isLast = index === WEDDING_ITINERARY.length - 1;
        const lines =
          moment.locationLines ??
          (moment.location ? [moment.location] : null);

        return (
          <li
            key={moment.id}
            className={`js-celeb-guide__timeline-item${
              isLast ? " is-last" : ""
            }`}
          >
            <div className="js-celeb-guide__timeline-rail" aria-hidden>
              <span className="js-celeb-guide__timeline-dot" />
              {!isLast ? (
                <span className="js-celeb-guide__timeline-line" />
              ) : null}
            </div>
            <div className="js-celeb-guide__timeline-body">
              <p className="js-celeb-guide__timeline-time">
                {moment.timeLabel}
              </p>
              <h3 className="js-celeb-guide__timeline-title">{moment.title}</h3>
              {lines
                ? lines.map((line) => (
                    <p key={line} className="js-celeb-guide__timeline-place">
                      {line}
                    </p>
                  ))
                : null}
              {moment.note ? (
                <p className="js-celeb-guide__timeline-note">{moment.note}</p>
              ) : null}
              {moment.mapsUrl ? (
                <a
                  href={moment.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="js-celeb-guide__maps-btn"
                >
                  Ver localização
                </a>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function GiftsPanelBody() {
  const guidance = WEDDING_GIFT_GUIDANCE;
  const hasStoreMaps = Boolean(guidance.storeMapsUrl);

  return (
    <div className="js-celeb-guide__gift-guidance">
      <p className="js-celeb-guide__gift-consult-label">
        {guidance.consultLabel}
      </p>
      <p className="js-celeb-guide__gift-store">{guidance.storeName}</p>
      <p className="js-celeb-guide__gift-registry">{guidance.registryNameNote}</p>
      <p className="js-celeb-guide__gift-note">{guidance.consultNote}</p>
      <p className="js-celeb-guide__gift-note">{guidance.storeNote}</p>
      {hasStoreMaps ? (
        <a
          href={guidance.storeMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="js-celeb-guide__maps-btn"
        >
          {guidance.mapsCta}
        </a>
      ) : null}
    </div>
  );
}

/** Guia da Celebração — cartões editoriais + painéis acessíveis. */
export function JessicaSamuelCelebrationGuideSection() {
  const reduceMotion = useReducedMotion();
  const baseId = useId();
  const itineraryPanelId = `${baseId}-itinerary-panel`;
  const giftsPanelId = `${baseId}-gifts-panel`;
  const itineraryTitleId = `${baseId}-itinerary-title`;
  const giftsTitleId = `${baseId}-gifts-title`;
  const itineraryTriggerId = `${baseId}-itinerary-trigger`;
  const giftsTriggerId = `${baseId}-gifts-trigger`;

  const [openPanel, setOpenPanel] = useState<PanelId | null>(null);
  const itineraryTriggerRef = useRef<HTMLElement | null>(null);
  const giftsTriggerRef = useRef<HTMLElement | null>(null);
  const showGiftCard = shouldShowWeddingGiftGuideCard();

  const openItinerary = useCallback(() => {
    itineraryTriggerRef.current = document.getElementById(
      itineraryTriggerId
    );
    setOpenPanel("itinerary");
  }, [itineraryTriggerId]);

  const openGifts = useCallback(() => {
    giftsTriggerRef.current = document.getElementById(giftsTriggerId);
    setOpenPanel("gifts");
  }, [giftsTriggerId]);

  const closePanel = useCallback(() => setOpenPanel(null), []);

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
          <p className="js-celeb-guide__section-eyebrow">Guia da Celebração</p>
          <h2 className="js-celeb-guide__section-title">
            Tudo o que precisa para viver este dia connosco.
          </h2>
          <span className="js-celeb-guide__section-rule" aria-hidden />
          <p
            className={`${jsType.body} max-w-2xl mx-auto mt-5`}
            style={{ color: JS_SURFACES.inkSoft }}
          >
            Consulte os momentos da celebração e, se desejar, conheça as
            sugestões preparadas pelos noivos.
          </p>
        </header>

        {!WEDDING_ITINERARY_SCHEDULE_CONFIRMED &&
        process.env.NODE_ENV !== "production" ? (
          <p className="js-celeb-guide__dev-note" role="note">
            Dev: horário da cerimónia religiosa ainda provisório (
            {WEDDING_ITINERARY[0].timeLabel}) — aguarda confirmação 08h00 vs
            10h30.
          </p>
        ) : null}

        <div className={gridClass}>
          <GuideCard
            id={itineraryTriggerId}
            panelId="itinerary"
            eyebrow="O nosso dia"
            title="Cada momento, no tempo certo."
            description="Acompanhe os horários, locais e percursos preparados para este dia especial."
            cta="Ver itinerário"
            variant="wine"
            expanded={openPanel === "itinerary"}
            controlsId={itineraryPanelId}
            onOpen={openItinerary}
            reduceMotion={reduceMotion}
          />

          {showGiftCard ? (
            <GuideCard
              id={giftsTriggerId}
              panelId="gifts"
              eyebrow="Um gesto de carinho"
              title="Para o nosso novo capítulo."
              description="A sua presença é o nosso maior presente. Para quem desejar, reunimos algumas sugestões especiais."
              cta="Ver lista de presentes"
              variant="ivory"
              expanded={openPanel === "gifts"}
              controlsId={giftsPanelId}
              onOpen={openGifts}
              reduceMotion={reduceMotion}
              backgroundSrc={WEDDING_ASSETS.coupleImage}
            />
          ) : null}
        </div>
      </motion.div>

      <EditorialPanel
        open={openPanel === "itinerary"}
        panelId={itineraryPanelId}
        labelledBy={itineraryTitleId}
        onClose={closePanel}
        triggerRef={itineraryTriggerRef}
        footerLabel="Voltar ao convite"
      >
        <p className="js-celeb-guide__panel-eyebrow">Itinerário</p>
        <h2 id={itineraryTitleId} className="js-celeb-guide__panel-title">
          O nosso dia
        </h2>
        <p className="js-celeb-guide__panel-lead">
          Preparamos cada momento para celebrarmos juntos.
        </p>
        <ItineraryTimeline />
      </EditorialPanel>

      <EditorialPanel
        open={openPanel === "gifts"}
        panelId={giftsPanelId}
        labelledBy={giftsTitleId}
        onClose={closePanel}
        triggerRef={giftsTriggerRef}
        footerLabel="Continuar a celebração"
      >
        <p className="js-celeb-guide__panel-eyebrow">Lista de presentes</p>
        <h2 id={giftsTitleId} className="js-celeb-guide__panel-title">
          Um gesto de carinho
        </h2>
        <p className="js-celeb-guide__panel-lead">
          A sua presença é o nosso maior presente. Esta informação serve apenas
          para orientar quem desejar presentear-nos.
        </p>
        <GiftsPanelBody />
      </EditorialPanel>
    </motion.section>
  );
}
