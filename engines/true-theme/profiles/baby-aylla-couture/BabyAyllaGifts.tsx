"use client";

import { useState } from "react";
import { AYLLA_GIFT_CATEGORIES } from "@data/gifts/baby-aylla";
import { resolveBabyAyllaGiftPresentation } from "@lib/aylla/gifts/presentation";
import { useExperience } from "../../context";
import { CoutureReveal, PearlTransition } from "./BabyAyllaCouture";
import styles from "./BabyAyllaCelebration.module.css";

export function BabyAyllaGifts() {
  const { config } = useExperience();
  const [selectedCategory, setSelectedCategory] = useState(AYLLA_GIFT_CATEGORIES[0].id);
  const presentation = resolveBabyAyllaGiftPresentation({ invitationStatus: config.status });
  const selected = AYLLA_GIFT_CATEGORIES.find((category) => category.id === selectedCategory) ?? AYLLA_GIFT_CATEGORIES[0];

  return (
    <section id="mimos" aria-labelledby="aylla-gifts-title" className={`${styles.section} ${styles.giftsSection}`}>
      <header className={styles.sectionHeader}>
        <p className={`aylla-font-calligraphy ${styles.scriptLead}`}>Com carinho</p>
        <h2 id="aylla-gifts-title" className={`aylla-font-serif ${styles.sectionTitle}`}>Pequenos Mimos para Aylla</h2>
        <p className={`aylla-font-serif ${styles.sectionLead}`}>Uma colecção delicada, em curadoria pela família, para acompanhar os seus primeiros sonhos.</p>
      </header>

      <CoutureReveal className={styles.giftAtelier}>
        <p className={styles.giftOverline}>HAXR GIFT REGISTRY™ · ÉDITION ROSE</p>
        <div className={styles.giftTabs} role="tablist" aria-label="Categorias de presentes">
          {AYLLA_GIFT_CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              role="tab"
              id={`aylla-gift-tab-${category.id}`}
              aria-controls="aylla-gift-category-panel"
              aria-selected={selectedCategory === category.id}
              className={selectedCategory === category.id ? styles.giftTabActive : styles.giftTab}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.title}
            </button>
          ))}
        </div>
        <div
          id="aylla-gift-category-panel"
          className={styles.giftCategoryCard}
          role="tabpanel"
          aria-labelledby={`aylla-gift-tab-${selected.id}`}
        >
          <span aria-hidden="true" className={styles.giftPearl}>A</span>
          <p className={`aylla-font-serif ${styles.giftCategoryTitle}`}>{selected.title}</p>
          <p className={styles.giftCategoryLead}>{selected.lead}</p>
          <p className={styles.giftPending}>A selecção de presentes, fotografias e quantidades será revelada pela família em breve.</p>
        </div>
        <p className={styles.giftEligibility} role="status">{presentation.message}</p>
      </CoutureReveal>
      <PearlTransition />
    </section>
  );
}
