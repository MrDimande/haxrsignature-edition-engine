"use client";

import Image from "next/image";
import { BABY_AYLLA_EVENT } from "@lib/aylla/event-details";
import { CoutureBow, CoutureReveal } from "./BabyAyllaCouture";
import styles from "./BabyAyllaCelebration.module.css";

export function BabyAyllaFooter() {
  return (
    <footer id="aylla-farewell" aria-labelledby="aylla-farewell-title" className={`${styles.section} ${styles.farewell}`}>
      <div aria-hidden="true" className={styles.farewellSilk} />
      <CoutureReveal variant="signature" className={styles.farewellComposition}>
      <CoutureBow placement="farewell" />
      <h2 id="aylla-farewell-title" className={`aylla-font-serif ${styles.sectionTitle}`}>Até ao dia da Aylla.</h2>
      <p className={`aylla-font-serif ${styles.farewellMessage}`}>{BABY_AYLLA_EVENT.editorial.familyNoteText}</p>
      <p className={`aylla-font-serif ${styles.smallItalic}`}>Com amor e gratidão,</p>
      <p className={`aylla-font-calligraphy ${styles.familySignature}`}>Família {BABY_AYLLA_EVENT.familyName}</p>
      </CoutureReveal>
      <div className={styles.atelierSignature}>
        <Image src="/images/haxr-logo-horizontal.png" alt="HAXR Signature" width={240} height={92} sizes="240px" className={styles.brandLogo} />
        <p className={`aylla-font-serif ${styles.brandTagline}`}>Alta-Costura Digital</p>
        <p className={`aylla-font-calligraphy ${styles.brandIntention}`}>Assinatura com intenção</p>
        <small>© {BABY_AYLLA_EVENT.editorial.saveTheDateYear}</small>
      </div>
      <div className={styles.musicCredit} aria-label="Créditos da música">
        <p className={styles.smallLabel}>Banda sonora do convite</p>
        <p className={`aylla-font-serif ${styles.musicTitle}`}>{BABY_AYLLA_EVENT.music.title}</p>
        <p>Composição: {BABY_AYLLA_EVENT.music.composer}</p>
        <p>Crédito da gravação: {BABY_AYLLA_EVENT.music.recordingCredit}</p>
      </div>
    </footer>
  );
}
