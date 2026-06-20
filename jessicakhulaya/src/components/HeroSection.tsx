"use client";

import { useApp } from "@/lib/context";
import { fadeIn, fadeUp, staggerContainer } from "@/lib/motion";
import { COLORS } from "@/styles/tokens";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "motion/react";
import Image from "next/image";
import { useEffect, useRef } from "react";

export default function HeroSection() {
  const { introComplete } = useApp();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // ─── 1. Scroll-Based Parallax ───
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const scrollImageY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const scrollTextY = useTransform(scrollYProgress, [0, 1], [0, -30]);

  // ─── 2. Mouse-Move 3D Interactive Parallax ───
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 50, damping: 20, mass: 0.6 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Map mouse positions to distinct multi-plane translations
  const textMouseX = useTransform(smoothX, [-0.5, 0.5], [-8, 8]);
  const textMouseY = useTransform(smoothY, [-0.5, 0.5], [-8, 8]);

  // Combine scroll-drift and mouse-drift for the title container into a single motion value
  const combinedTextY = useTransform(
    [scrollTextY, textMouseY],
    ([latestScroll, latestMouse]) => Number(latestScroll) + Number(latestMouse)
  );

  // Outermost gold border shifts OPPOSITE to the image for maximum 3D distance
  const frame1X = useTransform(smoothX, [-0.5, 0.5], [18, -18]);
  const frame1Y = useTransform(smoothY, [-0.5, 0.5], [18, -18]);

  // Inner gold border shifts slightly opposite
  const frame2X = useTransform(smoothX, [-0.5, 0.5], [8, -8]);
  const frame2Y = useTransform(smoothY, [-0.5, 0.5], [8, -8]);

  // The actual photo shifts in the direction of the cursor (depth feel)
  const imgMouseX = useTransform(smoothX, [-0.5, 0.5], [-12, 12]);
  const imgMouseY = useTransform(smoothY, [-0.5, 0.5], [-12, 12]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Coordinates relative to center of the viewport (-0.5 to 0.5)
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  if (!introComplete) return null;

  return (
    <motion.section
      ref={containerRef}
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="relative min-h-screen w-full flex flex-col items-center justify-center px-6 py-24 md:py-32 overflow-hidden z-10"
      id="hero"
    >
      {/* ─── SVG ClipPath Definition ─── */}
      <svg className="absolute w-0 h-0" width="0" height="0">
        <defs>
          <clipPath id="african-shield" clipPathUnits="objectBoundingBox">
            {/* Elegant organic shield shape */}
            <path d="M 0.5,0 C 0.72,0.06 0.88,0.22 0.88,0.48 C 0.88,0.72 0.74,0.86 0.5,1 C 0.26,0.86 0.12,0.72 0.12,0.48 C 0.12,0.22 0.28,0.06 0.5,0 Z" />
          </clipPath>
        </defs>
      </svg>

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* ─── Left Side: Title and Subtitle ─── */}
        <motion.div 
          style={{ y: combinedTextY, x: textMouseX }}
          className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left z-20 order-2 lg:order-1"
        >
          {/* Tagline */}
          <motion.span 
            variants={fadeUp}
            className="font-body text-[10px] font-light uppercase tracking-[0.4em] mb-4"
            style={{ color: COLORS.burntGoldDark }}
          >
            All about the Traditional Ceremony
          </motion.span>

          {/* Headline */}
          <motion.h1 
            variants={fadeUp}
            className="font-display text-xs font-light uppercase tracking-[0.5em] mb-3 text-white/80"
          >
            Cerimónia de Kulaya
          </motion.h1>

          <motion.h2 
            variants={fadeUp}
            className="font-display text-5xl sm:text-6xl md:text-7xl font-extralight tracking-[0.02em] leading-[1.05] text-[#FAF5F0] mb-6"
          >
            Jessica<br />
            <span className="font-display italic font-normal text-[#D4AF37]">Muege</span>
          </motion.h2>

          <motion.p 
            variants={fadeUp}
            className="font-body text-xs sm:text-sm font-light leading-relaxed max-w-md mb-8 text-[#FAF5F0]/70"
          >
            Com profundo respeito às nossas raízes e à nossa cultura, convidamos a família e amigos para a cerimónia de Kulaya. Um momento de afirmação e dignidade onde tradição e continuidade se encontram.
          </motion.p>

          {/* Thin gold decorative divider line */}
          <motion.div 
            variants={fadeIn}
            className="w-32 h-[1px] mb-8 hidden lg:block"
            style={{
              background: `linear-gradient(to right, ${COLORS.burntGoldLight}, transparent)`
            }}
          />

          <motion.div 
            variants={fadeUp}
            className="flex items-center gap-4 text-left"
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS.orangeAccent }} />
            <div>
              <span className="block font-body text-[9px] uppercase tracking-wider text-[#FAF5F0]/40">Presença Solicitada</span>
              <span className="font-body text-xs text-[#D4AF37]/90 font-light">Sábado, 01 Agosto 2026</span>
            </div>
          </motion.div>
        </motion.div>

        {/* ─── Right/Center Side: Hero Portrait Asset (The Anchor) ─── */}
        <div className="lg:col-span-7 flex justify-center items-center z-10 order-1 lg:order-2">
          {/* Scroll Parallax Wrapper */}
          <motion.div 
            style={{ y: scrollImageY }}
            variants={fadeIn}
            className="relative w-[75vw] sm:w-[50vw] md:w-[42vw] lg:w-[32vw] aspect-[2/3] group"
          >
            {/* Outer Gold Border Shield Frame (shifts opposite to mouse) */}
            <motion.div 
              style={{
                clipPath: "url(#african-shield)",
                border: `1px solid ${COLORS.burntGoldDark}`,
                opacity: 0.35,
                x: frame1X,
                y: frame1Y
              }}
              className="absolute inset-[-8px] transition-transform duration-300 ease-out -z-10"
            />

            {/* Inner Gold Border Accent Frame (shifts slightly opposite) */}
            <motion.div 
              style={{
                clipPath: "url(#african-shield)",
                border: `1.5px solid ${COLORS.burntGoldLight}`,
                opacity: 0.8,
                x: frame2X,
                y: frame2Y
              }}
              className="absolute inset-[-3px] transition-transform duration-300 ease-out -z-10 group-hover:scale-[1.01]"
            />

            {/* Main Image Container (shifts with mouse) */}
            <motion.div 
              style={{
                clipPath: "url(#african-shield)",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.8)",
                x: imgMouseX,
                y: imgMouseY
              }}
              className="relative w-full h-full overflow-hidden transition-all duration-300 ease-out"
            >
              <Image
                src="/images/jessica.jpg"
                alt="Retrato de Jessica Muege — Cerimónia de Kulaya"
                fill
                priority
                sizes="(max-width: 640px) 75vw, (max-width: 1024px) 50vw, 32vw"
                className="object-cover object-top scale-125 group-hover:scale-[1.32] transition-transform duration-1000 ease-[0.16,1,0.3,1]"
                style={{
                  filter: "contrast(1.02) brightness(0.98)"
                }}
              />
              
              {/* Soft warm vignette gradient overlay inside image to color grade and ground it */}
              <div 
                className="absolute inset-0 pointer-events-none mix-blend-color-burn opacity-40"
                style={{
                  background: `radial-gradient(circle at center, transparent 30%, ${COLORS.terracottaDeep} 100%)`
                }}
              />
              <div 
                className="absolute inset-0 pointer-events-none mix-blend-screen opacity-15"
                style={{
                  background: `linear-gradient(to top, ${COLORS.woodBrownDeep}, transparent)`
                }}
              />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* ─── Big background letters: KULAYA ─── */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none -z-20 text-[18vw] font-display font-light uppercase tracking-[0.2em] opacity-[0.015]"
        style={{ color: COLORS.organicBeigeLight }}
      >
        KULAYA
      </div>

      {/* ─── Scroll Indicator ─── */}
      <motion.div
        variants={fadeIn}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 select-none cursor-pointer"
        onClick={() => {
          document.getElementById("details")?.scrollIntoView({ behavior: "smooth" });
        }}
      >
        <span 
          className="font-body text-[8px] font-light uppercase tracking-[0.3em] opacity-40 hover:opacity-100 transition-opacity duration-300"
          style={{ color: COLORS.organicBeigeLight }}
        >
          Deslizar
        </span>
        <div className="w-[1px] h-10 relative overflow-hidden bg-white/10">
          <motion.div 
            animate={{ 
              y: ["-100%", "100%"] 
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-full h-1/2 absolute top-0 left-0"
            style={{ backgroundColor: COLORS.burntGoldLight }}
          />
        </div>
      </motion.div>
    </motion.section>
  );
}
