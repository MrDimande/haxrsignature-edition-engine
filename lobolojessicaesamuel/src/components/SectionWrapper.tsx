"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { fadeUp, staggerContainer, defaultViewport } from "@/lib/animations";

interface SectionWrapperProps {
  children: ReactNode;
  className?: string;
  bg?: "white" | "ivory" | "cream";
  id?: string;
}

export default function SectionWrapper({
  children,
  className = "",
  bg = "white",
  id,
}: SectionWrapperProps) {
  const bgMap = {
    white: "bg-white",
    ivory: "bg-ivory",
    cream: "bg-cream",
  };

  return (
    <motion.section
      id={id}
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      className={`section-padding relative overflow-hidden ${bgMap[bg]} ${className}`}
    >
      <motion.div variants={fadeUp} className="mx-auto max-w-6xl px-6 md:px-8">
        {children}
      </motion.div>
    </motion.section>
  );
}
