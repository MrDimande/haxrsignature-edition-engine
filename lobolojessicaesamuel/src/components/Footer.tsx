"use client";

import { motion } from "motion/react";
import AfricanPattern from "./AfricanPattern";
import { fadeUp, fadeIn, staggerContainer, defaultViewport } from "@/lib/animations";
import {
  HAXR_AUTH,
  formatCopyrightShort,
  formatStudioCredit,
} from "@lib/brand/authorship";

export default function Footer() {
  return (
    <motion.footer
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      className="relative overflow-hidden pb-12 pt-16 md:pb-16 md:pt-24"
      id="footer"
      style={{ backgroundColor: "#1C1410" }}
    >
      {/* Subtle tribal accents — both sides */}
      <div className="absolute left-0 top-0 h-full w-[5%] opacity-10">
        <AfricanPattern variant="zigzag-strip" className="h-full w-full" color="#E67E22" opacity={0.4} />
      </div>
      <div className="absolute right-0 top-0 h-full w-[5%] opacity-10">
        <AfricanPattern variant="zigzag-strip" className="h-full w-full" color="#E67E22" opacity={0.4} />
      </div>

      {/* Top gold line */}
      <motion.div
        variants={fadeIn}
        className="mx-auto mb-12 h-px w-24 md:mb-16"
        style={{ backgroundImage: "linear-gradient(to right, transparent, rgba(200,162,74,0.3), transparent)" }}
      />

      <div className="relative z-10 mx-auto max-w-2xl px-6 text-center md:px-8">
        {/* Quote */}
        <motion.p
          variants={fadeUp}
          className="mb-8 font-display text-lg italic md:text-xl lg:text-2xl"
          style={{ color: "rgba(240,230,208,0.8)" }}
        >
          &ldquo;{HAXR_AUTH.motto}&rdquo;
        </motion.p>

        {/* HAXR Signature */}
        <motion.div variants={fadeUp} className="mb-8">
          <p
            className="font-display text-xs tracking-[0.35em] md:text-sm"
            style={{ color: "rgba(230,126,34,0.5)" }}
          >
            HAXR
          </p>
          <p
            className="font-script text-xl md:text-2xl"
            style={{ color: "rgba(212,184,106,0.3)" }}
          >
            Signature
          </p>
        </motion.div>

        {/* Bottom divider */}
        <motion.div variants={fadeIn} className="mx-auto mb-6 flex items-center justify-center gap-3">
          <div className="h-px w-8" style={{ backgroundColor: "rgba(230,126,34,0.15)" }} />
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1 L11 6 L6 11 L1 6 Z" stroke="#E67E22" strokeWidth="0.5" fill="none" opacity="0.3" />
          </svg>
          <div className="h-px w-8" style={{ backgroundColor: "rgba(230,126,34,0.15)" }} />
        </motion.div>

        {/* Year */}
        <motion.div variants={fadeUp}>
          <p
            className="font-body text-[10px] font-light tracking-[0.25em]"
            style={{ color: "rgba(212,184,106,0.3)" }}
          >
            PRIMAVERA 2026
          </p>
        </motion.div>

        {/* Couple names echo */}
        <motion.p
          variants={fadeUp}
          className="mt-6 font-body text-[9px] font-light tracking-[0.18em]"
          style={{ color: "rgba(212,184,106,0.25)" }}
        >
          {formatStudioCredit()} · {formatCopyrightShort()}
        </motion.p>
      </div>
    </motion.footer>
  );
}
