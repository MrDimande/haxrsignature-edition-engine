"use client";

import { motion } from "motion/react";
import GoldDivider from "./GoldDivider";
import { fadeUp, staggerContainer, defaultViewport } from "@/lib/animations";

interface DetailItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  href?: string;
}

function DetailItem({ icon, label, value, subValue, href }: DetailItemProps) {
  const Content = (
    <motion.div
      variants={fadeUp}
      className="flex flex-col items-center text-center"
    >
      <div className="mb-4 text-gold/60">{icon}</div>
      <span className="mb-2 font-body text-[9px] font-medium uppercase tracking-[0.3em] text-gold">
        {label}
      </span>
      <p className="font-display text-lg text-charcoal md:text-xl">{value}</p>
      {subValue && (
        <p className="mt-1 font-body text-xs font-light text-warm-gray">
          {subValue}
        </p>
      )}
    </motion.div>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group transition-all duration-300 hover:scale-[1.02]"
      >
        {Content}
        <span className="mt-2 block font-body text-[10px] font-light text-gold/50 underline underline-offset-2 transition-colors group-hover:text-gold">
          Ver no mapa →
        </span>
      </a>
    );
  }

  return Content;
}

export default function DetailsSection() {
  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      className="section-padding relative overflow-hidden bg-ivory"
      id="details"
    >
      <div className="mx-auto max-w-4xl px-6 md:px-8">
        {/* Header */}
        <motion.div variants={fadeUp} className="mb-16 text-center">
          <span className="mb-6 inline-block font-body text-[10px] font-medium uppercase tracking-[0.35em] text-gold md:text-xs">
            Detalhes
          </span>

          <GoldDivider withSpringFloral className="mx-auto mb-8 max-w-xs" />

          <h2 className="font-display text-2xl text-charcoal md:text-3xl lg:text-4xl">
            Informações do Evento
          </h2>
        </motion.div>

        {/* Detail cards grid */}
        <div className="gold-border-thin gold-glow rounded-sm bg-white p-8 md:p-12">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            {/* Date */}
            <DetailItem
              label="Data"
              value="29 de Agosto"
              subValue="Sábado, 2026"
              icon={
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                  <circle cx="12" cy="16" r="1.5" fill="currentColor" />
                </svg>
              }
            />

            {/* Time */}
            <DetailItem
              label="Hora"
              value="13h30"
              subValue="Copo de Água"
              icon={
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12,6 12,12 16,14" />
                </svg>
              }
            />

            {/* Dress Code */}
            <DetailItem
              label="Dress Code"
              value="Formal"
              subValue="Elegância recomendada"
              icon={
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
                  <path d="M12 2 L8 8 L4 22 L12 18 L20 22 L16 8 Z" />
                  <circle cx="12" cy="10" r="1" fill="currentColor" />
                </svg>
              }
            />

            {/* Location */}
            <DetailItem
              label="Local"
              value="A confirmar"
              subValue="Maputo, Moçambique"
              href="https://maps.google.com/?q=Maputo,Mozambique"
              icon={
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
              }
            />
          </div>

          {/* Bottom divider */}
          <div className="mt-10 flex items-center justify-center gap-3">
            <div className="h-px w-full max-w-[100px] bg-gradient-to-r from-transparent to-gold/20" />
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1 L15 8 L8 15 L1 8 Z" stroke="#C8A24A" strokeWidth="0.5" fill="none" opacity="0.3" />
            </svg>
            <div className="h-px w-full max-w-[100px] bg-gradient-to-l from-transparent to-gold/20" />
          </div>
        </div>
      </div>
    </motion.section>
  );
}
