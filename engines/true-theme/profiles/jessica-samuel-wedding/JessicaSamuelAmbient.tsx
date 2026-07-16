"use client";

import { motion } from "motion/react";

import { JS_SURFACES } from "./jessica-samuel-surfaces";

export function JessicaSamuelAmbient() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${JS_SURFACES.ivory} 0%, ${JS_SURFACES.champagne} 48%, ${JS_SURFACES.champagne} 100%)`,
        }}
      />
      <motion.div
        className="absolute -top-1/4 -right-1/4 w-[70vw] h-[70vw] rounded-full blur-3xl"
        animate={{ opacity: [0.1, 0.16, 0.1], scale: [1, 1.05, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        style={{ backgroundColor: JS_SURFACES.champagneDeep }}
      />
      <motion.div
        className="absolute -bottom-1/3 -left-1/4 w-[60vw] h-[60vw] rounded-full blur-3xl"
        animate={{ opacity: [0.06, 0.12, 0.06] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        style={{ backgroundColor: JS_SURFACES.rose }}
      />
    </div>
  );
}
