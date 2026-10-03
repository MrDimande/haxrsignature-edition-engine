"use client";

import { Fragment } from "react";
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
          O tempo e a celebração
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration, delay: 0.08, ease }}
          className="nj-script-font mb-3 text-4xl text-[#CBB994] sm:text-5xl md:text-6xl"
        >
          O Ritmo do Nosso Dia
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration, delay: 0.15 }}
          className="mb-12 max-w-md text-center font-serif text-sm italic leading-relaxed text-[#3B6456] sm:mb-16 sm:text-base"
        >
          Seis momentos. Um só lugar. O desenho de um dia que queremos viver convosco.
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
              const isFirstOfAct =
                index === 0 || acts[index - 1].act !== act.act;
              const isAcolhimento = index === 0;
              const isWelcomeDrink = index === 1;
              const isONossoSim = index === 2;
              const isEntramosJuntos = index === 3;
              const isMudaDeRitmo = index === 4;
              const isANoiteENossa = index === 5;

              return (
                <Fragment key={act.step}>
                  {/* Divisor editorial de Acto antes do primeiro momento de cada acto */}
                  {isFirstOfAct && (
                    <li className="relative flex justify-center py-2">
                      <div className="relative z-10 inline-flex items-center gap-2 rounded-full border border-[#CBB994]/30 bg-[#0A211A]/95 px-4 py-1.5 shadow-[0_8px_20px_-8px_rgba(10,33,26,0.6)] backdrop-blur-sm">
                        <span className="font-body text-[8.5px] uppercase tracking-[0.38em] text-[#CBB994] sm:text-[9px]">
                          {act.actLabel} — {act.actTitle}
                        </span>
                      </div>
                    </li>
                  )}

                  <motion.li
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
                    animate={prefersReducedMotion ? { opacity: 1, y: 0 } : undefined}
                    whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration, delay: 0.08 * index, ease }}
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

                      {/* Acento de luz dourada couture ao término da abertura cerimonial */}
                      {isAcolhimento && !prefersReducedMotion && (
                        <motion.span
                          initial={{ scale: 0.8, opacity: 0 }}
                          whileInView={{ scale: [0.8, 1.8, 1], opacity: [0, 0.85, 0] }}
                          viewport={{ once: true, margin: "-40px" }}
                          transition={{
                            duration: 0.9,
                            delay: 1.25,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          className="pointer-events-none absolute h-7 w-7 rounded-full bg-[radial-gradient(circle,rgba(203,185,148,0.75)_0%,rgba(203,185,148,0)_72%)]"
                        />
                      )}
                    </span>

                    <div
                      className={`relative ml-16 w-full max-w-sm overflow-hidden rounded-[1.5rem] border border-[#CBB994]/35 bg-[#0A211A] px-5 py-6 text-[#FCFDFC] shadow-[0_20px_50px_-28px_rgba(10,33,26,0.45)] sm:px-6 sm:py-7 md:ml-0 md:w-[calc(50%-2rem)] md:px-7 md:py-8 ${
                        isLeft ? "md:mr-auto md:text-right" : "md:ml-auto md:text-left"
                      }`}
                    >
                      {/* Micro-interacção Couture (Momento 01): Abertura cerimonial das portas (Abrir → Receber → Entrar) */}
                      {isAcolhimento && !prefersReducedMotion && (
                        <>
                          {/* Fio de ouro bipartido — Linha Esquerda que desliza do centro para a margem */}
                          <motion.div
                            initial={{ x: "0%", opacity: 0.85 }}
                            whileInView={{ x: "-100%", opacity: 0 }}
                            viewport={{ once: true, margin: "-40px" }}
                            transition={{
                              duration: 1.1,
                              delay: 0.15,
                              ease: [0.16, 1, 0.3, 1],
                            }}
                            className="pointer-events-none absolute inset-y-4 left-1/2 z-10 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[#CBB994] to-transparent shadow-[0_0_12px_rgba(203,185,148,0.5)]"
                            aria-hidden
                          />

                          {/* Fio de ouro bipartido — Linha Direita que desliza do centro para a margem */}
                          <motion.div
                            initial={{ x: "0%", opacity: 0.85 }}
                            whileInView={{ x: "100%", opacity: 0 }}
                            viewport={{ once: true, margin: "-40px" }}
                            transition={{
                              duration: 1.1,
                              delay: 0.15,
                              ease: [0.16, 1, 0.3, 1],
                            }}
                            className="pointer-events-none absolute inset-y-4 left-1/2 z-10 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[#CBB994] to-transparent shadow-[0_0_12px_rgba(203,185,148,0.5)]"
                            aria-hidden
                          />

                          {/* Véu de luz interior que se expande do centro sugerindo o espaço aberto */}
                          <motion.div
                            initial={{ scaleX: 0.2, opacity: 0 }}
                            whileInView={{ scaleX: 1, opacity: 1 }}
                            viewport={{ once: true, margin: "-40px" }}
                            transition={{
                              duration: 1.3,
                              delay: 0.25,
                              ease: [0.16, 1, 0.3, 1],
                            }}
                            className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,rgba(203,185,148,0.1)_0%,transparent_70%)]"
                            aria-hidden
                          />
                        </>
                      )}

                      {/* Micro-interacção Couture (Momento 02): Brinde de Cristal (Receber → Brindar → Conviver) */}
                      {isWelcomeDrink && !prefersReducedMotion && (
                        <>
                          {/* Ondulação luminosa suave que percorre horizontalmente o cartão após o toque */}
                          <motion.div
                            initial={{ x: "-100%", opacity: 0 }}
                            whileInView={{ x: "200%", opacity: [0, 0.5, 0] }}
                            viewport={{ once: true, margin: "-40px" }}
                            transition={{
                              duration: 0.95,
                              delay: 0.72,
                              ease: [0.16, 1, 0.3, 1],
                            }}
                            className="pointer-events-none absolute inset-y-0 left-0 z-0 w-1/2 bg-gradient-to-r from-transparent via-[#CBB994]/15 to-transparent"
                            aria-hidden
                          />

                          {/* Reflexo límpido de cristal no cartão */}
                          <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: [0, 0.12, 0.04] }}
                            viewport={{ once: true, margin: "-40px" }}
                            transition={{
                              duration: 1.2,
                              delay: 0.3,
                              ease: [0.16, 1, 0.3, 1],
                            }}
                            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(203,185,148,0.2)_0%,transparent_65%)]"
                            aria-hidden
                          />
                        </>
                      )}

                      {/* Micro-interacção Couture (Momento 03): Resplendor Cerimonial da Convergência */}
                      {isONossoSim && !prefersReducedMotion && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.85 }}
                          whileInView={{ opacity: [0, 0.12, 0.04], scale: 1 }}
                          viewport={{ once: true, margin: "-40px" }}
                          transition={{
                            duration: 0.8,
                            delay: 0.75,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(203,185,148,0.18)_0%,transparent_65%)]"
                          aria-hidden
                        />
                      )}

                      {/* Conteúdo tipográfico */}
                      <div className="relative z-10">
                        {isAcolhimento ? (
                          <>
                            {/* Momento 01: Hierarquia com staggered reveal cerimonial (Intacto) */}
                            <motion.p
                              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 4 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true, margin: "-40px" }}
                              transition={{
                                duration: prefersReducedMotion ? 0.01 : 0.6,
                                delay: prefersReducedMotion ? 0 : 0.2,
                                ease,
                              }}
                              className={`mb-2 font-body text-[8.5px] uppercase tracking-[0.36em] text-[#CBB994]/75 ${
                                isLeft ? "md:text-right" : ""
                              }`}
                            >
                              {act.actLabel} · {act.actTitle}
                            </motion.p>
                            <motion.p
                              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true, margin: "-40px" }}
                              transition={{
                                duration: prefersReducedMotion ? 0.01 : 0.7,
                                delay: prefersReducedMotion ? 0 : 0.4,
                                ease,
                              }}
                              className={`nj-script-font mb-1 text-4xl text-[#CBB994] sm:text-5xl ${
                                isLeft ? "md:text-right" : ""
                              }`}
                            >
                              {act.time}
                            </motion.p>
                            <motion.h3
                              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true, margin: "-40px" }}
                              transition={{
                                duration: prefersReducedMotion ? 0.01 : 0.7,
                                delay: prefersReducedMotion ? 0 : 0.65,
                                ease,
                              }}
                              className={`mt-2 font-serif text-xl tracking-wide sm:text-2xl ${
                                isLeft ? "md:text-right" : ""
                              }`}
                            >
                              {act.title}
                            </motion.h3>
                            <motion.p
                              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 6 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true, margin: "-40px" }}
                              transition={{
                                duration: prefersReducedMotion ? 0.01 : 0.7,
                                delay: prefersReducedMotion ? 0 : 0.95,
                                ease,
                              }}
                              className={`mt-3 font-body text-xs leading-relaxed text-[#EBE4D5]/70 sm:text-sm ${
                                isLeft ? "md:ml-auto md:text-right" : ""
                              }`}
                            >
                              {act.description}
                            </motion.p>
                          </>
                        ) : isWelcomeDrink ? (
                          <>
                            {/* Momento 02: Welcome Drink — Composição do Brinde de Cristal */}
                            {!prefersReducedMotion && (
                              <div className="relative mb-2 h-7 w-28 overflow-visible" aria-hidden>
                                <svg
                                  viewBox="0 0 112 28"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-full w-full"
                                >
                                  {/* Arco de cristal esquerdo */}
                                  <motion.path
                                    d="M 12 24 C 28 20, 44 14, 54 6"
                                    stroke="url(#crystalGoldL)"
                                    strokeWidth="1.2"
                                    strokeLinecap="round"
                                    initial={{ x: -14, opacity: 0 }}
                                    whileInView={{ x: 0, opacity: 0.85 }}
                                    viewport={{ once: true, margin: "-40px" }}
                                    transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                                  />
                                  {/* Arco de cristal direito */}
                                  <motion.path
                                    d="M 100 24 C 84 20, 68 14, 58 6"
                                    stroke="url(#crystalGoldR)"
                                    strokeWidth="1.2"
                                    strokeLinecap="round"
                                    initial={{ x: 14, opacity: 0 }}
                                    whileInView={{ x: 0, opacity: 0.85 }}
                                    viewport={{ once: true, margin: "-40px" }}
                                    transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                                  />
                                  <defs>
                                    <linearGradient id="crystalGoldL" x1="12" y1="24" x2="54" y2="6" gradientUnits="userSpaceOnUse">
                                      <stop stopColor="#CBB994" stopOpacity="0.2" />
                                      <stop offset="1" stopColor="#FFF8E7" stopOpacity="0.95" />
                                    </linearGradient>
                                    <linearGradient id="crystalGoldR" x1="100" y1="24" x2="58" y2="6" gradientUnits="userSpaceOnUse">
                                      <stop stopColor="#CBB994" stopOpacity="0.2" />
                                      <stop offset="1" stopColor="#FFF8E7" stopOpacity="0.95" />
                                    </linearGradient>
                                  </defs>
                                </svg>

                                {/* Micro-flash de cristal no ápice do toque */}
                                <motion.div
                                  initial={{ scale: 0, opacity: 0 }}
                                  whileInView={{ scale: [0, 1.5, 1, 0], opacity: [0, 1, 0.8, 0] }}
                                  viewport={{ once: true, margin: "-40px" }}
                                  transition={{
                                    duration: 0.42,
                                    delay: 0.66,
                                    ease: [0.16, 1, 0.3, 1],
                                  }}
                                  className="pointer-events-none absolute left-[56px] top-[6px] -translate-x-1/2 -translate-y-1/2"
                                >
                                  <div className="h-2 w-2 rotate-45 bg-[#FFFDF5] shadow-[0_0_12px_rgba(255,253,245,0.95)]" />
                                  <div className="absolute -inset-1 rounded-full bg-[radial-gradient(circle,rgba(255,253,245,0.8)_0%,rgba(203,185,148,0.3)_60%,transparent_80%)]" />
                                </motion.div>
                              </div>
                            )}

                            <motion.p
                              initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
                              animate={prefersReducedMotion ? { opacity: 1, y: 0 } : undefined}
                              whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                              viewport={{ once: true, margin: "-40px" }}
                              transition={{
                                duration: prefersReducedMotion ? 0.01 : 0.55,
                                delay: prefersReducedMotion ? 0 : 0.15,
                                ease,
                              }}
                              className={`mb-2 font-body text-[8.5px] uppercase tracking-[0.36em] text-[#CBB994]/75 ${
                                isLeft ? "md:text-right" : ""
                              }`}
                            >
                              {act.actLabel} · {act.actTitle}
                            </motion.p>
                            <motion.p
                              initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
                              animate={prefersReducedMotion ? { opacity: 1, y: 0 } : undefined}
                              whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                              viewport={{ once: true, margin: "-40px" }}
                              transition={{
                                duration: prefersReducedMotion ? 0.01 : 0.65,
                                delay: prefersReducedMotion ? 0 : 0.35,
                                ease,
                              }}
                              className={`nj-script-font mb-1 text-4xl text-[#CBB994] sm:text-5xl ${
                                isLeft ? "md:text-right" : ""
                              }`}
                            >
                              {act.time}
                            </motion.p>
                            <motion.h3
                              initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
                              animate={prefersReducedMotion ? { opacity: 1, y: 0 } : undefined}
                              whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                              viewport={{ once: true, margin: "-40px" }}
                              transition={{
                                duration: prefersReducedMotion ? 0.01 : 0.65,
                                delay: prefersReducedMotion ? 0 : 0.68,
                                ease,
                              }}
                              className={`mt-2 font-serif text-xl tracking-wide sm:text-2xl ${
                                isLeft ? "md:text-right" : ""
                              }`}
                            >
                              {act.title}
                            </motion.h3>
                            <motion.p
                              initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
                              animate={prefersReducedMotion ? { opacity: 1, y: 0 } : undefined}
                              whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                              viewport={{ once: true, margin: "-40px" }}
                              transition={{
                                duration: prefersReducedMotion ? 0.01 : 0.65,
                                delay: prefersReducedMotion ? 0 : 0.98,
                                ease,
                              }}
                              className={`mt-3 font-body text-xs leading-relaxed text-[#EBE4D5]/70 sm:text-sm ${
                                isLeft ? "md:ml-auto md:text-right" : ""
                              }`}
                            >
                              {act.description}
                            </motion.p>
                          </>
                        ) : isONossoSim ? (
                          <>
                            {/* Momento 03: 14:30 · O Nosso Sim — Duas Trajectórias → Convergência → Assinatura → Ponto de Luz */}
                            {!prefersReducedMotion ? (
                              <div
                                className={`relative mb-3 h-7 w-full max-w-[240px] overflow-visible ${
                                  isLeft ? "md:ml-auto" : ""
                                }`}
                                aria-hidden
                              >
                                <svg
                                  viewBox="0 0 240 28"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-full w-full overflow-visible"
                                >
                                  <defs>
                                    <linearGradient id="simLineGoldLeft" x1="6" y1="18" x2="110" y2="14" gradientUnits="userSpaceOnUse">
                                      <stop stopColor="#CBB994" stopOpacity="0.15" />
                                      <stop offset="0.6" stopColor="#CBB994" stopOpacity="0.75" />
                                      <stop offset="1" stopColor="#FFF8E7" stopOpacity="0.95" />
                                    </linearGradient>
                                    <linearGradient id="simLineGoldRight" x1="214" y1="19" x2="110" y2="14" gradientUnits="userSpaceOnUse">
                                      <stop stopColor="#CBB994" stopOpacity="0.15" />
                                      <stop offset="0.6" stopColor="#CBB994" stopOpacity="0.75" />
                                      <stop offset="1" stopColor="#FFF8E7" stopOpacity="0.95" />
                                    </linearGradient>
                                    <linearGradient id="simGestureGold" x1="110" y1="14" x2="164" y2="14" gradientUnits="userSpaceOnUse">
                                      <stop stopColor="#FFF8E7" stopOpacity="0.95" />
                                      <stop offset="0.8" stopColor="#CBB994" stopOpacity="0.9" />
                                      <stop offset="1" stopColor="#CBB994" stopOpacity="0.75" />
                                    </linearGradient>
                                  </defs>

                                  {/* Trajectória Esquerda */}
                                  <motion.path
                                    d="M 6 18 C 35 18, 70 12, 110 14"
                                    stroke="url(#simLineGoldLeft)"
                                    strokeWidth="1.15"
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    whileInView={{ pathLength: 1, opacity: 0.85 }}
                                    viewport={{ once: true, margin: "-40px" }}
                                    transition={{
                                      duration: 0.55,
                                      delay: 0.2,
                                      ease: [0.16, 1, 0.3, 1],
                                    }}
                                  />

                                  {/* Trajectória Direita */}
                                  <motion.path
                                    d="M 214 19 C 185 20, 150 16, 110 14"
                                    stroke="url(#simLineGoldRight)"
                                    strokeWidth="1.15"
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    whileInView={{ pathLength: 1, opacity: 0.85 }}
                                    viewport={{ once: true, margin: "-40px" }}
                                    transition={{
                                      duration: 0.55,
                                      delay: 0.2,
                                      ease: [0.16, 1, 0.3, 1],
                                    }}
                                  />

                                  {/* Gesto Caligráfico da Linha Única (Convergência e Assinatura Abstracta) */}
                                  <motion.path
                                    d="M 110 14 C 118 10, 126 9, 132 12 C 137 15, 142 16, 148 13 C 153 10, 158 13, 164 14"
                                    stroke="url(#simGestureGold)"
                                    strokeWidth="1.25"
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    whileInView={{ pathLength: 1, opacity: 0.95 }}
                                    viewport={{ once: true, margin: "-40px" }}
                                    transition={{
                                      duration: 0.45,
                                      delay: 0.75,
                                      ease: [0.16, 1, 0.3, 1],
                                    }}
                                  />

                                  {/* Ponto Dourado de Luz Estabilizador no término do traço */}
                                  <motion.g
                                    initial={{ scale: 0, opacity: 0 }}
                                    whileInView={{ scale: 1, opacity: 1 }}
                                    viewport={{ once: true, margin: "-40px" }}
                                    transition={{
                                      duration: 0.35,
                                      delay: 1.18,
                                      ease: [0.16, 1, 0.3, 1],
                                    }}
                                    style={{ transformOrigin: "164px 14px" }}
                                  >
                                    <circle cx="164" cy="14" r="3" fill="#CBB994" fillOpacity="0.3" />
                                    <circle cx="164" cy="14" r="1.6" fill="#FFFDF5" />
                                  </motion.g>
                                </svg>
                              </div>
                            ) : (
                              /* Fallback elegante e estático para prefers-reduced-motion: linha subtil sem animação */
                              <div
                                className={`relative mb-3 h-5 w-full max-w-[200px] overflow-visible ${
                                  isLeft ? "md:ml-auto" : ""
                                }`}
                                aria-hidden
                              >
                                <svg
                                  viewBox="0 0 200 20"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-full w-full"
                                >
                                  <path
                                    d="M 6 10 L 140 10"
                                    stroke="#CBB994"
                                    strokeWidth="1"
                                    strokeOpacity="0.4"
                                  />
                                  <circle cx="140" cy="10" r="1.5" fill="#CBB994" fillOpacity="0.75" />
                                </svg>
                              </div>
                            )}

                            <motion.p
                              initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
                              animate={prefersReducedMotion ? { opacity: 1, y: 0 } : undefined}
                              whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                              viewport={{ once: true, margin: "-40px" }}
                              transition={{
                                duration: prefersReducedMotion ? 0.01 : 0.5,
                                delay: prefersReducedMotion ? 0 : 0.12,
                                ease,
                              }}
                              className={`mb-2 font-body text-[8.5px] uppercase tracking-[0.36em] text-[#CBB994]/75 ${
                                isLeft ? "md:text-right" : ""
                              }`}
                            >
                              {act.actLabel} · {act.actTitle}
                            </motion.p>
                            <motion.p
                              initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
                              animate={prefersReducedMotion ? { opacity: 1, y: 0 } : undefined}
                              whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                              viewport={{ once: true, margin: "-40px" }}
                              transition={{
                                duration: prefersReducedMotion ? 0.01 : 0.55,
                                delay: prefersReducedMotion ? 0 : 0.3,
                                ease,
                              }}
                              className={`nj-script-font mb-1 text-4xl text-[#CBB994] sm:text-5xl ${
                                isLeft ? "md:text-right" : ""
                              }`}
                            >
                              {act.time}
                            </motion.p>
                            <motion.h3
                              initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
                              animate={prefersReducedMotion ? { opacity: 1, y: 0 } : undefined}
                              whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                              viewport={{ once: true, margin: "-40px" }}
                              transition={{
                                duration: prefersReducedMotion ? 0.01 : 0.55,
                                delay: prefersReducedMotion ? 0 : 0.75,
                                ease,
                              }}
                              className={`mt-2 font-serif text-xl tracking-wide sm:text-2xl ${
                                isLeft ? "md:text-right" : ""
                              }`}
                            >
                              {act.title}
                            </motion.h3>
                            <motion.p
                              initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
                              animate={prefersReducedMotion ? { opacity: 1, y: 0 } : undefined}
                              whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                              viewport={{ once: true, margin: "-40px" }}
                              transition={{
                                duration: prefersReducedMotion ? 0.01 : 0.6,
                                delay: prefersReducedMotion ? 0 : 1.05,
                                ease,
                              }}
                              className={`mt-3 font-body text-xs leading-relaxed text-[#EBE4D5]/70 sm:text-sm ${
                                isLeft ? "md:ml-auto md:text-right" : ""
                              }`}
                            >
                              {act.description}
                            </motion.p>
                          </>
                        ) : isEntramosJuntos ? (
                          <>
                            {/* Momento 04: 15:00 · Entramos Juntos — Limiar de Profundidade → Expansão do Horizonte → Entrada Solene */}
                            {!prefersReducedMotion ? (
                              <div
                                className={`relative mb-3 h-8 w-full max-w-[250px] overflow-visible ${
                                  isLeft ? "md:ml-auto" : ""
                                }`}
                                aria-hidden
                              >
                                <svg
                                  viewBox="0 0 250 32"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-full w-full overflow-visible"
                                >
                                  <defs>
                                    {/* Gradiente do Limiar Esquerdo */}
                                    <linearGradient
                                      id="thresholdGradLeft"
                                      x1="0"
                                      y1="16"
                                      x2="50"
                                      y2="16"
                                      gradientUnits="userSpaceOnUse"
                                    >
                                      <stop stopColor="#CBB994" stopOpacity="0.28" />
                                      <stop offset="0.6" stopColor="#CBB994" stopOpacity="0.12" />
                                      <stop offset="1" stopColor="#CBB994" stopOpacity="0" />
                                    </linearGradient>

                                    {/* Gradiente do Limiar Direito */}
                                    <linearGradient
                                      id="thresholdGradRight"
                                      x1="250"
                                      y1="16"
                                      x2="200"
                                      y2="16"
                                      gradientUnits="userSpaceOnUse"
                                    >
                                      <stop stopColor="#CBB994" stopOpacity="0.28" />
                                      <stop offset="0.6" stopColor="#CBB994" stopOpacity="0.12" />
                                      <stop offset="1" stopColor="#CBB994" stopOpacity="0" />
                                    </linearGradient>

                                    {/* Gradiente da Linha de Horizonte / Mesa de Partilha */}
                                    <linearGradient
                                      id="horizonLineGold"
                                      x1="15"
                                      y1="16"
                                      x2="235"
                                      y2="16"
                                      gradientUnits="userSpaceOnUse"
                                    >
                                      <stop stopColor="#CBB994" stopOpacity="0.1" />
                                      <stop offset="0.2" stopColor="#CBB994" stopOpacity="0.85" />
                                      <stop offset="0.5" stopColor="#FFF8E7" stopOpacity="0.95" />
                                      <stop offset="0.8" stopColor="#CBB994" stopOpacity="0.85" />
                                      <stop offset="1" stopColor="#CBB994" stopOpacity="0.1" />
                                    </linearGradient>
                                  </defs>

                                  {/* Planos Laterais de Profundidade: Recuo Suave em Perspectiva (Atravessar o Limiar) */}
                                  <motion.g
                                    initial={{ opacity: 0, scale: 1.08 }}
                                    whileInView={{ opacity: 0.85, scale: 1 }}
                                    viewport={{ once: true, margin: "-40px" }}
                                    transition={{
                                      duration: 0.65,
                                      delay: 0.15,
                                      ease: [0.16, 1, 0.3, 1],
                                    }}
                                    style={{ transformOrigin: "125px 16px" }}
                                  >
                                    {/* Plano de profundidade esquerdo */}
                                    <polygon
                                      points="0,2 50,7 50,25 0,30"
                                      fill="url(#thresholdGradLeft)"
                                    />
                                    {/* Plano de profundidade direito */}
                                    <polygon
                                      points="250,2 200,7 200,25 250,30"
                                      fill="url(#thresholdGradRight)"
                                    />
                                  </motion.g>

                                  {/* Linha de Horizonte Dourada: Expansão do Espaço e Mesa de Partilha */}
                                  <motion.line
                                    x1="15"
                                    y1="16"
                                    x2="235"
                                    y2="16"
                                    stroke="url(#horizonLineGold)"
                                    strokeWidth="1.15"
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    whileInView={{ pathLength: 1, opacity: 0.9 }}
                                    viewport={{ once: true, margin: "-40px" }}
                                    transition={{
                                      duration: 0.6,
                                      delay: 0.35,
                                      ease: [0.16, 1, 0.3, 1],
                                    }}
                                  />

                                  {/* Feixe de Brilho Quente Percorrendo o Horizonte (Uma Única Vez) */}
                                  <motion.g
                                    initial={{ x: 15, opacity: 0 }}
                                    whileInView={{ x: 235, opacity: [0, 0.95, 0.85, 0] }}
                                    viewport={{ once: true, margin: "-40px" }}
                                    transition={{
                                      duration: 0.5,
                                      delay: 0.95,
                                      ease: [0.16, 1, 0.3, 1],
                                    }}
                                  >
                                    <circle cx="0" cy="16" r="4.5" fill="#CBB994" fillOpacity="0.25" />
                                    <circle cx="0" cy="16" r="2" fill="#FFFDF5" />
                                  </motion.g>
                                </svg>
                              </div>
                            ) : (
                              /* Fallback elegante e estático para prefers-reduced-motion */
                              <div
                                className={`relative mb-3 h-5 w-full max-w-[200px] overflow-visible ${
                                  isLeft ? "md:ml-auto" : ""
                                }`}
                                aria-hidden
                              >
                                <svg
                                  viewBox="0 0 200 20"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-full w-full"
                                >
                                  <line
                                    x1="10"
                                    y1="10"
                                    x2="170"
                                    y2="10"
                                    stroke="#CBB994"
                                    strokeWidth="1"
                                    strokeOpacity="0.45"
                                    strokeLinecap="round"
                                  />
                                </svg>
                              </div>
                            )}

                            <motion.p
                              initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
                              animate={prefersReducedMotion ? { opacity: 1, y: 0 } : undefined}
                              whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                              viewport={{ once: true, margin: "-40px" }}
                              transition={{
                                duration: prefersReducedMotion ? 0.01 : 0.5,
                                delay: prefersReducedMotion ? 0 : 0.12,
                                ease,
                              }}
                              className={`mb-2 font-body text-[8.5px] uppercase tracking-[0.36em] text-[#CBB994]/75 ${
                                isLeft ? "md:text-right" : ""
                              }`}
                            >
                              {act.actLabel} · {act.actTitle}
                            </motion.p>
                            <motion.p
                              initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
                              animate={prefersReducedMotion ? { opacity: 1, y: 0 } : undefined}
                              whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                              viewport={{ once: true, margin: "-40px" }}
                              transition={{
                                duration: prefersReducedMotion ? 0.01 : 0.55,
                                delay: prefersReducedMotion ? 0 : 0.4,
                                ease,
                              }}
                              className={`nj-script-font mb-1 text-4xl text-[#CBB994] sm:text-5xl ${
                                isLeft ? "md:text-right" : ""
                              }`}
                            >
                              {act.time}
                            </motion.p>
                            <motion.h3
                              initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
                              animate={prefersReducedMotion ? { opacity: 1, y: 0 } : undefined}
                              whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                              viewport={{ once: true, margin: "-40px" }}
                              transition={{
                                duration: prefersReducedMotion ? 0.01 : 0.55,
                                delay: prefersReducedMotion ? 0 : 0.8,
                                ease,
                              }}
                              className={`mt-2 font-serif text-xl font-medium tracking-wide text-[#FCFDFC] sm:text-2xl ${
                                isLeft ? "md:text-right" : ""
                              }`}
                            >
                              {act.title}
                            </motion.h3>
                            <motion.p
                              initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
                              animate={prefersReducedMotion ? { opacity: 1, y: 0 } : undefined}
                              whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                              viewport={{ once: true, margin: "-40px" }}
                              transition={{
                                duration: prefersReducedMotion ? 0.01 : 0.6,
                                delay: prefersReducedMotion ? 0 : 1.1,
                                ease,
                              }}
                              className={`mt-3 font-body text-xs leading-relaxed text-[#EBE4D5]/70 sm:text-sm ${
                                isLeft ? "md:ml-auto md:text-right" : ""
                              }`}
                            >
                              {act.description}
                            </motion.p>
                          </>
                        ) : isMudaDeRitmo ? (
                          <>
                            {/* Momento 05: 18:00 · A Celebração Muda de Ritmo — Atmosfera Nocturna & Cadência de Curvas */}
                            {!prefersReducedMotion ? (
                                <div
                                  className={`relative mb-3 h-8 w-full max-w-[250px] overflow-visible ${
                                    isLeft ? "md:ml-auto" : ""
                                  }`}
                                  aria-hidden
                                >
                                  {/* Respiro de Luz / Atmosfera Nocturna Translúcida */}
                                  <motion.div
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 0.35 }}
                                    viewport={{ once: true, margin: "-40px" }}
                                    transition={{
                                      duration: 0.85,
                                      delay: 0.15,
                                      ease: [0.16, 1, 0.3, 1],
                                    }}
                                    className="pointer-events-none absolute -inset-x-2 -top-1 h-9 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(203,185,148,0.25)_0%,rgba(203,185,148,0)_70%)]"
                                  />

                                  <svg
                                    viewBox="0 0 250 32"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="relative z-10 h-full w-full overflow-visible"
                                  >
                                    <defs>
                                      {/* Gradiente da Curva Principal de Cadência */}
                                      <linearGradient
                                        id="ritmoWaveGold1"
                                        x1="10"
                                        y1="16"
                                        x2="240"
                                        y2="16"
                                        gradientUnits="userSpaceOnUse"
                                      >
                                        <stop stopColor="#CBB994" stopOpacity="0.1" />
                                        <stop offset="0.3" stopColor="#CBB994" stopOpacity="0.85" />
                                        <stop offset="0.6" stopColor="#FFF8E7" stopOpacity="0.95" />
                                        <stop offset="0.85" stopColor="#CBB994" stopOpacity="0.75" />
                                        <stop offset="1" stopColor="#CBB994" stopOpacity="0.1" />
                                      </linearGradient>

                                      {/* Gradiente da Contra-Curva Harmónica */}
                                      <linearGradient
                                        id="ritmoWaveGold2"
                                        x1="15"
                                        y1="20"
                                        x2="235"
                                        y2="20"
                                        gradientUnits="userSpaceOnUse"
                                      >
                                        <stop stopColor="#CBB994" stopOpacity="0.05" />
                                        <stop offset="0.4" stopColor="#CBB994" stopOpacity="0.6" />
                                        <stop offset="0.7" stopColor="#EBE4D5" stopOpacity="0.75" />
                                        <stop offset="1" stopColor="#CBB994" stopOpacity="0.05" />
                                      </linearGradient>
                                    </defs>

                                    {/* Curva Principal de Seda / Cadência Coreográfica */}
                                    <motion.path
                                      d="M 10 16 C 55 6, 95 24, 140 14 C 185 4, 215 20, 240 12"
                                      stroke="url(#ritmoWaveGold1)"
                                      strokeWidth="1.25"
                                      strokeLinecap="round"
                                      initial={{ pathLength: 0, opacity: 0 }}
                                      whileInView={{ pathLength: 1, opacity: 0.85 }}
                                      viewport={{ once: true, margin: "-40px" }}
                                      transition={{
                                        duration: 0.65,
                                        delay: 0.25,
                                        ease: [0.16, 1, 0.3, 1],
                                      }}
                                    />

                                    {/* Contra-Curva Harmónica (Tecido em Movimento) */}
                                    <motion.path
                                      d="M 15 20 C 60 26, 100 12, 145 22 C 180 30, 210 16, 235 18"
                                      stroke="url(#ritmoWaveGold2)"
                                      strokeWidth="1.0"
                                      strokeLinecap="round"
                                      initial={{ pathLength: 0, opacity: 0 }}
                                      whileInView={{ pathLength: 1, opacity: 0.65 }}
                                      viewport={{ once: true, margin: "-40px" }}
                                      transition={{
                                        duration: 0.65,
                                        delay: 0.35,
                                        ease: [0.16, 1, 0.3, 1],
                                      }}
                                    />
                                  </svg>
                                </div>
                            ) : (
                              /* Fallback elegante e estático para prefers-reduced-motion */
                              <div
                                className={`relative mb-3 h-5 w-full max-w-[200px] overflow-visible ${
                                  isLeft ? "md:ml-auto" : ""
                                }`}
                                aria-hidden
                              >
                                <svg
                                  viewBox="0 0 200 20"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-full w-full"
                                >
                                  <path
                                    d="M 10 14 C 70 8, 130 20, 190 14"
                                    stroke="#CBB994"
                                    strokeWidth="1"
                                    strokeOpacity="0.4"
                                    strokeLinecap="round"
                                  />
                                </svg>
                              </div>
                            )}

                            <motion.p
                              initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
                              animate={prefersReducedMotion ? { opacity: 1, y: 0 } : undefined}
                              whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                              viewport={{ once: true, margin: "-40px" }}
                              transition={{
                                duration: prefersReducedMotion ? 0.01 : 0.5,
                                delay: prefersReducedMotion ? 0 : 0.12,
                                ease,
                              }}
                              className={`mb-2 font-body text-[8.5px] uppercase tracking-[0.36em] text-[#CBB994]/75 ${
                                isLeft ? "md:text-right" : ""
                              }`}
                            >
                              {act.actLabel} · {act.actTitle}
                            </motion.p>
                            <motion.p
                              initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
                              animate={prefersReducedMotion ? { opacity: 1, y: 0 } : undefined}
                              whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                              viewport={{ once: true, margin: "-40px" }}
                              transition={{
                                duration: prefersReducedMotion ? 0.01 : 0.55,
                                delay: prefersReducedMotion ? 0 : 0.35,
                                ease,
                              }}
                              className={`nj-script-font mb-1 text-4xl text-[#CBB994] sm:text-5xl ${
                                isLeft ? "md:text-right" : ""
                              }`}
                            >
                              {act.time}
                            </motion.p>
                            <motion.h3
                              initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
                              animate={prefersReducedMotion ? { opacity: 1, y: 0 } : undefined}
                              whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                              viewport={{ once: true, margin: "-40px" }}
                              transition={{
                                duration: prefersReducedMotion ? 0.01 : 0.55,
                                delay: prefersReducedMotion ? 0 : 0.8,
                                ease,
                              }}
                              className={`mt-2 font-serif text-xl font-medium tracking-wide text-[#FCFDFC] sm:text-2xl ${
                                isLeft ? "md:text-right" : ""
                              }`}
                            >
                              {act.title}
                            </motion.h3>
                            <motion.p
                              initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
                              animate={prefersReducedMotion ? { opacity: 1, y: 0 } : undefined}
                              whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                              viewport={{ once: true, margin: "-40px" }}
                              transition={{
                                duration: prefersReducedMotion ? 0.01 : 0.6,
                                delay: prefersReducedMotion ? 0 : 1.15,
                                ease,
                              }}
                              className={`mt-3 font-body text-xs leading-relaxed text-[#EBE4D5]/70 sm:text-sm ${
                                isLeft ? "md:ml-auto md:text-right" : ""
                              }`}
                            >
                              {act.description}
                            </motion.p>
                          </>
                        ) : isANoiteENossa ? (
                          <>
                            {/* Momento 06: 19:00 · A Noite é Nossa — Contenção → Libertação do Tempo → Espaço Aberto */}
                            {/* Respiro de Luz Marfim/Dourada — O Espaço Ficou Livre (Fecho Couture) */}
                            {!prefersReducedMotion && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: [0, 0.22, 0.06], scale: [0.95, 1.05, 1.02] }}
                                viewport={{ once: true, margin: "-40px" }}
                                transition={{
                                  duration: 0.85,
                                  delay: 0.8,
                                  ease: [0.16, 1, 0.3, 1],
                                }}
                                className="pointer-events-none absolute -inset-6 z-0 bg-[radial-gradient(ellipse_at_center,rgba(235,228,213,0.16)_0%,rgba(203,185,148,0.06)_45%,transparent_75%)]"
                                aria-hidden
                              />
                            )}

                            <motion.p
                              initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
                              animate={prefersReducedMotion ? { opacity: 1, y: 0 } : undefined}
                              whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                              viewport={{ once: true, margin: "-40px" }}
                              transition={{
                                duration: prefersReducedMotion ? 0.01 : 0.5,
                                delay: prefersReducedMotion ? 0 : 0.1,
                                ease,
                              }}
                              className={`mb-2 font-body text-[8.5px] uppercase tracking-[0.36em] text-[#CBB994]/75 ${
                                isLeft ? "md:text-right" : ""
                              }`}
                            >
                              {act.actLabel} · {act.actTitle}
                            </motion.p>

                            {/* Contorno temporal editorial (Contenção → Libertação do Tempo) ao redor do horário */}
                            <div className="relative my-1.5 inline-block">
                              {!prefersReducedMotion ? (
                                <motion.div
                                  initial={{ opacity: 0.75, scale: 1 }}
                                  whileInView={{
                                    opacity: [0.75, 0.75, 0],
                                    scale: [1, 1, 1.08],
                                  }}
                                  viewport={{ once: true, margin: "-40px" }}
                                  transition={{
                                    duration: 0.48,
                                    delay: 0.58,
                                    ease: [0.16, 1, 0.3, 1],
                                  }}
                                  className="pointer-events-none absolute -inset-x-3.5 -inset-y-1 rounded-lg border border-[#CBB994]/45"
                                  aria-hidden
                                >
                                  {/* Quebras métricas sutis de medição temporal nos eixos */}
                                  <span className="absolute -top-[1px] left-1/2 h-[1px] w-6 -translate-x-1/2 bg-[#0A211A]" />
                                  <span className="absolute -bottom-[1px] left-1/2 h-[1px] w-6 -translate-x-1/2 bg-[#0A211A]" />
                                  <span className="absolute -left-[1px] top-1/2 h-4 w-[1px] -translate-y-1/2 bg-[#0A211A]" />
                                  <span className="absolute -right-[1px] top-1/2 h-4 w-[1px] -translate-y-1/2 bg-[#0A211A]" />

                                  {/* Cantoneiras editoriais em dourado nobre */}
                                  <span className="absolute -left-1 -top-1 h-2 w-2 border-l border-t border-[#CBB994]" />
                                  <span className="absolute -right-1 -top-1 h-2 w-2 border-r border-t border-[#CBB994]" />
                                  <span className="absolute -bottom-1 -left-1 h-2 w-2 border-b border-l border-[#CBB994]" />
                                  <span className="absolute -bottom-1 -right-1 h-2 w-2 border-b border-r border-[#CBB994]" />
                                </motion.div>
                              ) : (
                                /* Fallback estático para prefers-reduced-motion: contorno incompleto muito subtil */
                                <div
                                  className="pointer-events-none absolute -inset-x-3.5 -inset-y-1 rounded-lg border border-[#CBB994]/20"
                                  aria-hidden
                                />
                              )}

                              <motion.p
                                initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
                                animate={prefersReducedMotion ? { opacity: 1, y: 0 } : undefined}
                                whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-40px" }}
                                transition={{
                                  duration: prefersReducedMotion ? 0.01 : 0.55,
                                  delay: prefersReducedMotion ? 0 : 0.2,
                                  ease,
                                }}
                                className={`nj-script-font text-4xl text-[#CBB994] sm:text-5xl ${
                                  isLeft ? "md:text-right" : ""
                                }`}
                              >
                                {act.time}
                              </motion.p>
                            </div>

                            <motion.h3
                              initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
                              animate={prefersReducedMotion ? { opacity: 1, y: 0 } : undefined}
                              whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                              viewport={{ once: true, margin: "-40px" }}
                              transition={{
                                duration: prefersReducedMotion ? 0.01 : 0.55,
                                delay: prefersReducedMotion ? 0 : 0.95,
                                ease,
                              }}
                              className={`mt-2 font-serif text-xl font-medium tracking-wide text-[#FCFDFC] sm:text-2xl ${
                                isLeft ? "md:text-right" : ""
                              }`}
                            >
                              {act.title}
                            </motion.h3>

                            {/* Micro-copy com cadência narrativa: A pista abre para todos. A partir daqui, deixamos de contar as horas. */}
                            <motion.p
                              initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
                              animate={prefersReducedMotion ? { opacity: 1, y: 0 } : undefined}
                              whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                              viewport={{ once: true, margin: "-40px" }}
                              transition={{
                                duration: prefersReducedMotion ? 0.01 : 0.5,
                                delay: prefersReducedMotion ? 0 : 1.25,
                                ease,
                              }}
                              className={`mt-3 font-body text-xs leading-relaxed text-[#EBE4D5]/70 sm:text-sm ${
                                isLeft ? "md:ml-auto md:text-right" : ""
                              }`}
                            >
                              <span>A pista abre para todos. </span>
                              <motion.span
                                initial={prefersReducedMotion ? false : { opacity: 0, y: 3 }}
                                animate={prefersReducedMotion ? { opacity: 1, y: 0 } : undefined}
                                whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-40px" }}
                                transition={{
                                  duration: prefersReducedMotion ? 0.01 : 0.45,
                                  delay: prefersReducedMotion ? 0 : 1.55,
                                  ease,
                                }}
                                className="inline text-[#EBE4D5]/90 font-medium"
                              >
                                A partir daqui, deixamos de contar as horas.
                              </motion.span>
                            </motion.p>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </motion.li>
                </Fragment>
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
              Acolhimento, casamento civil e celebração, no mesmo lugar.
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
