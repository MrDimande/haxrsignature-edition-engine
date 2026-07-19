"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type PanInfo,
} from "motion/react";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import {
  JESSICA_SAMUEL_PHOTO_WALL,
  PHOTO_WALL_COPY,
} from "@lib/jessica-samuel-wedding/photo-wall/config";
import type { PublicWeddingPhoto } from "@lib/jessica-samuel-wedding/photo-wall/types";
import { jsType } from "../jessica-samuel-typography";
import { JS_SURFACES } from "../jessica-samuel-surfaces";

type LivePhotoGalleryProps = {
  emptyMessage: string;
  poll?: boolean;
};

/** Ritmo editorial tipo álbum — herói, retrato e faixa. */
function mosaicClassForIndex(index: number): string {
  const slot = index % 7;
  switch (slot) {
    case 0:
      return " is-hero";
    case 3:
      return " is-tall";
    case 5:
      return " is-wide";
    default:
      return "";
  }
}

const SWIPE_OFFSET = 56;
const SWIPE_VELOCITY = 420;
const EASE = [0.22, 1, 0.36, 1] as const;

function MemoriesLightbox({
  photos,
  index,
  onIndexChange,
  onClose,
}: {
  photos: PublicWeddingPhoto[];
  index: number;
  onIndexChange: (next: number) => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const reduceMotion = useReducedMotion();
  const photo = photos[index];
  const [direction, setDirection] = useState(0);
  const canPrev = index > 0;
  const canNext = index < photos.length - 1;
  const allowDrag = !reduceMotion && photo?.kind !== "video";

  const goTo = useCallback(
    (next: number, dir: number) => {
      if (next < 0 || next >= photos.length) return;
      setDirection(dir);
      onIndexChange(next);
    },
    [onIndexChange, photos.length]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goTo(index - 1, -1);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goTo(index + 1, 1);
      }
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [goTo, index, onClose]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (!allowDrag) return;
    const { offset, velocity } = info;
    if (offset.x < -SWIPE_OFFSET || velocity.x < -SWIPE_VELOCITY) {
      goTo(index + 1, 1);
      return;
    }
    if (offset.x > SWIPE_OFFSET || velocity.x > SWIPE_VELOCITY) {
      goTo(index - 1, -1);
    }
  };

  if (!photo) return null;

  return createPortal(
    <motion.div
      className="js-memories-lightbox"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28 }}
    >
      <button
        type="button"
        className="js-memories-lightbox__backdrop"
        aria-label="Fechar"
        onClick={onClose}
      />
      <button
        type="button"
        className="js-memories-lightbox__close"
        onClick={onClose}
        aria-label="Fechar memória"
      >
        <X size={18} strokeWidth={1.5} />
      </button>

      {canPrev ? (
        <button
          type="button"
          className="js-memories-lightbox__nav js-memories-lightbox__nav--prev"
          onClick={() => goTo(index - 1, -1)}
          aria-label="Memória anterior"
        >
          <ChevronLeft size={22} strokeWidth={1.4} />
        </button>
      ) : null}

      {canNext ? (
        <button
          type="button"
          className="js-memories-lightbox__nav js-memories-lightbox__nav--next"
          onClick={() => goTo(index + 1, 1)}
          aria-label="Memória seguinte"
        >
          <ChevronRight size={22} strokeWidth={1.4} />
        </button>
      ) : null}

      <div className="js-memories-lightbox__stage">
        <p id={titleId} className="js-memories-lightbox__sr">
          {photo.caption?.trim() || "Memória do casamento"}
          {` — ${index + 1} de ${photos.length}`}
        </p>

        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={photo.id}
            className="js-memories-lightbox__frame"
            custom={direction}
            initial={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, x: direction >= 0 ? 36 : -36 }
            }
            animate={{ opacity: 1, x: 0 }}
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, x: direction >= 0 ? -28 : 28 }
            }
            transition={{ duration: reduceMotion ? 0.18 : 0.32, ease: EASE }}
            drag={allowDrag ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.14}
            onDragEnd={onDragEnd}
          >
            {photo.kind === "video" ? (
              <video
                src={photo.signedUrl}
                className="js-memories-lightbox__media"
                controls
                playsInline
                autoPlay
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo.signedUrl}
                alt={photo.caption?.trim() || "Memória do casamento"}
                className="js-memories-lightbox__media"
                draggable={false}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {photo.caption ? (
          <p className="js-memories-lightbox__caption">{photo.caption}</p>
        ) : null}

        <p className="js-memories-lightbox__counter" aria-hidden>
          {index + 1} / {photos.length}
        </p>
      </div>
    </motion.div>,
    document.body
  );
}

export function LivePhotoGallery({
  emptyMessage,
  poll = true,
}: LivePhotoGalleryProps) {
  const [photos, setPhotos] = useState<PublicWeddingPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/wedding-photos?slug=${encodeURIComponent(
          JESSICA_SAMUEL_PHOTO_WALL.invitationSlug
        )}`,
        { cache: "no-store" }
      );
      const data = (await res.json()) as {
        success?: boolean;
        photos?: PublicWeddingPhoto[];
      };
      if (data.success && Array.isArray(data.photos)) {
        setPhotos(data.photos);
      }
    } catch {
      /* silent — galeria é best-effort */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    void refresh();
    if (!poll) return;
    const id = window.setInterval(() => {
      void refresh();
    }, JESSICA_SAMUEL_PHOTO_WALL.galleryPollMs);
    return () => window.clearInterval(id);
  }, [poll, refresh]);

  useEffect(() => {
    if (activeIndex === null) return;
    if (photos.length === 0) {
      setActiveIndex(null);
      return;
    }
    if (activeIndex >= photos.length) {
      setActiveIndex(photos.length - 1);
    }
  }, [activeIndex, photos.length]);

  if (loading && photos.length === 0) {
    return (
      <div className="js-memories-gallery-shell" aria-busy="true">
        <div className="js-memories-gallery js-memories-gallery--skeleton">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`js-memories-gallery__item${mosaicClassForIndex(i)} is-skeleton`}
              aria-hidden
            />
          ))}
        </div>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <p
        className={`${jsType.body} text-center max-w-md mx-auto`}
        style={{ color: JS_SURFACES.inkSoft }}
      >
        {emptyMessage}
      </p>
    );
  }

  const countLabel =
    photos.length === 1 ? "1 memória" : `${photos.length} memórias`;

  return (
    <div className="js-memories-gallery-shell">
      <div className="js-memories-gallery__meta">
        <span>{countLabel}</span>
        <span aria-hidden>·</span>
        <span>Álbum vivo</span>
      </div>

      <div className="js-memories-gallery" aria-label={PHOTO_WALL_COPY.eyebrow}>
        {photos.map((photo, index) => {
          const mosaic = mosaicClassForIndex(index);
          const label = photo.caption?.trim() || "Memória do casamento";

          return (
            <button
              key={photo.id}
              type="button"
              className={`js-memories-gallery__item${mosaic}`}
              onClick={() => setActiveIndex(index)}
              aria-label={
                photo.kind === "video"
                  ? `Ver vídeo — ${label}`
                  : `Ver foto — ${label}`
              }
            >
              {photo.kind === "video" ? (
                <>
                  <video
                    src={photo.signedUrl}
                    className="js-memories-gallery__media"
                    muted
                    playsInline
                    preload="metadata"
                    aria-hidden
                  />
                  <span className="js-memories-gallery__play" aria-hidden>
                    <Play size={16} strokeWidth={1.6} fill="currentColor" />
                  </span>
                </>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo.signedUrl}
                  alt=""
                  className="js-memories-gallery__media"
                  loading="lazy"
                />
              )}
              <span className="js-memories-gallery__veil" aria-hidden />
              {photo.caption ? (
                <span className="js-memories-gallery__caption">
                  {photo.caption}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {mounted ? (
        <AnimatePresence>
          {activeIndex !== null && photos[activeIndex] ? (
            <MemoriesLightbox
              key="memories-lightbox"
              photos={photos}
              index={activeIndex}
              onIndexChange={setActiveIndex}
              onClose={() => setActiveIndex(null)}
            />
          ) : null}
        </AnimatePresence>
      ) : null}
    </div>
  );
}
