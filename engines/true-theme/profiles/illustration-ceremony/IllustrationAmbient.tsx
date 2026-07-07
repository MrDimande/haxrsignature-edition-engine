"use client";

import { motion } from "motion/react";
import { useExperience } from "../../context";
import {
  FloatingLily,
  FloatingRose,
  FabricDrape,
} from "../../illustrations/BrideIllustrations";

export function IllustrationAmbient() {
  const { theme } = useExperience();
  const accent = theme.colors.accent;

  const petals = [
    { x: "8%", y: "12%", delay: 0, type: "rose" as const },
    { x: "85%", y: "18%", delay: 0.4, type: "lily" as const },
    { x: "72%", y: "55%", delay: 0.8, type: "rose" as const },
    { x: "15%", y: "68%", delay: 1.2, type: "lily" as const },
    { x: "45%", y: "85%", delay: 0.6, type: "rose" as const },
    { x: "92%", y: "78%", delay: 1.5, type: "lily" as const },
  ];

  return (
    <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(165deg, ${theme.colors.background} 0%, #FFE8EF 45%, ${theme.colors.background} 100%)`,
        }}
      />
      <FabricDrape className="absolute top-0 left-0 w-full h-32 opacity-60" accent={accent} />
      <FabricDrape className="absolute bottom-0 left-0 w-full h-32 opacity-40 rotate-180" accent={accent} />

      {petals.map((petal, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: petal.x, top: petal.y }}
          animate={{ y: [0, -18, 0], rotate: [0, 8, -8, 0], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 6 + i, repeat: Infinity, delay: petal.delay, ease: "easeInOut" }}
        >
          {petal.type === "rose" ? (
            <FloatingRose className="w-10 h-10 md:w-14 md:h-14" accent={accent} />
          ) : (
            <FloatingLily className="w-8 h-12 md:w-11 md:h-14" accent={accent} />
          )}
        </motion.div>
      ))}

      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle at 30% 20%, ${accent} 0%, transparent 50%), radial-gradient(circle at 70% 80%, ${accent} 0%, transparent 45%)`,
        }}
      />
    </div>
  );
}
