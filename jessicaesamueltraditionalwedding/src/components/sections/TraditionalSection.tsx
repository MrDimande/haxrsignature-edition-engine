"use client";

import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { PARENTS, TRADITIONAL_SECTION } from "@/lib/event-data";

function ImagePlaceholder({ label }: { label: string }) {
  return (
    <div className="group relative aspect-[4/5] overflow-hidden rounded-lg border border-spring-orange/25 bg-charcoal">
      <div
        className="absolute inset-0 opacity-50 transition-opacity duration-700 group-hover:opacity-70"
        style={{
          backgroundImage: `
            radial-gradient(circle at 30% 40%, rgba(232, 119, 34, 0.18) 0%, transparent 55%),
            radial-gradient(circle at 70% 70%, rgba(212, 175, 55, 0.12) 0%, transparent 50%),
            linear-gradient(135deg, #111111 0%, #1a1a1a 50%, #111111 100%)
          `,
        }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
        <div className="h-px w-12 bg-gradient-to-r from-transparent via-spring-orange/50 to-transparent" />
        <span className="font-montserrat text-[10px] uppercase tracking-[0.25em] text-spring-orange/60">
          {label}
        </span>
        <div className="h-px w-12 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      </div>
      <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-spring-orange/10 transition-all duration-500 group-hover:ring-spring-orange/30" />
    </div>
  );
}

function ParentsCard({
  label,
  names,
  delay,
}: {
  label: string;
  names: readonly string[];
  delay: number;
}) {
  return (
    <RevealOnScroll delay={delay}>
      <div className="rounded-lg border border-spring-orange/20 bg-charcoal/80 p-6 backdrop-blur-sm">
        <p className="mb-4 font-montserrat text-[10px] uppercase tracking-[0.3em] text-spring-orange">
          {label}
        </p>
        <ul className="space-y-2">
          {names.map((name) => (
            <li
              key={name}
              className="font-playfair text-base text-off-white sm:text-lg"
            >
              {name}
            </li>
          ))}
        </ul>
      </div>
    </RevealOnScroll>
  );
}

export function TraditionalSection() {
  return (
    <section
      id="traditional"
      className="relative overflow-hidden py-20 sm:py-28 lg:py-32"
    >
      {/* Spring accent glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 0% 50%, rgba(232, 119, 34, 0.06) 0%, transparent 50%),
            radial-gradient(ellipse at 100% 30%, rgba(212, 175, 55, 0.05) 0%, transparent 40%)
          `,
        }}
      />

      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-spring-orange/30 to-transparent" />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <RevealOnScroll>
              <p className="mb-3 font-montserrat text-xs uppercase tracking-[0.35em] text-spring-orange">
                {TRADITIONAL_SECTION.title}
              </p>
            </RevealOnScroll>

            <RevealOnScroll delay={0.1}>
              <h2 className="mb-4 font-playfair text-4xl font-bold text-off-white sm:text-5xl lg:text-6xl">
                {TRADITIONAL_SECTION.subtitle}
              </h2>
            </RevealOnScroll>

            <RevealOnScroll delay={0.15}>
              <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-spring-orange/30 bg-spring-orange/5 px-4 py-2">
                <span className="font-montserrat text-[10px] uppercase tracking-[0.25em] text-light-gray">
                  Tema
                </span>
                <span className="font-playfair text-sm italic text-spring-orange">
                  {TRADITIONAL_SECTION.theme}
                </span>
                <span className="hidden h-3 w-px bg-spring-orange/30 sm:block" />
                <span className="hidden font-montserrat text-[10px] tracking-wider text-gold/80 sm:inline">
                  Laranja · Dourado · Branco
                </span>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={0.2}>
              <div className="mb-8 h-px w-16 bg-gradient-to-r from-spring-orange/60 to-gold/40" />
            </RevealOnScroll>

            {TRADITIONAL_SECTION.paragraphs.map((paragraph, index) => (
              <RevealOnScroll key={index} delay={0.25 + index * 0.1}>
                <p className="mb-6 font-montserrat text-base leading-relaxed text-light-gray last:mb-0 sm:text-lg">
                  {paragraph}
                </p>
              </RevealOnScroll>
            ))}

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <ParentsCard
                label={PARENTS.bride.label}
                names={PARENTS.bride.names}
                delay={0.45}
              />
              <ParentsCard
                label={PARENTS.groom.label}
                names={PARENTS.groom.names}
                delay={0.55}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <RevealOnScroll delay={0.2} direction="left">
              <ImagePlaceholder label="Primavera" />
            </RevealOnScroll>
            <RevealOnScroll delay={0.35} direction="right" className="mt-8 sm:mt-12">
              <ImagePlaceholder label="Lobolo" />
            </RevealOnScroll>
          </div>
        </div>
      </div>
    </section>
  );
}
