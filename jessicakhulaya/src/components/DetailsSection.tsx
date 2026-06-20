"use client";

import { defaultViewport, fadeUp, staggerContainer } from "@/lib/motion";
import { COLORS } from "@/styles/tokens";
import {
  KULAYA_VENUE,
  buildKulayaCalendarUrl,
  buildKulayaMapEmbedUrl,
} from "@lib/kulaya/event-details";
import { Calendar, Clock, Gift, MapPin, Navigation, Shirt, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

export default function DetailsSection() {
  const [isMapOpen, setIsMapOpen] = useState(false);

  const calendarUrl = buildKulayaCalendarUrl();
  const mapEmbedUrl = buildKulayaMapEmbedUrl();
  const externalMapUrl = KULAYA_VENUE.navigateUrl;

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      variants={staggerContainer}
      className="relative w-full py-28 md:py-36 px-6 overflow-hidden z-10 flex flex-col items-center justify-center border-t border-b border-[#FAF5F0]/5"
      id="details"
      style={{ backgroundColor: COLORS.woodBrownDeep }}
    >
      {/* ─── Top Fine Gold Graphic Divider ─── */}
      <motion.div 
        variants={fadeUp} 
        className="flex items-center justify-center gap-4 mb-12 w-full max-w-sm"
      >
        <div className="h-[0.5px] flex-grow bg-gradient-to-r from-transparent to-[#D4AF37]/40" />
        <div className="w-1.5 h-1.5 rotate-45 border border-[#D4AF37]/50" />
        <div className="h-[0.5px] flex-grow bg-gradient-to-l from-transparent to-[#D4AF37]/40" />
      </motion.div>

      <div className="max-w-4xl w-full text-center">
        {/* Section Label */}
        <motion.span 
          variants={fadeUp}
          className="font-body text-[10px] font-light uppercase tracking-[0.45em] mb-4 block"
          style={{ color: COLORS.burntGoldDark }}
        >
          O RITUAL
        </motion.span>

        {/* Section Title */}
        <motion.h2 
          variants={fadeUp}
          className="font-display text-3xl md:text-4xl font-extralight uppercase tracking-[0.15em] mb-8 text-[#FAF5F0]"
        >
          Tradição & Dignidade
        </motion.h2>

        {/* Narrative Paragraph */}
        <motion.p 
          variants={fadeUp}
          className="font-body text-sm md:text-base font-light leading-relaxed max-w-2xl mx-auto mb-20 text-[#FAF5F0]/70 italic"
        >
          “O Kulaya é a celebração da nossa essência, o rito de passagem que consolida o respeito pela nossa linhagem e o compromisso com a continuidade da nossa história familiar.”
        </motion.p>

        {/* ─── Row 1: Core Details (3 Columns) ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch mb-8 text-center max-w-4xl mx-auto w-full">
          {/* Date */}
          <motion.div 
            variants={fadeUp}
            className="flex flex-col items-center p-6 border border-[#FAF5F0]/5 bg-[#120A07]/30 backdrop-blur-sm relative group hover:border-[#D4AF37]/20 transition-colors duration-500"
          >
            <div className="w-10 h-10 flex items-center justify-center mb-5 text-[#D4AF37]/80">
              <Calendar size={20} strokeWidth={1} />
            </div>
            <span className="font-body text-[9px] uppercase tracking-[0.3em] text-[#FAF5F0]/40 mb-2">Data</span>
            <span className="font-display text-lg text-[#FAF5F0] font-light leading-tight">
              Sábado, 01 de<br />Agosto de 2026
            </span>
          </motion.div>

          {/* Time */}
          <motion.div 
            variants={fadeUp}
            className="flex flex-col items-center p-6 border border-[#FAF5F0]/5 bg-[#120A07]/30 backdrop-blur-sm relative group hover:border-[#D4AF37]/20 transition-colors duration-500"
          >
            <div className="w-10 h-10 flex items-center justify-center mb-5 text-[#D4AF37]/80">
              <Clock size={20} strokeWidth={1} />
            </div>
            <span className="font-body text-[9px] uppercase tracking-[0.3em] text-[#FAF5F0]/40 mb-2">Horário</span>
            <span className="font-display text-lg text-[#FAF5F0] font-light leading-tight">
              10:00 Horas<br />pontual
            </span>
          </motion.div>

          {/* Location */}
          <motion.div 
            variants={fadeUp}
            className="flex flex-col items-center p-6 border border-[#FAF5F0]/5 bg-[#120A07]/30 backdrop-blur-sm relative group hover:border-[#D4AF37]/20 transition-colors duration-500"
          >
            <div className="w-10 h-10 flex items-center justify-center mb-5 text-[#D4AF37]/80">
              <MapPin size={20} strokeWidth={1} />
            </div>
            <span className="font-body text-[9px] uppercase tracking-[0.3em] text-[#FAF5F0]/40 mb-2">Localização</span>
            <span className="font-display text-lg text-[#FAF5F0] font-light leading-tight">
              {KULAYA_VENUE.neighborhood},<br />
              Matola
            </span>
            <button
              onClick={() => setIsMapOpen(true)}
              className="mt-4 text-[9px] font-body uppercase tracking-[0.25em] text-[#D4AF37] hover:text-[#FAF5F0] transition-colors duration-300 cursor-pointer underline underline-offset-4"
            >
              Ver Local
            </button>
          </motion.div>
        </div>

        {/* ─── Row 2: Secondary Details (2 Columns) ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch mb-20 text-center max-w-3xl mx-auto w-full">
          {/* Dress Code */}
          <motion.div 
            variants={fadeUp}
            className="flex flex-col items-center p-6 border border-[#FAF5F0]/5 bg-[#120A07]/30 backdrop-blur-sm relative group hover:border-[#D4AF37]/20 transition-colors duration-500"
          >
            <div className="w-10 h-10 flex items-center justify-center mb-4 text-[#D4AF37]/80">
              <Shirt size={20} strokeWidth={1} />
            </div>
            <span className="font-body text-[9px] uppercase tracking-[0.3em] text-[#FAF5F0]/40 mb-2">Dress Code</span>
            <span className="font-display text-lg text-[#FAF5F0] font-light leading-tight">
              Blusa Branca
            </span>
            <span className="mt-3 font-body text-[9px] text-[#FAF5F0]/40 font-light max-w-[200px]">
              Solicita-se o uso de blusa branca para harmonia visual do rito.
            </span>
          </motion.div>

          {/* Sugestão de Presente */}
          <motion.div 
            variants={fadeUp}
            className="flex flex-col items-center p-6 border border-[#FAF5F0]/5 bg-[#120A07]/30 backdrop-blur-sm relative group hover:border-[#D4AF37]/20 transition-colors duration-500"
          >
            <div className="w-10 h-10 flex items-center justify-center mb-4 text-[#D4AF37]/80">
              <Gift size={20} strokeWidth={1} />
            </div>
            <span className="font-body text-[9px] uppercase tracking-[0.3em] text-[#FAF5F0]/40 mb-2">Opção de Presente</span>
            <span className="font-display text-sm text-[#FAF5F0] font-light leading-relaxed max-w-[280px]">
              Utensílio essencial para uma verdadeira dona de casa moçambicana
            </span>
            <span 
              className="mt-3 font-body text-[9.5px] font-medium leading-relaxed italic"
              style={{ color: COLORS.burntGoldLight }}
            >
              *NB: Cada convidada terá que explicar a utilidade do utensílio.*
            </span>
          </motion.div>
        </div>

        {/* ─── Add To Calendar Action ─── */}
        <motion.div variants={fadeUp}>
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-6 py-3 border border-[#FAF5F0]/20 text-[#FAF5F0] hover:text-[#120A07] hover:border-[#D4AF37] hover:bg-[#D4AF37] font-body text-[10px] uppercase tracking-[0.25em] font-light transition-all duration-500 ease-[0.16,1,0.3,1] cursor-pointer"
          >
            Adicionar ao Calendário
          </a>
        </motion.div>
      </div>

      {/* ─── Bottom Fine Gold Graphic Divider ─── */}
      <motion.div 
        variants={fadeUp} 
        className="flex items-center justify-center gap-4 mt-20 w-full max-w-sm"
      >
        <div className="h-[0.5px] flex-grow bg-gradient-to-r from-transparent to-[#D4AF37]/40" />
        <div className="w-1.5 h-1.5 rotate-45 border border-[#D4AF37]/50" />
        <div className="h-[0.5px] flex-grow bg-gradient-to-l from-transparent to-[#D4AF37]/40" />
      </motion.div>

      {/* ─── Immersive Location Map Modal ─── */}
      <AnimatePresence>
        {isMapOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
            {/* Backdrop cover overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMapOpen(false)}
              className="absolute inset-0 bg-[#120A07]/80 backdrop-blur-lg"
            />

            {/* Modal Body Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-3xl bg-[#1E100A] border border-[#D4AF37]/20 p-6 md:p-8 z-10 shadow-2xl flex flex-col md:grid md:grid-cols-12 gap-6"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsMapOpen(false)}
                className="absolute top-4 right-4 text-[#FAF5F0]/60 hover:text-[#D4AF37] transition-colors duration-300 p-1 border border-transparent hover:border-[#D4AF37]/20 cursor-pointer"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>

              {/* Left Side: Address Details & Driving directions */}
              <div className="md:col-span-5 flex flex-col justify-between text-left space-y-6 pt-4">
                <div>
                  <span className="text-[9px] font-body uppercase tracking-[0.25em] text-[#D4AF37]">
                    Endereço
                  </span>
                  <h3 className="font-display text-xl text-[#FAF5F0] font-light mt-2 leading-snug">
                    {KULAYA_VENUE.venueName}
                    <br />
                    {KULAYA_VENUE.neighborhood}
                  </h3>
                  <p className="font-body text-xs text-[#FAF5F0]/70 mt-3 font-light leading-relaxed">
                    {KULAYA_VENUE.city}
                  </p>
                </div>

                <div>
                  <span className="text-[9px] font-body uppercase tracking-[0.25em] text-[#D4AF37]">
                    Direcções
                  </span>
                  <p className="font-body text-[11px] text-[#FAF5F0]/60 mt-2 font-light leading-relaxed">
                    Cerimónia na residência da Jessica. Use o botão abaixo para abrir a localização exacta no Google Maps.
                  </p>
                </div>

                <a
                  href={externalMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-3 w-full py-3.5 border border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#120A07] font-body text-[9px] uppercase tracking-[0.2em] font-medium transition-all duration-500 cursor-pointer"
                >
                  <Navigation size={10} />
                  Navegar no Mapa
                </a>
              </div>

              {/* Right Side: Stylized Google Map Frame */}
              <div className="md:col-span-7 h-60 sm:h-72 md:h-full min-h-[250px] relative border border-[#FAF5F0]/5 overflow-hidden">
                <iframe
                  title={`${KULAYA_VENUE.venueName} — ${KULAYA_VENUE.neighborhood}`}
                  src={mapEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ 
                    border: 0,
                    // Masterstroke Creative Filter: Tints map to custom dark terracotta and gold shades
                    filter: "grayscale(1) invert(0.9) sepia(0.55) hue-rotate(335deg) saturate(1.8) contrast(1.15) brightness(0.95)"
                  }}
                  allowFullScreen={false}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
