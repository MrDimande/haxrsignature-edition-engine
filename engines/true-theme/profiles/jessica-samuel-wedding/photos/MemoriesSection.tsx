"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera } from "lucide-react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import {
  JESSICA_SAMUEL_PHOTO_WALL,
  PHOTO_WALL_COPY,
  PHOTO_WALL_DISABLED_MESSAGE,
} from "@lib/jessica-samuel-wedding/photo-wall/config";
import {
  getPhotoWallPhase,
  type PhotoWallPhase,
} from "@lib/jessica-samuel-wedding/photo-wall/validation";
import {
  getWeddingChapterPhase,
  type WeddingChapterPhase,
} from "@lib/jessica-samuel-wedding/chapter-phase";
import { WEDDING_EVENT } from "@lib/jessica-samuel-wedding/event-details";
import { JessicaSamuelEditorialHeading } from "../jessica-samuel-editorial-heading";
import { jsReveal, jsStagger, jsViewport } from "../jessica-samuel-motion";
import { JS_SURFACES } from "../jessica-samuel-surfaces";
import { jsType } from "../jessica-samuel-typography";
import { LivePhotoGallery } from "./LivePhotoGallery";
import { LivePhotoUploadModal } from "./LivePhotoUploadModal";

function copyForPhase(phase: PhotoWallPhase) {
  switch (phase) {
    case "before":
      return {
        title: PHOTO_WALL_COPY.titleBefore,
        body: PHOTO_WALL_COPY.bodyBefore,
        empty: PHOTO_WALL_DISABLED_MESSAGE,
      };
    case "open":
      return {
        title: PHOTO_WALL_COPY.titleOpen,
        body: PHOTO_WALL_COPY.bodyOpen,
        empty: PHOTO_WALL_COPY.emptyOpen,
      };
    case "closed":
      return {
        title: PHOTO_WALL_COPY.titleAfter,
        body: PHOTO_WALL_COPY.bodyAfter,
        empty: PHOTO_WALL_COPY.emptyAfter,
      };
    default: {
      const _exhaustive: never = phase;
      return _exhaustive;
    }
  }
}

function resolveMemoriesCopy(
  photoPhase: PhotoWallPhase,
  chapter: WeddingChapterPhase
) {
  // Depois do casamento, o álbum passa a leitura colectiva — mesmo com uploads abertos.
  if (chapter === "after" && photoPhase === "open") {
    return copyForPhase("closed");
  }
  return copyForPhase(photoPhase);
}

/** Secção pública — Memórias do Nosso Dia (upload + galeria aprovada). */
export function MemoriesSection() {
  const [phase, setPhase] = useState<PhotoWallPhase>(() => getPhotoWallPhase());
  const [chapter, setChapter] = useState<WeddingChapterPhase>(() =>
    getWeddingChapterPhase(WEDDING_EVENT.dateIso)
  );
  const [uploadOpen, setUploadOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const sync = () => {
      setPhase(getPhotoWallPhase());
      setChapter(getWeddingChapterPhase(WEDDING_EVENT.dateIso));
    };
    sync();
    // Sem polling contínuo enquanto o photo-wall está desactivado nesta release.
    if (!JESSICA_SAMUEL_PHOTO_WALL.enabled) {
      return;
    }
    const id = window.setInterval(sync, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const copy = useMemo(
    () => resolveMemoriesCopy(phase, chapter),
    [phase, chapter]
  );
  const canUpload = phase === "open" && JESSICA_SAMUEL_PHOTO_WALL.enabled;
  const showGallery = phase !== "before" || chapter === "after";

  return (
    <>
      <motion.section
        id="memorias"
        initial="hidden"
        whileInView="visible"
        viewport={jsViewport}
        variants={jsStagger}
        className="js-memories js-wedding-couple-section relative z-[1] py-10 sm:py-14 md:py-20"
        aria-label={PHOTO_WALL_COPY.eyebrow}
      >
        <motion.div
          variants={jsReveal}
          className="js-wedding-couple-section__shell"
        >
          <JessicaSamuelEditorialHeading
            eyebrow={PHOTO_WALL_COPY.eyebrow}
            title={copy.title}
          />

          <p
            className={`${jsType.body} max-w-2xl mx-auto mt-6 text-center`}
            style={{ color: JS_SURFACES.inkSoft }}
          >
            {copy.body}
          </p>

          {canUpload ? (
            <div className="js-memories__cta-wrap">
              <button
                type="button"
                className="js-memories__cta"
                onClick={() => setUploadOpen(true)}
              >
                <Camera size={16} strokeWidth={1.5} aria-hidden />
                <span>{PHOTO_WALL_COPY.cta}</span>
              </button>
              {chapter !== "after" ? (
                <p className="js-memories__qr-hint">{PHOTO_WALL_COPY.qrHint}</p>
              ) : null}
            </div>
          ) : chapter === "before" ? (
            <p className="js-memories__teaser">{PHOTO_WALL_DISABLED_MESSAGE}</p>
          ) : null}

          {showGallery ? (
            <div className="js-memories__gallery-wrap">
              <LivePhotoGallery emptyMessage={copy.empty} poll={canUpload} />
            </div>
          ) : null}
        </motion.div>
      </motion.section>

      <LivePhotoUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        accentColor={JS_SURFACES.wine}
        blushColor={JS_SURFACES.rose}
      />

      {mounted && canUpload
        ? createPortal(
            <button
              type="button"
              className="js-memories__fab"
              onClick={() => setUploadOpen(true)}
              aria-label={PHOTO_WALL_COPY.cta}
            >
              <Camera size={18} strokeWidth={1.5} aria-hidden />
              <span>{PHOTO_WALL_COPY.cta}</span>
            </button>,
            document.body
          )
        : null}
    </>
  );
}
