"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import {
  STAN_STORY_ACTS,
  STAN_STORY_EPILOGUE,
  STAN_STORY_PROLOGUE,
  isValidStanStorySrc,
  type StanStoryAct,
  type StanStoryImage,
} from "./stan-story-data";

const EASE = [0.22, 1, 0.36, 1] as const;

const COLORS = {
  warmBeige: "#F7F4EF",
  paper: "#FFFCFA",
  camel: "#C9A86A",
  navy: "#0A1628",
  inkSoft: "#5B6B7C",
  slate: "#3D4F63",
} as const;

function StoryImage({
  image,
  className = "",
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority = false,
}: {
  image: StanStoryImage;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(!isValidStanStorySrc(image.src));

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-[#0A1628]/10 via-[#F7F4EF] to-[#C9A86A]/15 ${className}`}
        role="img"
        aria-label={image.alt}
      >
        <span className="font-display text-3xl text-[#C9A86A]/35">V</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={image.src}
        alt={image.alt}
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover"
        style={
          image.focalPosition
            ? { objectPosition: image.focalPosition }
            : undefined
        }
        onError={() => setFailed(true)}
      />
    </div>
  );
}

function Reveal({
  children,
  delay = 0,
  className = "",
  y = 32,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.9, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Envelope editorial — o “card” que forma cada página da história */
function EditorialCard({
  children,
  tone,
  className = "",
  id,
}: {
  children: React.ReactNode;
  tone: "light" | "dark";
  className?: string;
  id?: string;
}) {
  const light = tone === "light";
  return (
    <article
      id={id}
      className={`relative overflow-hidden ${className}`}
      style={{
        backgroundColor: light ? COLORS.paper : COLORS.navy,
        boxShadow: light
          ? "0 28px 80px rgba(10,22,40,0.08), 0 2px 0 rgba(201,168,106,0.2)"
          : "0 28px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(201,168,106,0.18)",
      }}
    >
      {/* Filete editorial fino */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-3 sm:inset-4"
        style={{
          border: light
            ? "1px solid rgba(201,168,106,0.28)"
            : "1px solid rgba(201,168,106,0.22)",
        }}
      />
      {/* Canto dourado subtil */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-3 top-3 h-5 w-5 border-l border-t sm:left-4 sm:top-4"
        style={{ borderColor: COLORS.camel }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-3 right-3 h-5 w-5 border-b border-r sm:bottom-4 sm:right-4"
        style={{ borderColor: COLORS.camel }}
      />
      <div className="relative z-10 p-6 sm:p-10 lg:p-14">{children}</div>
    </article>
  );
}

function ActHeader({
  act,
  light,
  align = "left",
}: {
  act: StanStoryAct;
  light: boolean;
  align?: "left" | "center";
}) {
  return (
    <header
      className={`flex flex-col gap-3 ${align === "center" ? "items-center text-center" : "items-start text-left"}`}
    >
      <div className="flex items-center gap-3">
        <span
          className="font-display text-3xl font-light leading-none sm:text-4xl"
          style={{ color: COLORS.camel }}
        >
          {act.roman}
        </span>
        <span
          className="h-px w-8"
          style={{ backgroundColor: COLORS.camel }}
          aria-hidden
        />
        <span
          className="font-body text-[10px] font-semibold uppercase tracking-[0.36em]"
          style={{ color: light ? COLORS.slate : "rgba(201,168,106,0.85)" }}
        >
          Acto {act.actNumber} · {act.age}
        </span>
      </div>
      <h3
        className="font-display text-[clamp(1.85rem,4.2vw,2.85rem)] font-light leading-tight"
        style={{ color: light ? COLORS.navy : COLORS.warmBeige }}
      >
        {act.title}
      </h3>
      {act.text ? (
        <p
          className="max-w-lg font-body text-sm font-light leading-relaxed sm:text-[15px]"
          style={{
            color: light ? COLORS.inkSoft : "rgba(247,244,239,0.78)",
          }}
        >
          {act.text}
        </p>
      ) : null}
    </header>
  );
}

/**
 * Card-capa — o card que forma / enquadra a história
 * Antes dos actos: a promessa editorial.
 */
function StoryCoverCard() {
  return (
    <section
      id={STAN_STORY_PROLOGUE.id}
      aria-labelledby="stan-story-title"
      className="relative w-full scroll-mt-24 px-4 pb-16 pt-6 sm:scroll-mt-28 sm:px-6 sm:pb-24 sm:pt-8 md:pb-28"
      style={{ backgroundColor: COLORS.warmBeige }}
    >
      {/* Entrada suave a partir do Hero */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-20"
        style={{
          background:
            "linear-gradient(180deg, rgba(5,10,18,0.06) 0%, transparent 100%)",
        }}
      />

      <Reveal className="relative mx-auto max-w-3xl">
        <EditorialCard tone="light">
          <div className="flex flex-col items-center px-2 py-6 text-center sm:py-10">
            <span
              className="font-body text-[10px] font-semibold uppercase tracking-[0.48em]"
              style={{ color: COLORS.camel }}
            >
              {STAN_STORY_PROLOGUE.mark}
            </span>

            <div
              className="mt-7 h-px w-14"
              style={{ backgroundColor: COLORS.camel }}
              aria-hidden
            />

            <p
              className="mt-8 max-w-md font-display text-[clamp(1.25rem,3.2vw,1.75rem)] font-light leading-snug"
              style={{ color: COLORS.navy }}
            >
              {STAN_STORY_PROLOGUE.lead}
            </p>

            <p
              className="mt-8 font-body text-[11px] font-semibold uppercase tracking-[0.34em]"
              style={{ color: COLORS.camel }}
            >
              {STAN_STORY_PROLOGUE.line}
            </p>

            <h2
              id="stan-story-title"
              className="mt-10 font-display text-[clamp(1.75rem,4.5vw,2.75rem)] font-light leading-tight"
              style={{ color: COLORS.navy }}
            >
              {STAN_STORY_PROLOGUE.sectionTitle}
            </h2>

            {/* Índice editorial dos cinco actos */}
            <ol className="mt-12 flex w-full max-w-md flex-col gap-0 border-t border-[#C9A86A]/25">
              {STAN_STORY_ACTS.map((act) => (
                <li key={act.id}>
                  <a
                    href={`#${act.id}`}
                    className="group flex items-baseline justify-between gap-4 border-b border-[#C9A86A]/20 py-3.5 text-left transition hover:bg-[#C9A86A]/06"
                  >
                    <span className="flex items-baseline gap-3">
                      <span
                        className="font-display text-lg font-light tabular-nums"
                        style={{ color: COLORS.camel }}
                      >
                        {act.roman}
                      </span>
                      <span
                        className="font-body text-sm font-light transition group-hover:text-[#0A1628]"
                        style={{ color: COLORS.inkSoft }}
                      >
                        {act.title}
                      </span>
                    </span>
                    <span
                      className="shrink-0 font-body text-[10px] uppercase tracking-[0.2em]"
                      style={{ color: COLORS.slate }}
                    >
                      {act.age}
                    </span>
                  </a>
                </li>
              ))}
            </ol>

            <p
              className="mt-10 max-w-sm font-display text-sm font-light italic leading-relaxed"
              style={{ color: COLORS.inkSoft }}
            >
              Folheie os cinco actos. Cada imagem é um momento. Juntos, formam a
              história de um pequeno campeão.
            </p>
          </div>
        </EditorialCard>
      </Reveal>
    </section>
  );
}

/** Acto I — retrato íntimo */
function ActCardIntimate({ act }: { act: StanStoryAct }) {
  const support = act.supportingImages?.[0];
  return (
    <EditorialCard id={act.id} tone="light">
      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
        <Reveal className="relative lg:col-span-7">
          <span
            aria-hidden
            className="pointer-events-none absolute -right-2 -top-6 z-0 select-none font-display font-light leading-none text-[#0A1628]/[0.06] sm:-top-10"
            style={{ fontSize: "clamp(5rem, 18vw, 11rem)" }}
          >
            {act.roman}
          </span>
          <StoryImage
            image={act.heroImage}
            className="relative z-10 aspect-[3/4] w-full"
            sizes="(max-width: 1024px) 100vw, 55vw"
            priority
          />
        </Reveal>
        <div className="flex flex-col gap-8 lg:col-span-5">
          <Reveal delay={0.1}>
            <ActHeader act={act} light />
          </Reveal>
          {support ? (
            <Reveal delay={0.18} className="w-[58%] self-end sm:w-[48%]">
              <StoryImage
                image={support}
                className="aspect-[3/4] w-full"
                sizes="220px"
              />
            </Reveal>
          ) : null}
        </div>
      </div>
    </EditorialCard>
  );
}

/** Acto II — duo assimétrico */
function ActCardDuo({ act }: { act: StanStoryAct }) {
  const support = act.supportingImages?.[0];
  return (
    <EditorialCard id={act.id} tone="dark">
      <Reveal>
        <ActHeader act={act} light={false} />
      </Reveal>
      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-12 sm:gap-6">
        <Reveal delay={0.08} className="sm:col-span-7">
          <StoryImage
            image={act.heroImage}
            className="aspect-[3/4] w-full"
            sizes="(max-width: 640px) 100vw, 55vw"
          />
        </Reveal>
        {support ? (
          <Reveal
            delay={0.16}
            className="flex flex-col justify-end gap-3 sm:col-span-5 sm:translate-y-10"
          >
            <StoryImage
              image={support}
              className="aspect-square w-full"
              sizes="(max-width: 640px) 100vw, 35vw"
            />
            {support.caption ? (
              <p
                className="font-display text-sm italic"
                style={{ color: "rgba(247,244,239,0.65)" }}
              >
                {support.caption}
              </p>
            ) : null}
          </Reveal>
        ) : null}
      </div>
    </EditorialCard>
  );
}

/** Acto III — movimento cinematográfico */
function ActCardCinematic({ act }: { act: StanStoryAct }) {
  const supports = act.supportingImages ?? [];
  const reduce = useReducedMotion();
  return (
    <EditorialCard id={act.id} tone="light">
      <Reveal>
        <ActHeader act={act} light />
      </Reveal>
      <Reveal delay={0.1} className="mt-10">
        <motion.div
          className="relative aspect-[16/10] w-full overflow-hidden sm:aspect-[21/9]"
          initial={reduce ? false : { clipPath: "inset(0 10% 0 10%)" }}
          whileInView={{ clipPath: "inset(0 0% 0 0%)" }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 1.15, ease: EASE }}
        >
          <StoryImage
            image={act.heroImage}
            className="absolute inset-0 h-full w-full"
            sizes="100vw"
          />
        </motion.div>
      </Reveal>
      {supports.length > 0 ? (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4">
          {supports.slice(0, 2).map((img, i) => (
            <Reveal key={img.id} delay={0.08 + i * 0.08}>
              <StoryImage
                image={img}
                className="aspect-[4/5] w-full"
                sizes="(max-width: 640px) 50vw, 320px"
              />
            </Reveal>
          ))}
        </div>
      ) : null}
    </EditorialCard>
  );
}

/** Acto IV — mosaico (herói a full-width quando não há apoios) */
function ActCardMosaic({ act }: { act: StanStoryAct }) {
  const [a, b] = act.supportingImages ?? [];
  const hasSupport = Boolean(a || b);
  return (
    <EditorialCard id={act.id} tone="dark">
      <Reveal>
        <ActHeader act={act} light={false} />
      </Reveal>
      <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-12 sm:gap-4">
        <Reveal
          delay={0.08}
          className={
            hasSupport
              ? "sm:col-span-7 sm:row-span-2"
              : "mx-auto w-full max-w-lg sm:col-span-12 sm:max-w-xl"
          }
        >
          <StoryImage
            image={act.heroImage}
            className="aspect-[3/4] w-full sm:aspect-[4/5]"
            sizes={
              hasSupport
                ? "(max-width: 640px) 100vw, 55vw"
                : "(max-width: 640px) 100vw, 520px"
            }
          />
        </Reveal>
        {a ? (
          <Reveal delay={0.14} className="sm:col-span-5">
            <StoryImage
              image={a}
              className="aspect-[16/10] w-full"
              sizes="(max-width: 640px) 100vw, 40vw"
            />
          </Reveal>
        ) : null}
        {b ? (
          <Reveal delay={0.2} className="sm:col-span-5">
            <StoryImage
              image={b}
              className="aspect-square w-full sm:aspect-[4/5]"
              sizes="(max-width: 640px) 100vw, 35vw"
            />
          </Reveal>
        ) : null}
      </div>
    </EditorialCard>
  );
}

/** Acto V — finale: um herói + um momento de alegria (sem repetir a mesma foto) */
function ActCardFinale({ act }: { act: StanStoryAct }) {
  const side = act.supportingImages?.[0] ?? null;
  return (
    <EditorialCard id={act.id} tone="light">
      <Reveal>
        <ActHeader act={act} light align="center" />
      </Reveal>

      <div className="relative mx-auto mt-10 max-w-2xl">
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[42%] z-0 -translate-x-1/2 -translate-y-1/2 select-none font-display font-light leading-none text-[#0A1628]/[0.05]"
          style={{ fontSize: "clamp(8rem, 28vw, 14rem)" }}
        >
          {act.roman}
        </span>

        <div className="relative z-10 flex flex-col items-center gap-5 sm:flex-row sm:items-end sm:justify-center sm:gap-6">
          <Reveal delay={0.1} className="w-full max-w-md sm:max-w-[58%]">
            <StoryImage
              image={act.heroImage}
              className="aspect-[3/4] w-full shadow-[0_24px_60px_rgba(10,22,40,0.12)]"
              sizes="(max-width: 640px) 90vw, 420px"
            />
          </Reveal>

          {side ? (
            <Reveal delay={0.2} className="w-[72%] max-w-[220px] sm:mb-8 sm:w-[34%] sm:max-w-none">
              <StoryImage
                image={side}
                className="aspect-[3/4] w-full shadow-[0_16px_40px_rgba(10,22,40,0.1)]"
                sizes="220px"
              />
            </Reveal>
          ) : null}
        </div>
      </div>

      <Reveal delay={0.28}>
        <div className="mx-auto mt-14 max-w-lg text-center sm:mt-16">
          <div className="flex items-center justify-center gap-4" aria-hidden>
            <span
              className="h-px w-10 sm:w-14"
              style={{ backgroundColor: "rgba(201,168,106,0.55)" }}
            />
            <span className="font-body text-[9px] font-semibold uppercase tracking-[0.42em] text-[#C9A86A] sm:text-[10px]">
              {STAN_STORY_EPILOGUE.eyebrow}
            </span>
            <span
              className="h-px w-10 sm:w-14"
              style={{ backgroundColor: "rgba(201,168,106,0.55)" }}
            />
          </div>

          <p
            className="mt-6 font-display text-[clamp(1.45rem,3.6vw,2.15rem)] font-light leading-[1.25] tracking-[-0.01em]"
            style={{ color: COLORS.navy }}
          >
            {STAN_STORY_EPILOGUE.text}
          </p>

          <p className="mt-5 font-display text-[clamp(1rem,2.2vw,1.2rem)] font-light italic leading-snug text-[#0A1628]/55">
            {STAN_STORY_EPILOGUE.line}
          </p>

          <div
            className="mx-auto mt-8 h-px w-12"
            style={{ backgroundColor: COLORS.camel }}
            aria-hidden
          />
        </div>
      </Reveal>
    </EditorialCard>
  );
}

function ActCard({ act }: { act: StanStoryAct }) {
  switch (act.layout) {
    case "intimate-portrait":
      return <ActCardIntimate act={act} />;
    case "asymmetric-duo":
      return <ActCardDuo act={act} />;
    case "cinematic-landscape":
      return <ActCardCinematic act={act} />;
    case "editorial-mosaic":
      return <ActCardMosaic act={act} />;
    case "champion-finale":
      return <ActCardFinale act={act} />;
    default: {
      const _exhaustive: never = act.layout;
      return _exhaustive;
    }
  }
}

/**
 * História Editorial — Os Cinco Actos
 * Card-capa + cinco cards editoriais que formam a narrativa.
 * Isolado ao perfil stan-real-madrid.
 */
export function StanStoryEditorial() {
  return (
    <div
      data-stan-story="cinco-actos-editoriais"
      className="relative"
      style={{ backgroundColor: COLORS.warmBeige }}
    >
      <StoryCoverCard />

      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 pb-20 sm:gap-14 sm:px-6 sm:pb-28 md:gap-16">
        {STAN_STORY_ACTS.map((act, index) => (
          <Reveal key={act.id} delay={0.04} y={40}>
            <div className="relative">
              {/* Ligação narrativa entre cards */}
              {index > 0 ? (
                <div
                  aria-hidden
                  className="absolute -top-7 left-1/2 hidden h-7 w-px -translate-x-1/2 sm:-top-9 sm:block sm:h-9"
                  style={{
                    background:
                      "linear-gradient(180deg, transparent, rgba(201,168,106,0.55))",
                  }}
                />
              ) : null}
              <ActCard act={act} />
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
