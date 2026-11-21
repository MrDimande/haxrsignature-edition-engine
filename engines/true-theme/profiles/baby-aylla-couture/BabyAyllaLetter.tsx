"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { motion, useMotionTemplate, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { BABY_AYLLA_EVENT } from "@lib/aylla/event-details";
import styles from "./BabyAyllaLetter.module.css";

function LetterPaper() {
  const { editorial } = BABY_AYLLA_EVENT;
  return (
    <>
      <article className={styles.paper}>
        <span aria-hidden="true" className={`aylla-font-calligraphy ${styles.monogram}`}>A</span>
        <h2 id="aylla-letter-title" className={`aylla-font-serif ${styles.title}`}>Uma carta para ti</h2>
        <div className={`aylla-font-serif ${styles.body}`}>
          <p className={styles.opening}>{editorial.invitationLead}</p>
          <p>{editorial.closingQuote}</p>
        </div>
        <footer className={styles.signature}>
          <p className="aylla-font-serif">Com carinho,</p>
          <p className={`aylla-font-calligraphy ${styles.family}`}>Família {BABY_AYLLA_EVENT.familyName}</p>
        </footer>
      </article>
      <span aria-hidden="true" className={styles.ribbon}><span className={styles.ribbonPearl} /></span>
    </>
  );
}

function LetterBackdrop() {
  return (
    <>
      <div aria-hidden="true" className={styles.scenery}>
        <Image src="/images/baby-aylla/silk-drape-bg.webp" alt="" fill sizes="100vw" quality={90} className={styles.silk} />
      </div>
      <div aria-hidden="true" className={styles.connector}><span /><span /><span /></div>
    </>
  );
}

type EnvelopePhase = "sealed" | "opening" | "revealed";

function subscribeToReducedMotion(onChange: () => void) {
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  preference.addEventListener("change", onChange);
  return () => preference.removeEventListener("change", onChange);
}

function getReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getServerReducedMotion() {
  return false;
}

export function BabyAyllaLetter({ isRevealed }: { isRevealed: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useSyncExternalStore(subscribeToReducedMotion, getReducedMotion, getServerReducedMotion);
  const [layout, setLayout] = useState({ viewportHeight: 800, sectionWidth: 640, paperHeight: 680 });
  const [phase, setPhase] = useState<EnvelopePhase>("sealed");

  useEffect(() => {
    const section = sectionRef.current;
    const paper = paperRef.current;
    if (!section || !paper) return;
    const measure = () => {
      const next = { viewportHeight: window.innerHeight, sectionWidth: section.clientWidth, paperHeight: paper.offsetHeight };
      setLayout(previous => previous.viewportHeight === next.viewportHeight && previous.sectionWidth === next.sectionWidth && previous.paperHeight === next.paperHeight ? previous : next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(section);
    observer.observe(paper);
    window.addEventListener("resize", measure);
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); };
  }, [reducedMotion]);

  const heightLimitedWidth = layout.viewportHeight < 560 ? (layout.viewportHeight - 96) / 0.6 : 620;
  const envelopeWidth = Math.min(620, layout.sectionWidth - 48, heightLimitedWidth);
  const envelopeHeight = envelopeWidth * 0.6;
  const envelopeTop = Math.max(80, (layout.viewportHeight - envelopeHeight) / 2);
  const paperTop = Math.max(40, (layout.viewportHeight - layout.paperHeight) / 2);
  const stageHeight = Math.max(layout.viewportHeight, layout.paperHeight + 80);
  const shortSequence = layout.sectionWidth < 768 || layout.viewportHeight < 560;
  const distance = Math.round(shortSequence ? Math.min(360, layout.viewportHeight * 0.55) : Math.min(720, layout.viewportHeight * 0.75));
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", `${distance}px start`] });
  const paperY = useTransform(scrollYProgress, [0, 0.25, 0.76, 1], [envelopeTop + envelopeHeight * 0.12 - paperTop, envelopeTop + envelopeHeight * 0.12 - paperTop, 0, 0]);
  const paperOpacity = useTransform(scrollYProgress, [0.12, 0.23], [0, 1]);
  const envelopeY = useTransform(scrollYProgress, [0.4, 0.92], [0, paperTop + layout.paperHeight - envelopeTop + 40]);
  const envelopeOpacity = useTransform(scrollYProgress, [0.72, 0.94], [1, 0]);
  const flapRotation = useTransform(scrollYProgress, [0.04, 0.3], [0, -180]);
  const flapShadowOpacity = useTransform(scrollYProgress, [0, 0.12, 0.26, 0.42], [0.1, 0.55, 0.32, 0]);
  const flapShadowScale = useTransform(scrollYProgress, [0, 0.18, 0.42], [1, 0.48, 0.08]);
  const mouthShadowOpacity = useTransform(scrollYProgress, [0, 0.18, 0.55, 0.85], [0, 0.7, 0.45, 0]);
  const paperLiftOpacity = useTransform(scrollYProgress, [0.2, 0.6, 1], [0, 0.65, 1]);
  const paperShadeOpacity = useTransform(scrollYProgress, [0.22, 0.68, 1], [0.6, 0.15, 0]);
  const flapLayer = useTransform(scrollYProgress, [0, 0.16, 0.17, 1], [6, 6, 1, 1]);
  const sealOpacity = useTransform(scrollYProgress, [0.02, 0.14], [1, 0]);
  const sealY = useTransform(scrollYProgress, [0.02, 0.14], [0, -12]);
  const ribbonOpacity = useTransform(scrollYProgress, [0.1, 0.25], [1, 0]);
  const clippedBottom = Math.max(0, stageHeight - envelopeTop - envelopeHeight + 4);
  const clipBottom = useTransform(scrollYProgress, [0, 0.4, 0.87], [clippedBottom, clippedBottom, 0]);
  const paperClip = useMotionTemplate`inset(0px 0px ${clipBottom}px 0px)`;

  useMotionValueEvent(scrollYProgress, "change", value => {
    const next: EnvelopePhase = value < 0.06 ? "sealed" : value < 0.94 ? "opening" : "revealed";
    setPhase(previous => previous === next ? previous : next);
  });

  const sceneStyles = {
    height: reducedMotion ? undefined : stageHeight + distance,
    "--envelope-width": `${envelopeWidth}px`,
    "--envelope-height": `${envelopeHeight}px`,
    "--envelope-top": `${envelopeTop}px`,
    "--paper-top": `${paperTop}px`,
    "--stage-height": `${stageHeight}px`,
  } as CSSProperties;

  return (
    <section
      ref={sectionRef}
      id="carta"
      data-envelope
      data-envelope-phase={reducedMotion ? "revealed" : isRevealed ? phase : "sealed"}
      data-scroll-distance={reducedMotion ? 0 : distance}
      aria-labelledby="aylla-letter-title"
      className={`${styles.section} ${reducedMotion ? styles.staticSection : ""}`}
      style={sceneStyles}
    >
      <LetterBackdrop />
      {reducedMotion ? (
        <div ref={paperRef} data-letter-paper className={`${styles.sheet} ${styles.staticSheet}`}><LetterPaper /></div>
      ) : (
        <div data-envelope-stage className={styles.stage}>
          <p className="sr-only">Uma carta da família que se revela ao continuar a deslocar a página.</p>
          <motion.div aria-hidden="true" className={`${styles.envelope} ${styles.envelopeBack}`} style={{ y: envelopeY, opacity: envelopeOpacity }}>
            <div className={styles.lining} />
            <motion.span data-envelope-mouth-shadow className={styles.mouthShadow} style={{ opacity: mouthShadowOpacity }} />
          </motion.div>

          <motion.div className={styles.paperWindow} style={{ clipPath: paperClip }}>
            <motion.div ref={paperRef} data-letter-paper className={styles.sheet} style={{ y: paperY, opacity: paperOpacity }}>
              <motion.span aria-hidden="true" data-paper-lift-shadow className={styles.paperLiftShadow} style={{ opacity: paperLiftOpacity }} />
              <LetterPaper />
              <motion.span aria-hidden="true" data-paper-shade className={styles.paperShade} style={{ opacity: paperShadeOpacity }} />
            </motion.div>
          </motion.div>

          <motion.div aria-hidden="true" data-envelope-front className={`${styles.envelope} ${styles.envelopeFront}`} style={{ y: envelopeY, opacity: envelopeOpacity }}>
            <div className={styles.pocket} />
            <motion.span data-envelope-flap-shadow className={styles.flapCastShadow} style={{ opacity: flapShadowOpacity, scaleY: flapShadowScale }} />
            <svg className={styles.seams} viewBox="0 0 620 372" fill="none" preserveAspectRatio="none">
              <path d="M1 1L310 184L619 1M1 371L268 208M619 371L352 208" stroke="#C6AD8C" strokeOpacity="0.55" />
            </svg>
            <motion.span className={styles.envelopeRibbon} style={{ opacity: ribbonOpacity }} />
          </motion.div>

          <motion.div aria-hidden="true" data-envelope-flap className={`${styles.envelope} ${styles.flap}`} style={{ y: envelopeY, rotateX: flapRotation, opacity: envelopeOpacity, zIndex: flapLayer }}>
            <div className={styles.flapFace} />
            <div className={styles.flapLining} />
          </motion.div>
          <motion.div aria-hidden="true" className={`${styles.envelope} ${styles.sealLayer}`} style={{ y: envelopeY, opacity: sealOpacity }}>
            <motion.span className={`aylla-font-calligraphy ${styles.seal}`} style={{ y: sealY }}>A</motion.span>
          </motion.div>
        </div>
      )}
    </section>
  );
}
