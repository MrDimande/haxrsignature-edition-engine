"use client";

import type { CSSProperties } from "react";
import { BABY_AYLLA_EVENT } from "@lib/aylla/event-details";
import { CoutureReveal } from "./BabyAyllaCouture";
import styles from "./BabyAyllaCelebration.module.css";

const fabricNames: Record<string, string> = {
  "Rose Poudré": "Rosa poudré",
  "Blush Satin": "Cetim blush",
  "Pearl Ivory": "Marfim",
  "Antique Rose": "Rosa antigo",
  "Champagne Suave": "Champagne",
};

export function BabyAyllaDressCode() {
  const { dressCode } = BABY_AYLLA_EVENT;
  const swatches = dressCode.swatches.filter(swatch => swatch.name !== "Couture Ink");
  return (
    <section id="dress-code" aria-labelledby="aylla-tones-title" className={`${styles.section} ${styles.atelierSection}`}>
      <header className={styles.sectionHeader}>
        <p className={`aylla-font-calligraphy ${styles.scriptLead}`}>Um pequeno atelier de cor.</p>
        <h2 id="aylla-tones-title" className={`aylla-font-serif ${styles.sectionTitle}`}>Os tons da celebração</h2>
        <p className={`aylla-font-serif ${styles.sectionLead}`}>Tons suaves, tecidos leves e liberdade para celebrar.</p>
      </header>
      <CoutureReveal variant="fabric" className={styles.fabricCollection}>
        {swatches.map((swatch, index) => (
          <figure key={swatch.name} className={styles.fabricSample} style={{ "--fabric-color": swatch.hex, "--fabric-angle": `${(index - 2) * 1.4}deg`, "--fabric-length": `${142 + [0, 22, 9, 28, 4][index % 5]}px` } as CSSProperties}>
            <div aria-hidden="true" className={styles.fabric} />
            <figcaption className={`aylla-font-serif ${styles.fabricName}`}>{fabricNames[swatch.name] ?? swatch.name}</figcaption>
          </figure>
        ))}
      </CoutureReveal>
      <p className={`aylla-font-serif ${styles.paletteNote}`}>
        {dressCode.isConfirmed ? dressCode.description : "Uma paleta de inspiração. A orientação de vestuário será confirmada pela família."}
      </p>
    </section>
  );
}
