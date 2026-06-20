"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";
import { fadeUp, staggerContainer, defaultViewport } from "@/lib/motion";
import { COLORS } from "@/styles/tokens";

interface Pillar {
  id: string;
  num: string;
  title: string;
  subtitle: string;
  description: string;
  svgIcon: React.ReactNode;
}

export default function LoreSection() {
  const [activeId, setActiveId] = useState<string | null>("ancestralidade");

  const pillars: Pillar[] = [
    {
      id: "ancestralidade",
      num: "01",
      title: "Ancestralidade & Respeito",
      subtitle: "Honrar a nossa linhagem",
      description: "O reconhecimento solene dos que pavimentaram o caminho antes de nós. É o momento de expressar profunda gratidão à família e aos antepassados, abençoando o percurso e integrando o passado como fundação do futuro.",
      svgIcon: (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor">
          {/* Concentric rings representing roots and lineage circles */}
          <circle cx="50" cy="50" r="40" strokeWidth="0.8" strokeDasharray="3,3" />
          <circle cx="50" cy="50" r="30" strokeWidth="1" />
          <circle cx="50" cy="50" r="20" strokeWidth="0.8" strokeDasharray="2,2" />
          <circle cx="50" cy="50" r="10" strokeWidth="1.2" fill="currentColor" fillOpacity="0.15" />
          {/* Symmetrical radiating lines representing ancestral guidance */}
          <line x1="50" y1="0" x2="50" y2="10" strokeWidth="0.8" />
          <line x1="50" y1="90" x2="50" y2="100" strokeWidth="0.8" />
          <line x1="0" y1="50" x2="10" y2="50" strokeWidth="0.8" />
          <line x1="90" y1="50" x2="100" y2="50" strokeWidth="0.8" />
        </svg>
      )
    },
    {
      id: "transicao",
      num: "02",
      title: "Rito de Transição",
      subtitle: "Afirmação da identidade",
      description: "A celebração pública da maturidade, dignidade e plenitude da mulher na nossa cultura. O Kulaya consolida esta passagem de ciclo, marcando a afirmação da identidade de Jessica perante a comunidade e a família.",
      svgIcon: (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor">
          {/* Symmetrical upward rising flame/shield geometry */}
          <path d="M 50 10 L 80 50 L 50 90 L 20 50 Z" strokeWidth="1" />
          <path d="M 50 22 L 70 50 L 50 78 L 30 50 Z" strokeWidth="0.8" strokeDasharray="2,2" />
          <path d="M 50 35 L 60 50 L 50 65 L 40 50 Z" strokeWidth="1.2" fill="currentColor" fillOpacity="0.15" />
          {/* Horizon transition line */}
          <line x1="15" y1="50" x2="85" y2="50" strokeWidth="0.5" opacity="0.5" />
        </svg>
      )
    },
    {
      id: "sabedoria",
      num: "03",
      title: "Transmissão de Sabedoria",
      subtitle: "Legado e Continuidade",
      description: "A entrega simbólica da esteira, do vime e dos conselhos pelas matriarcas. Representa a transmissão viva de valores morais e saberes práticos que asseguram a continuidade, o equilíbrio e a união familiar.",
      svgIcon: (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor">
          {/* African woven textile pattern representation */}
          <rect x="20" y="20" width="60" height="60" strokeWidth="1" />
          {/* Crossing geometric diagonal lines representing weaving/connection */}
          <path d="M 20 20 L 80 80 M 80 20 L 20 80" strokeWidth="0.8" />
          <path d="M 50 20 L 50 80 M 20 50 L 80 50" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.7" />
          <circle cx="50" cy="50" r="6" fill="currentColor" />
          <circle cx="20" cy="20" r="3" fill="currentColor" />
          <circle cx="80" cy="20" r="3" fill="currentColor" />
          <circle cx="20" cy="80" r="3" fill="currentColor" />
          <circle cx="80" cy="80" r="3" fill="currentColor" />
        </svg>
      )
    }
  ];

  const handleToggle = (id: string) => {
    setActiveId(activeId === id ? null : id);
  };

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      variants={staggerContainer}
      className="relative w-full py-24 md:py-32 px-6 overflow-hidden z-10 flex flex-col items-center justify-center"
      id="lore"
      style={{ backgroundColor: COLORS.woodBrownDeep }}
    >
      <div className="max-w-4xl w-full">
        {/* Section Label */}
        <motion.span 
          variants={fadeUp}
          className="font-body text-[10px] font-light uppercase tracking-[0.45em] mb-4 block text-center"
          style={{ color: COLORS.burntGoldDark }}
        >
          OS FUNDAMENTOS
        </motion.span>

        {/* Section Title */}
        <motion.h2 
          variants={fadeUp}
          className="font-display text-3xl md:text-4xl font-extralight uppercase tracking-[0.15em] mb-16 text-[#FAF5F0] text-center"
        >
          Significado Cultural
        </motion.h2>

        {/* ─── Accordion Stack ─── */}
        <motion.div variants={fadeUp} className="border-t border-[#FAF5F0]/10 divide-y divide-[#FAF5F0]/10">
          {pillars.map((pillar) => {
            const isOpen = activeId === pillar.id;
            return (
              <div key={pillar.id} className="py-6 sm:py-8">
                {/* Header Toggle Row */}
                <button
                  onClick={() => handleToggle(pillar.id)}
                  className="w-full flex items-center justify-between text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-6 sm:gap-10">
                    {/* Index Number */}
                    <span 
                      className="font-display text-xs tracking-wider opacity-40 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ color: COLORS.burntGoldLight }}
                    >
                      {pillar.num}
                    </span>
                    {/* Title */}
                    <div>
                      <h3 className="font-display text-lg sm:text-xl font-light text-[#FAF5F0] tracking-[0.02em] group-hover:text-[#D4AF37] transition-colors duration-300">
                        {pillar.title}
                      </h3>
                      <p className="font-body text-[10px] uppercase tracking-wider text-[#FAF5F0]/30 mt-1 font-light">
                        {pillar.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Accordion Chevron Icon */}
                  <div 
                    className="p-2 border border-[#FAF5F0]/5 group-hover:border-[#D4AF37]/30 transition-colors duration-300 text-[#FAF5F0]/50 group-hover:text-[#D4AF37]"
                    style={{
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)"
                    }}
                  >
                    <ChevronDown size={14} strokeWidth={1.5} />
                  </div>
                </button>

                {/* Collapsible Content Area */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, marginTop: 0 }}
                      animate={{ 
                        height: "auto", 
                        opacity: 1, 
                        marginTop: 24,
                        transition: { height: { duration: 0.5 }, opacity: { duration: 0.4 } } 
                      }}
                      exit={{ 
                        height: 0, 
                        opacity: 0, 
                        marginTop: 0,
                        transition: { height: { duration: 0.4 }, opacity: { duration: 0.3 } } 
                      }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                        {/* Text Description */}
                        <div className="md:col-span-9">
                          <p className="font-body text-sm font-light leading-relaxed text-[#FAF5F0]/70 pl-0 sm:pl-16">
                            {pillar.description}
                          </p>
                        </div>
                        {/* Custom Gold Vector Icon */}
                        <div className="md:col-span-3 flex justify-center md:justify-end">
                          <div 
                            className="w-16 h-16 sm:w-20 sm:h-20"
                            style={{ color: COLORS.burntGoldLight, opacity: 0.85 }}
                          >
                            {pillar.svgIcon}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </motion.div>
      </div>
    </motion.section>
  );
}
