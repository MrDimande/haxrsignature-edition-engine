"use client";

import { useCallback, useEffect, useState } from "react";
import { Camera, Images } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useLenis } from "lenis/react";
import {
  WEDDING_COUPLE,
  WEDDING_EVENT,
  WEDDING_POST_EVENT,
} from "@lib/jessica-samuel-wedding/event-details";
import {
  getWeddingChapterPhase,
  type WeddingChapterPhase,
} from "@lib/jessica-samuel-wedding/chapter-phase";
import { isPhotoWallOpen } from "@lib/jessica-samuel-wedding/photo-wall/validation";
import { JessicaSamuelEditorialHeading } from "./jessica-samuel-editorial-heading";
import { jsReveal, jsStagger, jsViewport } from "./jessica-samuel-motion";
import { JS_SURFACES } from "./jessica-samuel-surfaces";
import { jsType } from "./jessica-samuel-typography";
import { LivePhotoUploadModal } from "./photos/LivePhotoUploadModal";

function getScrollOffset(): number {
  return window.matchMedia("(min-width: 768px)").matches ? -96 : -18;
}

const TYPE_EASE = [0.22, 1, 0.36, 1] as const;

/** Agradecimento pós-evento + acesso ao álbum — só após o dia do casamento. */
export function JessicaSamuelPostEventSection() {
  const lenis = useLenis();
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<WeddingChapterPhase>(() =>
    getWeddingChapterPhase(WEDDING_EVENT.dateIso)
  );
  const [uploadOpen, setUploadOpen] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    const sync = () => {
      setPhase(getWeddingChapterPhase(WEDDING_EVENT.dateIso));
      setCanShare(isPhotoWallOpen());
    };
    sync();
    const id = window.setInterval(sync, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const scrollToAlbum = useCallback(() => {
    const section = document.getElementById(WEDDING_POST_EVENT.albumAnchorId);
    if (!section) return;

    if (lenis) {
      lenis.scrollTo(section, {
        offset: getScrollOffset(),
        duration: 1.1,
      });
      return;
    }

    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [lenis]);

  if (phase !== "after") return null;

  return (
    <>
      <motion.section
        id="agradecimento"
        initial="hidden"
        whileInView="visible"
        viewport={jsViewport}
        variants={jsStagger}
        className="js-post-event js-wedding-couple-section relative z-[1] py-10 sm:py-14 md:py-20"
        aria-label={WEDDING_POST_EVENT.eyebrow}
      >
        <motion.div
          variants={jsReveal}
          className="js-wedding-couple-section__shell"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={WEDDING_POST_EVENT.title}
              className="js-post-event__type"
              initial={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 20, filter: "blur(6px)" }
              }
              animate={{
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
              }}
              transition={{
                duration: reduceMotion ? 0.25 : 0.85,
                ease: TYPE_EASE,
              }}
            >
              <JessicaSamuelEditorialHeading
                eyebrow={WEDDING_POST_EVENT.eyebrow}
                title={WEDDING_POST_EVENT.title}
              />
            </motion.div>
          </AnimatePresence>

          <motion.p
            className={`${jsType.body} js-post-event__body max-w-2xl mx-auto mt-6 text-center`}
            style={{ color: JS_SURFACES.inkSoft }}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{
              duration: reduceMotion ? 0.2 : 0.75,
              delay: reduceMotion ? 0 : 0.12,
              ease: TYPE_EASE,
            }}
          >
            {WEDDING_POST_EVENT.body}
          </motion.p>

          <motion.p
            className="js-post-event__signoff"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{
              duration: reduceMotion ? 0.2 : 0.7,
              delay: reduceMotion ? 0 : 0.22,
              ease: TYPE_EASE,
            }}
          >
            <span>{WEDDING_POST_EVENT.signOff}</span>
            <strong>
              {WEDDING_POST_EVENT.signNames || WEDDING_COUPLE.display}
            </strong>
          </motion.p>

          <motion.div
            className="js-post-event__actions"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{
              duration: reduceMotion ? 0.2 : 0.65,
              delay: reduceMotion ? 0 : 0.3,
              ease: TYPE_EASE,
            }}
          >
            <button
              type="button"
              className="js-post-event__cta js-post-event__cta--primary"
              onClick={scrollToAlbum}
            >
              <Images size={15} strokeWidth={1.5} aria-hidden />
              <span>{WEDDING_POST_EVENT.albumCta}</span>
            </button>

            {canShare ? (
              <button
                type="button"
                className="js-post-event__cta js-post-event__cta--ghost"
                onClick={() => setUploadOpen(true)}
              >
                <Camera size={15} strokeWidth={1.5} aria-hidden />
                <span>{WEDDING_POST_EVENT.shareCta}</span>
              </button>
            ) : null}
          </motion.div>
        </motion.div>
      </motion.section>

      <LivePhotoUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        accentColor={JS_SURFACES.wine}
        blushColor={JS_SURFACES.rose}
      />
    </>
  );
}
