"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import {
  WEDDING_COPY,
  WEDDING_DRESS_REFERENCES,
} from "@lib/jessica-samuel-wedding/event-details";
import { JessicaSamuelEditorialHeading } from "./jessica-samuel-editorial-heading";
import { jsReveal, jsStagger, jsViewport } from "./jessica-samuel-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

function DressFrame({
  src,
  alt,
  label,
  featured = false,
}: {
  src: string;
  alt: string;
  label: string;
  featured?: boolean;
}) {
  return (
    <figure
      className={`js-dress-code__frame${featured ? " js-dress-code__frame--featured" : ""}`}
    >
      <div className="js-dress-code__media">
        <Image
          src={src}
          alt={alt}
          fill
          sizes={
            featured
              ? "(max-width: 767px) 88vw, 280px"
              : "(max-width: 767px) 42vw, 200px"
          }
          className="js-dress-code__img"
        />
        <div className="js-dress-code__veil" aria-hidden />
      </div>
      <figcaption className="js-dress-code__caption">{label}</figcaption>
    </figure>
  );
}

/**
 * Dress code editorial — traje de gala a rigor,
 * com referências visuais do Save the Date.
 */
export function JessicaSamuelDressCodeSection() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      id="dress-code"
      initial="hidden"
      whileInView="visible"
      viewport={{ ...jsViewport, amount: 0.12 }}
      variants={jsStagger}
      className="js-dress-code js-wedding-couple-section relative z-[1] py-10 sm:py-14 md:py-20"
      aria-labelledby="dress-code-title"
    >
      <div className="js-wedding-couple-section__shell">
        <motion.div
          variants={jsReveal}
          className="js-wedding-couple-section__title"
        >
          <JessicaSamuelEditorialHeading
            eyebrow="Dress Code"
            title="Traje de gala"
            compact
          />
          <p className="js-dress-code__lead">{WEDDING_COPY.dressCodeLead}</p>
        </motion.div>

        <motion.div
          variants={jsReveal}
          className="js-dress-code__jewel js-wedding-couple-wrap"
        >
          <div className="js-dress-code__inner js-wedding-couple-wrap__inner">
            <p className="js-dress-code__prologue">{WEDDING_COPY.dressCodeBody}</p>

            <div className="js-dress-code__columns">
              <motion.div
                className="js-dress-code__column"
                variants={{
                  hidden: {},
                  visible: {
                    transition: {
                      staggerChildren: reduceMotion ? 0 : 0.1,
                      delayChildren: reduceMotion ? 0 : 0.05,
                    },
                  },
                }}
              >
                <header className="js-dress-code__column-head">
                  <p className="js-dress-code__column-eyebrow">
                    {WEDDING_COPY.dressCodeHerTitle}
                  </p>
                  <p className="js-dress-code__column-line">
                    {WEDDING_COPY.dressCodeHerLine}
                  </p>
                </header>
                <div className="js-dress-code__her-grid">
                  {WEDDING_DRESS_REFERENCES.her.map((item, index) => (
                    <motion.div
                      key={item.id}
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: {
                          opacity: 1,
                          y: 0,
                          transition: { duration: 0.75, ease: EASE },
                        },
                      }}
                    >
                      <DressFrame
                        src={item.src}
                        alt={item.alt}
                        label={item.label}
                        featured={index === 0}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                className="js-dress-code__column"
                variants={{
                  hidden: {},
                  visible: {
                    transition: {
                      staggerChildren: reduceMotion ? 0 : 0.12,
                      delayChildren: reduceMotion ? 0 : 0.1,
                    },
                  },
                }}
              >
                <header className="js-dress-code__column-head">
                  <p className="js-dress-code__column-eyebrow">
                    {WEDDING_COPY.dressCodeHimTitle}
                  </p>
                  <p className="js-dress-code__column-line">
                    {WEDDING_COPY.dressCodeHimLine}
                  </p>
                </header>
                <div className="js-dress-code__him-grid">
                  {WEDDING_DRESS_REFERENCES.him.map((item) => (
                    <motion.div
                      key={item.id}
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: {
                          opacity: 1,
                          y: 0,
                          transition: { duration: 0.75, ease: EASE },
                        },
                      }}
                    >
                      <DressFrame
                        src={item.src}
                        alt={item.alt}
                        label={item.label}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
