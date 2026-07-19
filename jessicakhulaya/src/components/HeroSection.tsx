"use client";

import { useApp } from "@/lib/context";
import { fadeIn, fadeUp, staggerContainer } from "@/lib/motion";
import { COLORS } from "@/styles/tokens";
import { useLenis } from "lenis/react";
import {
    motion,
    useMotionValue,
    useScroll,
    useSpring,
    useTransform,
} from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const HERO_BG = "/images/jessica-kulaya-hero-bg.webp";

export default function HeroSection() {
  const { introComplete } = useApp();
  const containerRef = useRef<HTMLDivElement>(null);
  const lenis = useLenis();
  const [isMobileHero, setIsMobileHero] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobileHero(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const scrollToDetails = () => {
    const el = document.getElementById("details");
    if (!el) return;

    if (lenis) {
      lenis.scrollTo(el, { offset: 0, duration: 1.15 });
      return;
    }

    el.scrollIntoView({ behavior: "smooth" });
  };

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const scrollBgY = useTransform(scrollYProgress, [0, 1], [0, 36]);
  const scrollTextY = useTransform(scrollYProgress, [0, 1], [0, -20]);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { stiffness: 50, damping: 22, mass: 0.7 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const bgMouseX = useTransform(smoothX, [-0.5, 0.5], [-8, 8]);
  const bgMouseY = useTransform(smoothY, [-0.5, 0.5], [-6, 6]);
  const textMouseX = useTransform(smoothX, [-0.5, 0.5], [-6, 6]);

  const combinedTextY = useTransform(
    [scrollTextY, smoothY],
    ([scroll, mouse]) => Number(scroll) + Number(mouse) * 6
  );

  useEffect(() => {
    if (isMobileHero) return;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth - 0.5);
      mouseY.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY, isMobileHero]);

  if (!introComplete) return null;

  return (
    <motion.section
      ref={containerRef}
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="relative h-[100dvh] max-h-[100dvh] md:min-h-screen md:h-auto md:max-h-none w-full flex flex-col overflow-hidden z-10"
      id="hero"
    >
      {/* ─── Fotografia de fundo ─── */}
      <motion.div
        className="absolute inset-0 z-0"
        style={{ y: isMobileHero ? 0 : scrollBgY, x: isMobileHero ? 0 : bgMouseX }}
        aria-hidden
      >
        <motion.div
          className="absolute inset-0 origin-[center_38%] scale-[1.12] md:translate-y-0 md:origin-[52%_38%] md:scale-[1.05]"
          style={{ y: isMobileHero ? 0 : bgMouseY }}
        >
          <Image
            src={HERO_BG}
            alt=""
            fill
            priority
            quality={92}
            sizes="100vw"
            className="object-cover object-[center_38%] md:object-[52%_38%]"
            style={{
              filter: "contrast(1.03) brightness(0.96) saturate(1.02)",
            }}
          />
        </motion.div>
      </motion.div>

      {/* ─── Overlays — desktop editorial ─── */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none hidden md:block"
        style={{
          background: `linear-gradient(105deg, ${COLORS.smoothBlack}eb 0%, ${COLORS.woodBrownDeep}aa 30%, ${COLORS.terracottaDeep}35 52%, transparent 78%)`,
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0 z-[1] pointer-events-none opacity-50 hidden md:block"
        style={{
          background: `radial-gradient(ellipse at 75% 35%, transparent 20%, ${COLORS.smoothBlack}88 100%)`,
        }}
        aria-hidden
      />

      {/* ─── Mobile — scrim + selo inferior (liga ao O Ritual) ─── */}
      <div
        className="absolute inset-x-0 bottom-0 h-[68%] z-[1] pointer-events-none md:hidden"
        style={{
          background: `linear-gradient(to top, ${COLORS.smoothBlack} 0%, ${COLORS.smoothBlack}f5 12%, ${COLORS.smoothBlack}e0 28%, ${COLORS.woodBrownDeep}cc 48%, ${COLORS.smoothBlack}99 62%, transparent 100%)`,
        }}
        aria-hidden
      />
      <div
        className="absolute inset-x-0 bottom-0 h-3 z-[2] pointer-events-none md:hidden"
        style={{ backgroundColor: COLORS.woodBrownDeep }}
        aria-hidden
      />

      {/* ─── Desktop — véu preto inferior ─── */}
      <div
        className="absolute inset-x-0 bottom-0 h-[42%] z-[1] pointer-events-none hidden md:block"
        style={{
          background: `linear-gradient(to top, ${COLORS.smoothBlack}cc 0%, ${COLORS.smoothBlack}88 28%, ${COLORS.smoothBlack}40 58%, transparent 100%)`,
        }}
        aria-hidden
      />

      {/* Mobile: foto única + tipografia inferior. Sem ilustração neon — só fotografia editorial. */}
      <div className="relative z-10 flex flex-col flex-1 min-h-0 w-full max-w-6xl mx-auto px-6 pt-[max(3rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] md:py-32 justify-end md:justify-center md:min-h-screen">
        <div className="w-full">
          <motion.div
            style={{ y: isMobileHero ? 0 : combinedTextY, x: isMobileHero ? 0 : textMouseX }}
            className="flex flex-col items-center md:items-start text-center md:text-left max-w-xl md:max-w-2xl mx-auto md:mx-0"
          >
            <motion.span
              variants={fadeUp}
              className="font-body text-[10px] font-light uppercase tracking-[0.28em] mb-2 md:hidden"
              style={{ color: COLORS.burntGoldLight }}
            >
              Uma celebração de raízes
            </motion.span>

            <motion.span
              variants={fadeUp}
              className="font-body text-[10px] font-light uppercase tracking-[0.4em] mb-4 hidden md:block"
              style={{ color: COLORS.burntGoldLight }}
            >
              All about the Traditional Ceremony
            </motion.span>

            <motion.h1
              variants={fadeUp}
              className="font-display text-[9px] md:text-xs font-light uppercase tracking-[0.32em] md:tracking-[0.5em] mb-2 md:mb-3 text-white/55 md:text-white/85"
            >
              Cerimónia de Kulaya
            </motion.h1>

            <motion.h2
              variants={fadeUp}
              className="font-display text-[2.85rem] sm:text-5xl md:text-7xl font-extralight tracking-[0.01em] leading-[0.92] text-[#FAF5F0] mb-3 md:mb-5 [text-shadow:0_2px_24px_rgba(18,10,7,0.45)]"
            >
              Jessica
              <br />
              <span className="font-display italic font-normal text-[#D4AF37] text-[1.08em] md:text-[1em]">
                Muege
              </span>
            </motion.h2>

            <motion.div
              variants={fadeIn}
              className="w-16 h-px mb-3 mx-auto md:hidden"
              style={{
                background: `linear-gradient(to right, transparent, ${COLORS.burntGoldLight}, transparent)`,
              }}
            />

            <motion.p
              variants={fadeUp}
              className="font-body text-sm font-light tracking-[0.14em] text-[#D4AF37] text-center mb-0 md:hidden [text-shadow:0_1px_12px_rgba(18,10,7,0.5)]"
            >
              Sábado, 01 Agosto 2026
            </motion.p>

            <motion.button
              type="button"
              variants={fadeIn}
              className="md:hidden mt-6 flex flex-col items-center gap-1.5 cursor-pointer bg-transparent border-0 p-0"
              onClick={scrollToDetails}
              aria-label="Deslizar para os detalhes"
            >
              <span
                className="font-body text-[8px] font-light uppercase tracking-[0.3em] opacity-60"
                style={{ color: COLORS.organicBeigeLight }}
              >
                Deslizar
              </span>
              <div className="w-px h-7 relative overflow-hidden bg-white/15">
                <motion.div
                  animate={{ y: ["-100%", "100%"] }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="w-full h-1/2 absolute top-0 left-0"
                  style={{ backgroundColor: COLORS.burntGoldLight }}
                />
              </div>
            </motion.button>

            <motion.p
              variants={fadeUp}
              className="hidden md:block font-body text-xs sm:text-sm font-light leading-relaxed mb-8 text-[#FAF5F0]/88"
            >
              Com profundo respeito às nossas raízes e à nossa cultura, convidamos
              a família e amigos para a cerimónia de Kulaya. Um momento de
              afirmação e dignidade onde tradição e continuidade se encontram.
            </motion.p>

            <motion.div
              variants={fadeIn}
              className="w-32 h-px mb-4 hidden md:block"
              style={{
                background: `linear-gradient(to right, ${COLORS.burntGoldLight}, transparent)`,
              }}
            />

            <motion.p
              variants={fadeUp}
              className="hidden md:block font-body text-xs font-light tracking-[0.08em] text-[#D4AF37] text-left"
            >
              Sábado, 01 Agosto 2026
            </motion.p>
          </motion.div>
        </div>
      </div>

      <div
        className="absolute top-1/2 right-0 md:right-[8%] -translate-y-1/2 select-none pointer-events-none z-[2] text-[14vw] md:text-[11vw] font-display font-light uppercase tracking-[0.2em] opacity-[0.04] hidden md:block"
        style={{ color: COLORS.organicBeigeLight }}
        aria-hidden
      >
        KULAYA
      </div>

      <motion.button
        type="button"
        variants={fadeIn}
        className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex-col items-center gap-2 cursor-pointer bg-transparent border-0 p-0 select-none"
        onClick={scrollToDetails}
        aria-label="Deslizar para os detalhes"
      >
        <span
          className="font-body text-[8px] font-light uppercase tracking-[0.3em] opacity-50 hover:opacity-100 transition-opacity duration-300"
          style={{ color: COLORS.organicBeigeLight }}
        >
          Deslizar
        </span>
        <div className="w-px h-10 relative overflow-hidden bg-white/15">
          <motion.div
            animate={{ y: ["-100%", "100%"] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            className="w-full h-1/2 absolute top-0 left-0"
            style={{ backgroundColor: COLORS.burntGoldLight }}
          />
        </div>
      </motion.button>
    </motion.section>
  );
}
