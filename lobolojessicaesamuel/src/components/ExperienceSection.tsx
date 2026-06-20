"use client";

import { motion } from "motion/react";
import AfricanPattern from "./AfricanPattern";
import { fadeUp, fadeIn, staggerContainer, defaultViewport } from "@/lib/animations";

export default function ExperienceSection() {
  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      className="section-padding relative overflow-hidden"
      id="experience"
      style={{ backgroundColor: "#1C1410" }}
    >
      {/* Subtle tribal accents */}
      <div className="absolute left-0 top-0 h-full w-[6%] opacity-15">
        <AfricanPattern
          variant="zigzag-strip"
          className="h-full w-full"
          color="#E67E22"
          opacity={0.5}
        />
      </div>
      <div className="absolute right-0 top-0 h-full w-[6%] opacity-15">
        <AfricanPattern
          variant="zigzag-strip"
          className="h-full w-full"
          color="#E67E22"
          opacity={0.5}
        />
      </div>

      {/* Floating decorative elements — slow, elegant */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          animate={{ y: [0, -15, 0], rotate: [0, 45, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-[15%] top-[15%] h-8 w-8 rotate-45 border md:h-12 md:w-12"
          style={{ borderColor: "rgba(230,126,34,0.12)" }}
        />
        <motion.div
          animate={{ y: [0, -10, 0], rotate: [45, 90, 45] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[20%] left-[20%] h-5 w-5 rotate-45 border"
          style={{ borderColor: "rgba(200,162,74,0.1)" }}
        />
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[30%] right-[12%] h-3 w-3 rounded-full"
          style={{ backgroundColor: "rgba(230,126,34,0.1)" }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center md:px-8">
        {/* Badge */}
        <motion.span
          variants={fadeUp}
          className="mb-8 inline-block font-body text-[10px] font-medium uppercase tracking-[0.4em] md:text-xs"
          style={{ color: "#E67E22" }}
        >
          A Experiência
        </motion.span>

        {/* Main quote */}
        <motion.blockquote variants={fadeUp} className="mb-10">
          <p
            className="font-display text-xl font-normal italic leading-relaxed md:text-2xl lg:text-3xl"
            style={{ color: "#F0E6D0" }}
          >
            &ldquo;Cada detalhe foi pensado como uma experiência
            com assinatura própria.&rdquo;
          </p>
        </motion.blockquote>

        {/* Divider */}
        <motion.div variants={fadeIn} className="mx-auto mb-10 flex items-center justify-center gap-3">
          <div className="h-px w-16" style={{ backgroundImage: "linear-gradient(to right, transparent, rgba(230,126,34,0.3))" }} />
          <div className="flex gap-1">
            <div className="h-1 w-1 rounded-full" style={{ backgroundColor: "rgba(230,126,34,0.4)" }} />
            <div className="h-1 w-1 rounded-full" style={{ backgroundColor: "rgba(200,162,74,0.5)" }} />
            <div className="h-1 w-1 rounded-full" style={{ backgroundColor: "rgba(230,126,34,0.4)" }} />
          </div>
          <div className="h-px w-16" style={{ backgroundImage: "linear-gradient(to left, transparent, rgba(230,126,34,0.3))" }} />
        </motion.div>

        {/* HAXR Signature */}
        <motion.div variants={fadeUp}>
          <p
            className="font-display text-sm tracking-[0.3em] md:text-base"
            style={{ color: "rgba(230,126,34,0.6)" }}
          >
            HAXR
          </p>
          <p
            className="font-script text-2xl md:text-3xl"
            style={{ color: "rgba(212,184,106,0.4)" }}
          >
            Signature
          </p>
        </motion.div>
      </div>
    </motion.section>
  );
}
