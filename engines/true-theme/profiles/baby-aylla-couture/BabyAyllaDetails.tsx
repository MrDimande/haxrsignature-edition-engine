"use client";

import { BABY_AYLLA_EVENT } from "@lib/aylla/event-details";
import { CoutureMedallion, CoutureReveal } from "./BabyAyllaCouture";
import styles from "./BabyAyllaCelebration.module.css";

export function BabyAyllaDetails() {
  const { venue, time } = BABY_AYLLA_EVENT;
  return (
    <section id="detalhes" aria-labelledby="aylla-encounter-title" className={`${styles.section} ${styles.encounterSection}`}>
      <header className={styles.sectionHeader}>
        <p className={`aylla-font-calligraphy ${styles.scriptLead}`}>Juntos, será ainda mais bonito.</p>
        <h2 id="aylla-encounter-title" className={`aylla-font-serif ${styles.sectionTitle}`}>O nosso encontro</h2>
        <p className={`aylla-font-serif ${styles.sectionLead}`}>Um dia para reunir quem faz parte da sua história.</p>
      </header>
      <CoutureReveal id="local" className={styles.placeCard}>
        <CoutureMedallion />
        <div className={styles.placeName}>
          <p className={`aylla-font-serif ${styles.smallItalic}`}>O cenário da celebração</p>
          <h3 className={`aylla-font-serif ${styles.venueName}`}>{venue.name}</h3>
          <p className={`aylla-font-calligraphy ${styles.placeSignature}`}>Maputo</p>
        </div>
        <div className={styles.placePractical}>
          <address className={`aylla-font-serif ${styles.address}`}>{venue.address}</address>
          <div className={styles.timeNote}>
            <p className={styles.smallLabel}>A hora do encontro</p>
            <p className={`aylla-font-serif ${styles.timeValue}`}>{time.display}</p>
            {!time.isConfirmed && <p className={styles.quietNote}>A família comunicará o horário.</p>}
          </div>
          {venue.mapsUrl && <a href={venue.mapsUrl} target="_blank" rel="noopener noreferrer" className={styles.textAction}>Abrir localização <span aria-hidden="true">↗</span></a>}
        </div>
      </CoutureReveal>
    </section>
  );
}
