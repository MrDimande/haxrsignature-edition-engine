"use client";

import {
  NEIDY_JOSE_CONSTANTS,
  buildGoogleCalendarUrl,
  downloadWeddingIcsFile,
} from "@lib/neidy-jose/constants";
import { Download, ExternalLink, Navigation } from "lucide-react";
import { motion } from "motion/react";

interface NeidyJoseCelebrationProps {
  prefersReducedMotion?: boolean;
}

const MAP_EMBED =
  "https://www.google.com/maps?q=-25.7417945,32.6487008&hl=pt&z=16&output=embed";

/**
 * A Celebração — partitura do dia:
 * dois actos num fio dourado + destino com mapa embutido.
 */
export function NeidyJoseCelebration({
  prefersReducedMotion = false,
}: NeidyJoseCelebrationProps) {
  const duration = prefersReducedMotion ? 0.01 : 1.05;
  const ease = [0.16, 1, 0.3, 1] as const;
  const venue = NEIDY_JOSE_CONSTANTS.locations.venue;
  const acts = NEIDY_JOSE_CONSTANTS.itinerary;

  return (
    <section
      id="celebration"
      className="nj-section-full nj-section-rise relative w-full overflow-hidden bg-[#FBFBFA] py-16 sm:py-20 md:py-28"
    >
      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-5 sm:px-8">
        <motion.p
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration, ease }}
          className="mb-3 font-body text-[10px] uppercase tracking-[0.4em] text-[#3B6456] sm:text-[11px]"
        >
          A partitura do dia
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration, delay: 0.08, ease }}
          className="nj-script-font mb-3 text-4xl text-[#CBB994] sm:text-5xl md:text-6xl"
        >
          A Celebração
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration, delay: 0.15 }}
          className="mb-12 max-w-md text-center font-serif text-sm italic leading-relaxed text-[#3B6456] sm:mb-16 sm:text-base"
        >
          Três momentos. Um só lugar. O dia em que o amor se torna cerimónia.
        </motion.p>

        {/* Score — vertical golden spine */}
        <div className="relative w-full max-w-2xl">
          <div
            className="pointer-events-none absolute bottom-8 left-8 top-8 w-px bg-gradient-to-b from-[#CBB994]/20 via-[#CBB994] to-[#CBB994]/20 md:left-1/2 md:-translate-x-1/2"
            aria-hidden
          />

          <ol className="relative m-0 list-none space-y-10 p-0 sm:space-y-14">
            {acts.map((act, index) => {
              const isLeft = index % 2 === 0;
              const actLabel = ["I", "II", "III"][index] ?? String(index + 1);
              return (
                <motion.li
                  key={act.step}
                  initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration, delay: 0.12 * index, ease }}
                  className={`relative flex ${
                    isLeft ? "justify-start" : "justify-start md:justify-end"
                  }`}
                >
                  {/* Spine node */}
                  <span
                    className="absolute left-8 top-6 z-10 flex h-3 w-3 -translate-x-1/2 items-center justify-center md:left-1/2"
                    aria-hidden
                  >
                    <span className="absolute h-3 w-3 rounded-full bg-[#CBB994]" />
                    <span className="absolute h-6 w-6 rounded-full border border-[#CBB994]/40" />
                  </span>

                  <div
                    className={`ml-16 w-full max-w-sm rounded-[1.5rem] border border-[#CBB994]/35 bg-[#0A211A] px-5 py-6 text-[#FCFDFC] shadow-[0_20px_50px_-28px_rgba(10,33,26,0.45)] sm:px-6 sm:py-7 md:ml-0 md:w-[calc(50%-2rem)] md:px-7 md:py-8 ${
                      isLeft ? "md:mr-auto md:text-right" : "md:ml-auto md:text-left"
                    }`}
                  >
                    <p
                      className={`mb-3 font-body text-[9px] uppercase tracking-[0.38em] text-[#CBB994]/75 ${
                        isLeft ? "md:text-right" : ""
                      }`}
                    >
                      Acto {actLabel}
                    </p>
                    <p
                      className={`nj-script-font mb-1 text-[#CBB994] ${
                        act.time.includes(":")
                          ? "text-4xl sm:text-5xl"
                          : "text-2xl sm:text-3xl"
                      } ${isLeft ? "md:text-right" : ""}`}
                    >
                      {act.time}
                    </p>
                    <h3
                      className={`mt-3 font-serif text-xl tracking-wide sm:text-2xl ${
                        isLeft ? "md:text-right" : ""
                      }`}
                    >
                      {act.title}
                    </h3>
                    <p
                      className={`mt-3 font-body text-xs leading-relaxed text-[#EBE4D5]/70 sm:text-sm ${
                        isLeft ? "md:ml-auto md:text-right" : ""
                      }`}
                    >
                      {act.description}
                    </p>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        </div>

        {/* Destination + Map */}
        <motion.div
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration, delay: 0.2, ease }}
          className="mt-16 w-full max-w-3xl overflow-hidden rounded-[1.75rem] border border-[#CBB994]/40 bg-[#0A211A] shadow-[0_24px_60px_-28px_rgba(10,33,26,0.5)] sm:mt-20 sm:rounded-[2rem]"
        >
          <div className="px-6 py-7 text-center sm:px-8 sm:py-8">
            <p className="mb-2 font-body text-[10px] uppercase tracking-[0.38em] text-[#CBB994]">
              O destino
            </p>
            <h3 className="font-serif text-2xl tracking-wide text-[#FCFDFC] sm:text-3xl">
              {venue.name}
            </h3>
            <p className="mt-2 font-serif text-sm italic text-[#EBE4D5]/70">
              {venue.city}, {venue.country}
            </p>
            <p className="mx-auto mt-4 max-w-sm font-body text-xs leading-relaxed text-[#EBE4D5]/55">
              Civil, fotografias e Copo de Água, no mesmo altar de celebração.
            </p>
          </div>

          <div className="relative aspect-[16/10] w-full overflow-hidden border-t border-[#CBB994]/20 sm:aspect-[21/9]">
            <iframe
              title={`Mapa — ${venue.name}`}
              src={MAP_EMBED}
              className="absolute inset-0 h-full w-full border-0 grayscale-[30%] contrast-[1.05]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <div
              className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-[#0A211A]/20"
              aria-hidden
            />
          </div>

          <div className="flex flex-col items-center justify-between gap-4 px-6 py-5 sm:flex-row sm:px-8">
            <a
              href={venue.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-body text-[10px] uppercase tracking-[0.24em] text-[#CBB994] transition-colors hover:text-[#EBE4D5]"
            >
              <Navigation className="h-3.5 w-3.5" />
              Abrir no Maps
              <ExternalLink className="h-3 w-3 opacity-70" />
            </a>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href={buildGoogleCalendarUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full bg-[#CBB994] px-4 py-2 font-body text-[10px] uppercase tracking-[0.2em] text-[#0A211A] transition-colors hover:bg-[#D8C7A5]"
              >
                Google Calendar
              </a>
              <button
                type="button"
                onClick={downloadWeddingIcsFile}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-2 font-body text-[10px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-white/10"
              >
                <Download className="h-3 w-3" />
                .ics
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
