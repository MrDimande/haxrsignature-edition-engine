"use client";

import {
    STAN_DRESS_CODE,
    STAN_EVENT,
    STAN_VENUE,
    buildStanGoogleCalendarUrl,
    downloadStanIcsFile,
    formatStanDisplayDate,
    getStanVenueDisplayName,
    isStanDressCodeConfirmed,
    isStanVenueConfirmed,
} from "@lib/stan/event-details";
import { CalendarPlus, Download, MapPin } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import React, { useState } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

function EditorialToast({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  React.useEffect(() => {
    const t = window.setTimeout(onClose, 2800);
    return () => window.clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      role="status"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 border border-[#C9A86A]/40 bg-[#0A1628]/95 px-5 py-3 font-body text-xs tracking-wide text-[#F7F4EF] shadow-xl backdrop-blur-md"
    >
      {message}
    </motion.div>
  );
}

/**
 * Matchday Details — Ficha da Celebração
 * Estética de publicação oficial de clube (Real Madrid / grandes clubes):
 * poster de matchday, tipografia monumental, barra de fixture.
 * Isolado ao perfil stan-real-madrid.
 */
export function StanMatchdaySection() {
  const reduceMotion = useReducedMotion();
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const googleUrl = buildStanGoogleCalendarUrl();
  const venueConfirmed = isStanVenueConfirmed();
  const dressConfirmed = isStanDressCodeConfirmed();

  return (
    <section
      id="matchday"
      aria-labelledby="stan-matchday-title"
      className="relative w-full scroll-mt-24 overflow-hidden text-[#F7F4EF] sm:scroll-mt-28"
      style={{ backgroundColor: "#07101C" }}
    >
      {/* Fundo estádio — drift lento (micro Ken Burns) */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute inset-[-4%]"
          animate={
            reduceMotion
              ? undefined
              : { scale: [1.04, 1.08, 1.04], x: [0, 6, 0] }
          }
          transition={
            reduceMotion
              ? undefined
              : { duration: 28, repeat: Infinity, ease: "easeInOut" }
          }
        >
          <picture>
            <source
              media="(max-width: 639px)"
              srcSet="/images/stan/hero/stadium-bg-mobile.png"
            />
            <Image
              src="/images/stan/hero/stadium-bg-desktop.png"
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-center opacity-[0.42]"
              aria-hidden
            />
          </picture>
        </motion.div>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 70% 50% at 50% 20%, rgba(247,244,239,0.14), transparent 55%),
              linear-gradient(180deg, rgba(7,16,28,0.82) 0%, rgba(7,16,28,0.55) 40%, rgba(7,16,28,0.94) 100%)
            `,
          }}
        />
        <motion.div
          className="pointer-events-none absolute inset-0 mix-blend-screen"
          animate={
            reduceMotion ? undefined : { opacity: [0.28, 0.42, 0.28] }
          }
          transition={
            reduceMotion
              ? undefined
              : { duration: 7.5, repeat: Infinity, ease: "easeInOut" }
          }
          style={reduceMotion ? { opacity: 0.35 } : undefined}
        >
          <Image
            src="/images/stan/hero/lighting.png"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-top"
            aria-hidden
          />
        </motion.div>
      </div>

      {/* Linhas de campo — círculo com pulso dourado subtil */}
      <svg
        className="pointer-events-none absolute inset-0 z-[1] h-full w-full opacity-[0.1]"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <line x1="8" y1="18" x2="92" y2="18" stroke="#E8DCC8" strokeWidth="0.12" />
        <line x1="8" y1="88" x2="92" y2="88" stroke="#E8DCC8" strokeWidth="0.12" />
        <motion.circle
          cx="50"
          cy="50"
          r="12"
          fill="none"
          stroke="#C9A86A"
          strokeWidth="0.1"
          animate={
            reduceMotion
              ? undefined
              : { opacity: [0.55, 1, 0.55], r: [11.5, 12.4, 11.5] }
          }
          transition={
            reduceMotion
              ? undefined
              : { duration: 6.5, repeat: Infinity, ease: "easeInOut" }
          }
        />
      </svg>

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-5 py-20 sm:px-8 sm:py-28">
        {/* Eyebrow de clube */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: -12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: EASE }}
          className="flex items-center gap-3"
        >
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#C9A86A]" aria-hidden />
          <span className="font-body text-[10px] font-semibold uppercase tracking-[0.42em] text-[#C9A86A]">
            Ficha da Celebração
          </span>
          <span className="h-px w-8 bg-gradient-to-l from-transparent to-[#C9A86A]" aria-hidden />
        </motion.div>

        {/* MATCHDAY — tipografia de poster oficial */}
        <motion.h2
          id="stan-matchday-title"
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.08, ease: EASE }}
          className="mt-6 font-display text-[clamp(2.75rem,12vw,6.5rem)] font-extrabold uppercase leading-[0.88] tracking-[-0.02em] text-[#F7F4EF]"
          style={{ textShadow: "0 16px 48px rgba(0,0,0,0.45)" }}
        >
          Matchday
        </motion.h2>

        {/* Crest / monogram — entrada + halo dourado em idle */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
          className="relative mt-8"
          aria-hidden
        >
          {!reduceMotion ? (
            <motion.span
              className="pointer-events-none absolute inset-[-28%] rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(201,168,106,0.32) 0%, rgba(201,168,106,0.08) 42%, transparent 70%)",
              }}
              animate={{ opacity: [0.4, 0.85, 0.4], scale: [0.96, 1.06, 0.96] }}
              transition={{
                duration: 4.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ) : null}
          <div className="relative flex h-20 w-20 flex-col items-center justify-center rounded-full border border-[#C9A86A]/50 bg-[#0A1628]/55 shadow-[0_0_40px_rgba(201,168,106,0.15)] backdrop-blur-sm sm:h-24 sm:w-24">
            <span className="font-body text-[9px] font-bold tracking-[0.28em] text-[#C9A86A]">
              S · 5
            </span>
            <span className="mt-0.5 font-display text-2xl font-bold leading-none text-[#F7F4EF] sm:text-3xl">
              5
            </span>
          </div>
        </motion.div>

        {/* Fixture strip — estilo anúncio de jogo */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.85, delay: 0.22, ease: EASE }}
          className="mt-8 w-full max-w-2xl"
        >
          <div className="flex items-center justify-center gap-4 sm:gap-8">
            <div className="flex flex-1 flex-col items-end text-right">
              <span className="font-body text-[9px] font-semibold uppercase tracking-[0.28em] text-[#C9A86A]/80">
                Celebração
              </span>
              <span className="mt-1 font-display text-xl font-semibold uppercase tracking-wide text-[#F7F4EF] sm:text-2xl">
                Stan
              </span>
            </div>

            <motion.div
              className="flex h-12 w-12 shrink-0 items-center justify-center border border-[#C9A86A]/45 bg-[#C9A86A]/10 sm:h-14 sm:w-14"
              animate={
                reduceMotion
                  ? undefined
                  : {
                      borderColor: [
                        "rgba(201,168,106,0.35)",
                        "rgba(201,168,106,0.7)",
                        "rgba(201,168,106,0.35)",
                      ],
                      boxShadow: [
                        "0 0 0 rgba(201,168,106,0)",
                        "0 0 22px rgba(201,168,106,0.22)",
                        "0 0 0 rgba(201,168,106,0)",
                      ],
                    }
              }
              transition={
                reduceMotion
                  ? undefined
                  : { duration: 5.2, repeat: Infinity, ease: "easeInOut" }
              }
            >
              <span className="font-display text-lg font-bold text-[#C9A86A] sm:text-xl">
                VS
              </span>
            </motion.div>

            <div className="flex flex-1 flex-col items-start text-left">
              <span className="font-body text-[9px] font-semibold uppercase tracking-[0.28em] text-[#C9A86A]/80">
                O Quinto Acto
              </span>
              <span className="mt-1 font-display text-xl font-semibold uppercase tracking-wide text-[#F7F4EF] sm:text-2xl">
                5 Anos
              </span>
            </div>
          </div>
        </motion.div>

        <motion.p
          initial={reduceMotion ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="mt-6 max-w-md text-center font-display text-base font-light italic text-[#E8DCC8] sm:text-lg"
        >
          Um pequeno campeão. Um grande dia.
        </motion.p>

        {/* Barra de dados — como posts oficiais (DATE · KO · VENUE) */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.35, ease: EASE }}
          className="mt-12 w-full max-w-3xl border border-[#C9A86A]/30 bg-[#0A1628]/65 backdrop-blur-md"
        >
          <div className="grid grid-cols-1 divide-y divide-[#C9A86A]/20 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="flex flex-col items-center px-5 py-6 text-center sm:py-7">
              <span className="font-body text-[9px] font-bold uppercase tracking-[0.36em] text-[#C9A86A]">
                Data
              </span>
              <time
                dateTime={STAN_EVENT.dateIso}
                className="mt-2.5 font-display text-lg font-semibold uppercase leading-snug text-[#F7F4EF] sm:text-xl"
              >
                {formatStanDisplayDate()}
              </time>
              <span className="mt-1 font-body text-[10px] uppercase tracking-[0.2em] text-[#F7F4EF]/45">
                {new Date(`${STAN_EVENT.dateIso}T12:00:00+02:00`).toLocaleDateString(
                  "pt-PT",
                  { weekday: "long", timeZone: "Africa/Maputo" }
                )}
              </span>
            </div>

            <div className="flex flex-col items-center px-5 py-6 text-center sm:py-7">
              <span className="font-body text-[9px] font-bold uppercase tracking-[0.36em] text-[#C9A86A]">
                Kick-off
              </span>
              <span className="mt-2.5 font-display text-lg font-semibold uppercase text-[#F7F4EF] sm:text-xl">
                {STAN_EVENT.timeLabel}
              </span>
              <span className="mt-1 font-body text-[10px] uppercase tracking-[0.2em] text-[#F7F4EF]/45">
                Africa/Maputo
              </span>
            </div>

            <div className="flex flex-col items-center px-5 py-6 text-center sm:py-7">
              <span className="font-body text-[9px] font-bold uppercase tracking-[0.36em] text-[#C9A86A]">
                Local
              </span>
              <span className="mt-2.5 font-display text-lg font-semibold uppercase leading-snug text-[#F7F4EF] sm:text-xl">
                {venueConfirmed
                  ? getStanVenueDisplayName()
                  : "Maputo"}
              </span>
              <span className="mt-1 font-body text-[10px] uppercase tracking-[0.2em] text-[#F7F4EF]/45">
                {venueConfirmed
                  ? STAN_VENUE.address || "Local confirmado"
                  : "Local a confirmar"}
              </span>
            </div>
          </div>
        </motion.div>

        {dressConfirmed && STAN_DRESS_CODE.label ? (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75, delay: 0.38, ease: EASE }}
            className="mt-8 w-full max-w-md border border-[#C9A86A]/30 bg-[#0A1628]/55 px-5 py-5 text-center backdrop-blur-sm sm:px-7 sm:py-6"
            aria-label="Kit Matchday — dress code"
          >
            <p className="font-body text-[9px] font-bold uppercase tracking-[0.36em] text-[#C9A86A]">
              {STAN_DRESS_CODE.title}
            </p>
            <p className="mt-2.5 font-display text-lg font-light text-[#F7F4EF] sm:text-xl">
              {STAN_DRESS_CODE.lead}
            </p>
            {STAN_DRESS_CODE.palette.length > 0 ? (
              <ul className="mt-5 flex items-center justify-center gap-3 sm:gap-4">
                {STAN_DRESS_CODE.palette.map((swatch) => (
                  <li
                    key={swatch.id}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <span
                      className="h-8 w-8 rounded-full border border-[#F7F4EF]/25 shadow-[0_0_0_1px_rgba(201,168,106,0.25)] sm:h-9 sm:w-9"
                      style={{ backgroundColor: swatch.hex }}
                      title={swatch.name}
                      aria-hidden
                    />
                    <span className="font-body text-[8px] font-semibold uppercase tracking-[0.18em] text-[#F7F4EF]/55">
                      {swatch.name}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            {STAN_DRESS_CODE.note ? (
              <p className="mt-4 font-body text-[10px] font-light leading-relaxed tracking-[0.04em] text-[#E8DCC8]/70">
                {STAN_DRESS_CODE.note}
              </p>
            ) : null}
          </motion.div>
        ) : null}

        {venueConfirmed && STAN_VENUE.mapLinks ? (
          <div className="mt-6 flex w-full max-w-lg flex-col items-center gap-3">
            <p className="flex items-center gap-2 font-body text-[10px] font-semibold uppercase tracking-[0.28em] text-[#C9A86A]">
              <MapPin size={12} aria-hidden />
              Como chegar
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {(
                [
                  { key: "google", label: "Google Maps", href: STAN_VENUE.mapLinks.google },
                  { key: "waze", label: "Waze", href: STAN_VENUE.mapLinks.waze },
                  { key: "apple", label: "Apple Maps", href: STAN_VENUE.mapLinks.apple },
                  { key: "osm", label: "OpenStreetMap", href: STAN_VENUE.mapLinks.osm },
                ] as const
              ).map((link) => (
                <a
                  key={link.key}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center justify-center border border-[#C9A86A]/40 bg-[#0B132B]/55 px-3.5 py-2 font-body text-[10px] font-bold uppercase tracking-[0.18em] text-[#F7F4EF] transition hover:border-[#C9A86A] hover:bg-[#C9A86A]/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A86A]"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        ) : null}

        {/* CTAs — estilo “Get tickets / Add to calendar” de clube */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.75, delay: 0.42, ease: EASE }}
          className="mt-12 flex w-full max-w-xl flex-col items-stretch gap-3 sm:flex-row sm:justify-center"
        >
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setToastMsg("A abrir o Google Calendar…")}
            className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#C9A86A] px-7 py-3.5 font-body text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#07101C] shadow-[0_14px_40px_rgba(201,168,106,0.28)] transition hover:bg-[#D4B87A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F4EF]"
          >
            <CalendarPlus size={16} aria-hidden />
            Adicionar ao calendário
          </a>

          <button
            type="button"
            onClick={() => {
              downloadStanIcsFile();
              setToastMsg("Ficheiro .ICS descarregado!");
            }}
            className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#C9A86A]/45 bg-transparent px-7 py-3.5 font-body text-[11px] font-bold uppercase tracking-[0.22em] text-[#F7F4EF] transition hover:border-[#C9A86A] hover:bg-[#C9A86A]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A86A]"
          >
            <Download size={16} className="text-[#C9A86A]" aria-hidden />
            Descarregar .ICS
          </button>
        </motion.div>

        <p className="mt-10 max-w-sm text-center font-body text-[10px] font-light uppercase tracking-[0.28em] text-[#F7F4EF]/40">
          See you on Matchday
        </p>
      </div>

      <AnimatePresence>
        {toastMsg ? (
          <EditorialToast
            message={toastMsg}
            onClose={() => setToastMsg(null)}
          />
        ) : null}
      </AnimatePresence>
    </section>
  );
}
