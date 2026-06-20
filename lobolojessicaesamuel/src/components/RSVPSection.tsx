"use client";

import { motion } from "motion/react";
import { fadeUp, fadeIn, staggerContainer, defaultViewport } from "@/lib/animations";

const WHATSAPP_NUMBER = "258XXXXXXXXX"; // Replace with actual number
const WHATSAPP_MESSAGE = encodeURIComponent(
  "Olá! Confirmo a minha presença no Lobolo de Jessica e Samuel. 🤍"
);
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

export default function RSVPSection() {
  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      className="section-padding relative overflow-hidden"
      id="rsvp"
      style={{ backgroundColor: "#1C1410" }}
    >
      {/* Warm glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, rgba(230,126,34,0.04) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-2xl px-6 text-center md:px-8">
        <motion.span
          variants={fadeUp}
          className="mb-6 inline-block font-body text-[10px] font-medium uppercase tracking-[0.35em] md:text-xs"
          style={{ color: "#E67E22" }}
        >
          Presença
        </motion.span>

        {/* Divider */}
        <motion.div variants={fadeIn} className="mx-auto mb-10 flex items-center justify-center gap-3">
          <div className="h-px w-16" style={{ backgroundImage: "linear-gradient(to right, transparent, rgba(200,162,74,0.3))" }} />
          <div className="h-2 w-2 rotate-45 border" style={{ borderColor: "rgba(200,162,74,0.4)" }} />
          <div className="h-px w-16" style={{ backgroundImage: "linear-gradient(to left, transparent, rgba(200,162,74,0.3))" }} />
        </motion.div>

        <motion.h2
          variants={fadeUp}
          className="mb-4 font-display text-2xl md:text-3xl lg:text-4xl"
          style={{ color: "#F0E6D0" }}
        >
          Confirme a sua Presença
        </motion.h2>

        <motion.p
          variants={fadeUp}
          className="mb-10 font-body text-sm font-light leading-relaxed md:text-base"
          style={{ color: "rgba(212,184,106,0.6)" }}
        >
          Ficaremos honrados com a sua presença neste momento tão especial.
          <br />
          Confirme através do WhatsApp.
        </motion.p>

        {/* WhatsApp CTA Button */}
        <motion.div variants={fadeUp}>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-3 rounded-sm px-10 py-4 font-body text-xs font-medium uppercase tracking-[0.2em] transition-all duration-400 md:text-sm"
            id="rsvp-whatsapp-btn"
            style={{
              background: "linear-gradient(135deg, #A8853A, #C8A24A, #D4B86A)",
              color: "#1C1410",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.03)";
              e.currentTarget.style.boxShadow = "0 8px 35px rgba(230,126,34,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {/* WhatsApp icon */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="transition-transform duration-300 group-hover:scale-110"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Confirmar via WhatsApp
          </a>
        </motion.div>

        {/* Bottom note */}
        <motion.p
          variants={fadeUp}
          className="mt-8 font-body text-[10px] font-light tracking-wider"
          style={{ color: "rgba(212,184,106,0.35)" }}
        >
          Agradecemos a confirmação até 15 de Agosto de 2026
        </motion.p>
      </div>
    </motion.section>
  );
}
