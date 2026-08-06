"use client";

import { useRef } from "react";
import Image from "next/image";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  useInView,
} from "motion/react";
import {
  getNianStoryImage,
  NIAN_CINEMATIC_SIZES,
} from "@lib/nian/assets-manifest";
import { NIAN_COLORS, NIAN_EASE } from "./nian-motion";

/**
 * Origin Beat — o menino por trás do herói.
 * Artefacto inferior direito: crop por scale (overflow:hidden), não máscara.
 * Isolado a nian-night-of-the-web.
 */
export function NianOriginSection() {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.28 });
  const image = getNianStoryImage("origin");

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const imgY = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? [0, 0] : [18, -12]
  );
  const scrollScale = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? [1, 1] : [1.01, 1]
  );

  return (
    <section
      ref={sectionRef}
      id="origin"
      aria-labelledby="nian-origin-title"
      className="relative w-full overflow-hidden"
      style={{ backgroundColor: NIAN_COLORS.bg }}
    >
      <div className="mx-auto grid min-h-[100svh] w-full max-w-6xl items-center gap-6 px-5 py-12 md:gap-12 md:px-10 md:py-24 md:grid-cols-2">
        {/* Editorial plate */}
        <motion.div
          className="relative mx-auto w-full max-w-md md:max-w-none"
          style={{ y: imgY }}
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.75, ease: NIAN_EASE }}
        >
          {/* overflow:hidden + ~3.5% scale crop — hides bottom-right sparkle */}
          <div className="relative mx-auto aspect-[3/4] w-[min(100%,300px)] overflow-hidden md:w-full md:max-w-lg lg:max-w-none">
            {image ? (
              <>
                <div className="absolute inset-0 hidden md:block" aria-hidden>
                  <Image
                    src={image.src}
                    alt=""
                    fill
                    sizes="40vw"
                    className="scale-110 object-cover opacity-40 blur-2xl"
                  />
                </div>
                <motion.div
                  className="relative h-full w-full overflow-hidden"
                  style={{ scale: scrollScale }}
                >
                  {/* Mild scale crop inside overflow — cinematic already sparkle-free */}
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{
                      transform: "scale(1.03)",
                      transformOrigin: "center top",
                    }}
                  >
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      sizes={NIAN_CINEMATIC_SIZES}
                      className="object-cover object-[center_16%] md:object-[center_18%]"
                      priority={false}
                    />
                  </div>
                </motion.div>
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, transparent 62%, rgba(3,5,11,0.55) 100%)",
                  }}
                />
              </>
            ) : null}
          </div>
        </motion.div>

        {/* Copy */}
        <div className="relative z-10 max-w-lg md:pl-2">
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.55, delay: 0.05, ease: NIAN_EASE }}
            className="text-[10px] font-semibold uppercase tracking-[0.42em] text-[#4169E1]"
          >
            Capítulo 01
          </motion.p>

          <motion.h2
            id="nian-origin-title"
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.7, delay: 0.12, ease: NIAN_EASE }}
            className="mt-4 text-[clamp(1.85rem,5.5vw,3.1rem)] font-semibold uppercase leading-[1.05] tracking-[0.04em] text-[#F4F6FB]"
            style={{
              fontFamily: "var(--font-jost), var(--font-montserrat), sans-serif",
            }}
          >
            Nem todo herói
            <br />
            precisa de máscara.
          </motion.h2>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={inView ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.65, delay: 0.22, ease: NIAN_EASE }}
            className="mt-6 space-y-4 text-[1.02rem] leading-relaxed text-[#8FA3D1] md:text-[1.08rem] md:text-[#B0BED8]"
          >
            <p>
              Nesta noite, a cidade não pede salvação —
              <br className="hidden sm:block" />
              pede presença.
            </p>
            <p>
              O herói chama-se{" "}
              <span className="text-[#F4F6FB]">Nian</span>.
              <br />
              E a melhor missão é estar ao lado dele.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
