"use client";

import Image from "next/image";
import { useId } from "react";
import { motion } from "motion/react";
import { BABY_AYLLA_EVENT } from "@lib/aylla/event-details";
import styles from "./BabyAyllaStory.module.css";

type Chapter = (typeof BABY_AYLLA_EVENT.chapters)[number];

interface AlbumChapterProps {
  chapter: Chapter;
  variant: "encanto" | "descobertas" | "alegria";
  width: number;
  height: number;
  note: string;
}

function AlbumChapter({ chapter, variant, width, height, note }: AlbumChapterProps) {
  const titleId = useId();
  return (
    <motion.article
      aria-labelledby={titleId}
      className={`${styles.chapter} ${styles[variant]}`}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
    >
      <figure className={styles.print}>
        <div className={styles.photoMount}>
          <Image
            data-album-photo
            src={chapter.imagePath}
            alt={chapter.alt}
            width={width}
            height={height}
            quality={95}
            sizes="(min-width: 1024px) 460px, (min-width: 640px) 400px, calc(100vw - 72px)"
            className={styles.photo}
          />
        </div>
        <span aria-hidden="true" className={`aylla-font-calligraphy ${styles.printSignature}`}>Aylla</span>
        {variant === "encanto" && (
          <span aria-hidden="true" className={styles.bow}>
            <Image src="/images/baby-aylla/satin-bow-hero.png" alt="" fill sizes="140px" quality={95} className={styles.bowImage} />
          </span>
        )}
        {variant === "descobertas" && <span aria-hidden="true" className={styles.tape} />}
      </figure>
      <div className={styles.chapterText}>
        <p className={`aylla-font-serif ${styles.chapterNumber}`}>{chapter.number}</p>
        <h3 id={titleId} className={`aylla-font-serif ${styles.chapterTitle}`}>{chapter.title}</h3>
        {variant === "alegria" && <p className={styles.note}>{note}</p>}
        <blockquote className={`aylla-font-serif ${styles.quote}`}><p>{chapter.quote}</p></blockquote>
        {variant !== "alegria" && <p className={styles.note}>{note}</p>}
      </div>
    </motion.article>
  );
}

export function BabyAyllaStory() {
  const { chapters, editorial } = BABY_AYLLA_EVENT;
  const ribbonId = useId();

  return (
    <section id="historia" data-family-album aria-labelledby="aylla-album-title" className={styles.story}>
      <div aria-hidden="true" className={styles.entry}>
        <Image src="/images/baby-aylla/silk-drape-bg.webp" alt="" fill sizes="100vw" quality={90} className={styles.entrySilk} />
        <span className={styles.entryThread} />
      </div>
      <header className={styles.header}>
        <h2 id="aylla-album-title" className={`aylla-font-serif ${styles.title}`}>{editorial.storyTitle}</h2>
        <p className={`aylla-font-serif ${styles.lead}`}>{editorial.storyLead}</p>
      </header>

      <div className={styles.chapters}>
        <AlbumChapter
          chapter={chapters[0]} variant="encanto" width={1280} height={1280}
          note="No aconchego do seu universo, sob estrelas suaves e tons empoeirados, cada olhar da Aylla revela a pureza mais profunda da infância."
        />
        <AlbumChapter
          chapter={chapters[1]} variant="descobertas" width={794} height={1280}
          note="Segurada por mãos de amor, os seus passos tímidos abrem caminhos luminosos na família, enchendo os nossos corações de orgulho e esperança."
        />
        <AlbumChapter
          chapter={chapters[2]} variant="alegria" width={722} height={1280}
          note="O seu sorriso espontâneo e a mãozinha no ar são a própria celebração da vida. É esta alegria pura e contagiante que nos une no dia 23 de Janeiro."
        />
      </div>

      <div data-album-transition aria-hidden="true" className={styles.bridge}>
        <svg viewBox="0 0 640 110" fill="none" className={styles.bridgeRibbon}>
          <defs>
            <linearGradient id={ribbonId} x1="290" y1="20" x2="320" y2="88" gradientUnits="userSpaceOnUse">
              <stop stopColor="#AC776B" />
              <stop offset="0.3" stopColor="#EAC6B4" />
              <stop offset="0.55" stopColor="#F7DFCD" />
              <stop offset="1" stopColor="#BB8875" />
            </linearGradient>
          </defs>
          <path d="M26 66C119 20 212 23 306 57C399 90 493 87 614 32L617 47C496 103 396 104 302 72C209 40 121 36 31 81Z" fill={`url(#${ribbonId})`} />
          <path d="M28 67C122 23 213 26 305 59C400 92 495 89 614 34" stroke="#F9E8D8" strokeWidth="1" />
          <circle cx="320" cy="69" r="4" fill="#FFF8EA" stroke="#C9AA86" strokeWidth="0.8" />
        </svg>
      </div>
    </section>
  );
}
