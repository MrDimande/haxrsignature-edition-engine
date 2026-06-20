"use client";

import { Clock, MapPin } from "lucide-react";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { DRESS_CODE, LOCATIONS } from "@/lib/event-data";

type LocationCardProps = {
  type: string;
  timeLabel?: string;
  time: string;
  name: string;
  address: string;
  mapsUrl: string;
  index: number;
};

function LocationCard({
  type,
  timeLabel,
  time,
  name,
  address,
  mapsUrl,
  index,
}: LocationCardProps) {
  return (
    <RevealOnScroll delay={index * 0.15} className="h-full">
      <article className="group flex h-full flex-col rounded-lg border border-spring-orange/20 bg-charcoal p-8 transition-all duration-500 hover:border-spring-orange/40 hover:shadow-spring-glow-sm">
        <p className="mb-2 font-montserrat text-xs uppercase tracking-[0.3em] text-spring-orange">
          {type}
        </p>

        <div className="mb-6">
          {timeLabel && (
            <p className="mb-1 font-montserrat text-[10px] uppercase tracking-[0.25em] text-gold/70">
              {timeLabel}
            </p>
          )}
          <div className="flex items-center gap-2 text-off-white">
            <Clock className="h-4 w-4 shrink-0 text-gold/70" strokeWidth={1.5} />
            <span className="font-playfair text-2xl font-semibold">{time}</span>
          </div>
        </div>

        <h3 className="mb-3 font-playfair text-xl font-bold text-off-white sm:text-2xl">
          {name}
        </h3>

        <div className="mb-8 flex flex-1 items-start gap-2 text-light-gray">
          <MapPin
            className="mt-0.5 h-4 w-4 shrink-0 text-spring-orange/60"
            strokeWidth={1.5}
          />
          <p className="font-montserrat text-sm leading-relaxed">{address}</p>
        </div>

        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-sm border border-spring-orange/60 bg-transparent px-5 py-2 font-montserrat text-xs font-semibold uppercase tracking-[0.15em] text-spring-orange transition-all duration-300 hover:border-spring-orange hover:bg-spring-orange/10 active:scale-[0.98]"
        >
          <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
          Ver no Mapa
        </a>
      </article>
    </RevealOnScroll>
  );
}

export function LocationsSection() {
  return (
    <section className="relative py-20 sm:py-28">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-spring-orange/25 to-transparent" />

      <div className="mx-auto max-w-5xl px-6">
        <RevealOnScroll className="mb-16 text-center">
          <p className="mb-3 font-montserrat text-xs uppercase tracking-[0.35em] text-spring-orange">
            O Palco do Evento
          </p>
          <h2 className="font-playfair text-3xl font-bold text-off-white sm:text-4xl md:text-5xl">
            Localização
          </h2>
        </RevealOnScroll>

        <div className="mb-12 mx-auto max-w-lg">
          {LOCATIONS.map((location, index) => (
            <LocationCard key={location.id} {...location} index={index} />
          ))}
        </div>

        <RevealOnScroll delay={0.3}>
          <div className="rounded-lg border border-spring-orange/20 bg-charcoal/50 px-6 py-5 text-center">
            <p className="mb-1 font-montserrat text-[10px] uppercase tracking-[0.3em] text-spring-orange/70">
              Dress Code
            </p>
            <p className="font-playfair text-lg italic text-off-white sm:text-xl">
              {DRESS_CODE}
            </p>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
