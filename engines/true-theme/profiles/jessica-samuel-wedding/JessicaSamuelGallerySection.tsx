"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import {
  WEDDING_COPY,
  WEDDING_GALLERY,
} from "@lib/jessica-samuel-wedding/event-details";
import { JessicaSamuelEditorialHeading } from "./jessica-samuel-editorial-heading";
import { jsReveal, jsStagger, jsViewport } from "./jessica-samuel-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

const frameReveal = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: EASE },
  },
};

/**
 * Galeria editorial premium — apresentada dentro de um cartão-joia
 * (mesma família visual de «Os Noivos»).
 * Conta a jornada em capítulos: intenção, encontro, presença, assinatura.
 */
export function JessicaSamuelGallerySection() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      id="galeria"
      initial="hidden"
      whileInView="visible"
      viewport={{ ...jsViewport, amount: 0.08 }}
      variants={jsStagger}
      className="js-gallery-card-section js-wedding-couple-section relative z-[1] py-10 sm:py-14 md:py-20"
      aria-label="Galeria editorial"
    >
      <div className="js-wedding-couple-section__shell">
        <motion.div
          variants={jsReveal}
          className="js-wedding-couple-section__title"
        >
          <JessicaSamuelEditorialHeading
            eyebrow="A nossa história"
            title="Em preto & luz"
            compact
          />
          <p className="js-gallery-card__lead">
            Quatro momentos. Uma jornada. Do encontro à assinatura do nosso
            amor — em silêncio, contraste e intenção.
          </p>
        </motion.div>

        <motion.div
          variants={jsReveal}
          className="js-gallery-card js-wedding-couple-wrap"
        >
          <div className="js-gallery-card__inner js-wedding-couple-wrap__inner">
            <header className="js-gallery-card__prologue">
              <p className="js-gallery-card__prologue-eyebrow">
                {WEDDING_COPY.galleryEyebrow}
              </p>
              <p className="js-gallery-card__prologue-text">
                {WEDDING_COPY.galleryLead}
              </p>
            </header>

            <motion.div
              className="js-gallery-card__journey"
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    staggerChildren: reduceMotion ? 0 : 0.16,
                    delayChildren: reduceMotion ? 0 : 0.06,
                  },
                },
              }}
            >
              {WEDDING_GALLERY.map((item, index) => (
                <motion.figure
                  key={item.id}
                  className={`js-gallery-card__chapter js-gallery-card__chapter--${item.layout}${
                    item.layout === "pair" && index === 2
                      ? " js-gallery-card__chapter--pair-b"
                      : ""
                  }`}
                  variants={frameReveal}
                >
                  <div className="js-gallery-card__media">
                    <Image
                      src={item.src}
                      alt={item.alt}
                      fill
                      className="js-gallery-card__img"
                      sizes="(max-width: 767px) 88vw, (max-width: 1100px) 70vw, 920px"
                      priority={index === 0}
                    />
                    <div className="js-gallery-card__veil" aria-hidden />
                  </div>
                  <figcaption className="js-gallery-card__caption">
                    <span className="js-gallery-card__roman">
                      Capítulo {item.chapter}
                    </span>
                    <span className="js-gallery-card__title">{item.caption}</span>
                    <span className="js-gallery-card__line">{item.line}</span>
                  </figcaption>
                </motion.figure>
              ))}
            </motion.div>

            <footer className="js-gallery-card__epilogue">
              <span className="js-gallery-card__epilogue-rule" aria-hidden />
              <p className="js-gallery-card__epilogue-text">
                Black-tie. O nosso capítulo.
              </p>
            </footer>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
