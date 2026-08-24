"use client";

import { NEIDY_JOSE_CONSTANTS } from "@lib/neidy-jose/constants";
import { Feather } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React, { useEffect, useRef, useState } from "react";

interface NeidyJoseBlessingsProps {
  prefersReducedMotion?: boolean;
}

interface BlessingMessage {
  id: string;
  author: string;
  message: string;
  date: string;
  isMagic?: boolean;
}

const ROTATIONS = [-2.2, 1.6, -1.1, 2.4, -1.8, 0.8, -2.6, 1.3];
const SEED_IDS = new Set(["b1", "b2"]);

/** Reveals text as if a quill is writing it */
function MagicalInkText({
  text,
  className,
  prefersReducedMotion,
  onComplete,
  speedMs = 28,
}: {
  text: string;
  className?: string;
  prefersReducedMotion?: boolean;
  onComplete?: () => void;
  speedMs?: number;
}) {
  const [visible, setVisible] = useState(prefersReducedMotion ? text.length : 0);
  const doneRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (prefersReducedMotion) {
      setVisible(text.length);
      onCompleteRef.current?.();
      return;
    }
    setVisible(0);
    doneRef.current = false;
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setVisible(i);
      if (i >= text.length) {
        window.clearInterval(id);
        if (!doneRef.current) {
          doneRef.current = true;
          onCompleteRef.current?.();
        }
      }
    }, speedMs);
    return () => window.clearInterval(id);
  }, [text, prefersReducedMotion, speedMs]);

  const shown = text.slice(0, visible);
  const writing = visible < text.length;

  return (
    <span className={className}>
      {shown}
      {writing && (
        <span className="nj-quill-caret" aria-hidden>
          ▍
        </span>
      )}
    </span>
  );
}

/**
 * Livro de Felicitações — mural mágico:
 * escrever com pena · revelar no muro como tinta viva.
 */
export function NeidyJoseBlessings({
  prefersReducedMotion = false,
}: NeidyJoseBlessingsProps) {
  const duration = prefersReducedMotion ? 0.01 : 0.95;
  const ease = [0.16, 1, 0.3, 1] as const;

  const [entries, setEntries] = useState<BlessingMessage[]>([]);
  const [author, setAuthor] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [writingId, setWritingId] = useState<string | null>(null);
  const [authorDone, setAuthorDone] = useState(false);
  const muralRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("nj_blessings_list");
      if (!saved) return;
      const parsed = JSON.parse(saved) as BlessingMessage[];
      const real = parsed.filter((item) => !SEED_IDS.has(item.id));
      setEntries(real);
      localStorage.setItem("nj_blessings_list", JSON.stringify(real));
    } catch {
      /* ignore */
    }
  }, []);

  const persist = (list: BlessingMessage[]) => {
    try {
      localStorage.setItem(
        "nj_blessings_list",
        JSON.stringify(list.map(({ isMagic, ...rest }) => rest))
      );
    } catch {
      /* ignore */
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setAuthorDone(false);

    const next: BlessingMessage = {
      id: `b-${Date.now()}`,
      author: author.trim(),
      message: message.trim(),
      date: new Date().toISOString().split("T")[0],
      isMagic: !prefersReducedMotion,
    };

    const updated = [next, ...entries];
    setEntries(updated);
    persist(updated);
    setWritingId(next.id);

    requestAnimationFrame(() => {
      muralRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    setAuthor("");
    setMessage("");
  };

  const finishMagic = (id: string) => {
    setEntries((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isMagic: false } : item))
    );
    setWritingId(null);
    setIsSubmitting(false);
    setAuthorDone(false);
  };

  return (
    <section
      id="blessings"
      className="nj-section-full nj-section-rise relative w-full overflow-hidden bg-[#FBFBFA] py-16 sm:py-20 md:py-28"
    >
      <div className="relative z-10 mx-auto max-w-5xl px-5 sm:px-8">
        <header className="mb-10 flex flex-col items-center text-center sm:mb-14">
          <motion.p
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration, ease }}
            className="mb-3 font-body text-[10px] uppercase tracking-[0.4em] text-[#3B6456]"
          >
            O mural vivo
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration, delay: 0.08, ease }}
            className="nj-script-font text-4xl text-[#CBB994] sm:text-5xl md:text-6xl"
          >
            Livro de Felicitações
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration, delay: 0.15 }}
            className="mt-4 max-w-md font-serif text-sm italic leading-relaxed text-[#3B6456] sm:text-base"
          >
            Escreva com a pena. A palavra nasce no mural como por magia.
          </motion.p>
        </header>

        {/* Quill desk */}
        <motion.form
          onSubmit={handleAdd}
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration, delay: 0.12, ease }}
          className="nj-quill-desk relative mx-auto mb-12 max-w-2xl overflow-hidden rounded-[1.5rem] border border-[#CBB994]/40 sm:mb-16 sm:rounded-[1.75rem]"
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[#F7F3EB]"
            style={{
              backgroundImage:
                "linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 30%), radial-gradient(ellipse at 90% 10%, rgba(203,185,148,0.15), transparent 50%)",
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            }}
            aria-hidden
          />

          <div className="relative z-10 px-6 py-8 sm:px-10 sm:py-10">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Feather className="h-4 w-4 text-[#CBB994]" aria-hidden />
                <p className="font-body text-[10px] uppercase tracking-[0.35em] text-[#CBB994]">
                  A pena está pronta
                </p>
              </div>
              <p className="font-serif text-xs italic text-[#3B6456]/70">
                {NEIDY_JOSE_CONSTANTS.brideName.split(" ")[0]} &{" "}
                {NEIDY_JOSE_CONSTANTS.groomName.split(" ")[0]}
              </p>
            </div>

            <label className="mb-2 block font-serif text-sm italic text-[#3B6456]">
              Assinado por
            </label>
            <input
              required
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="O seu nome ou família…"
              className="nj-quill-field mb-6 w-full border-0 border-b border-[#0A211A]/20 bg-transparent py-2 font-serif text-lg italic text-[#0A211A] outline-none placeholder:text-[#0A211A]/30 focus:border-[#CBB994]"
            />

            <label className="mb-2 block font-serif text-sm italic text-[#3B6456]">
              A vossa palavra
            </label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escreva como quem deixa tinta no papel…"
              className="nj-quill-field mb-7 w-full resize-none border-0 border-b border-[#0A211A]/20 bg-transparent py-2 font-serif text-lg italic leading-relaxed text-[#0A211A] outline-none placeholder:text-[#0A211A]/30 focus:border-[#CBB994]"
            />

            <div className="flex flex-col items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting || !author.trim() || !message.trim()}
                className="group relative inline-flex items-center gap-2 rounded-full bg-[#0A211A] px-7 py-3.5 font-body text-[10px] uppercase tracking-[0.28em] text-[#FCFDFC] shadow-[0_14px_36px_-12px_rgba(10,33,26,0.55)] transition-transform hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
              >
                <Feather className="h-3.5 w-3.5 text-[#CBB994] transition-transform group-hover:-rotate-12" />
                {isSubmitting ? "A tinta flui…" : "Enviar ao mural"}
              </button>
              {isSubmitting && (
                <p className="font-serif text-xs italic text-[#3B6456]">
                  A magia escreve no muro…
                </p>
              )}
            </div>
          </div>
        </motion.form>

        {/* Living mural wall */}
        <div ref={muralRef} className="nj-mural-wall relative overflow-hidden rounded-[1.75rem] border border-[#CBB994]/30 sm:rounded-[2rem]">
          <div
            className="absolute inset-0 bg-[#0A211A]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_10%,rgba(45,90,76,0.55),transparent_50%),radial-gradient(ellipse_at_80%_90%,rgba(203,185,148,0.12),transparent_45%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(203,185,148,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(203,185,148,0.35) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
            aria-hidden
          />

          <div className="relative z-10 px-5 py-10 sm:px-8 sm:py-12 md:px-10">
            <p className="mb-8 text-center font-body text-[9px] uppercase tracking-[0.4em] text-[#CBB994]/80">
              {entries.length === 0
                ? "O muro aguarda a primeira palavra"
                : `Palavras no muro · ${entries.length}`}
            </p>

            {entries.length === 0 ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center px-6 py-12 text-center">
                <Feather className="mb-4 h-6 w-6 text-[#CBB994]/50" aria-hidden />
                <p className="max-w-sm font-serif text-base italic leading-relaxed text-[#EBE4D5]/70 sm:text-lg">
                  Ainda ninguém escreveu. Seja o primeiro a deixar tinta neste mural.
                </p>
              </div>
            ) : (
            <ul className="m-0 grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              <AnimatePresence mode="popLayout">
                {entries.map((item, index) => {
                  const rot = ROTATIONS[index % ROTATIONS.length];
                  const isWriting = item.isMagic && writingId === item.id;

                  return (
                    <motion.li
                      key={item.id}
                      layout
                      initial={{
                        opacity: 0,
                        scale: prefersReducedMotion ? 1 : 0.92,
                        y: prefersReducedMotion ? 0 : 16,
                      }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        y: 0,
                        rotate: prefersReducedMotion ? 0 : rot,
                      }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.55, ease }}
                      className={`nj-mural-note relative rounded-sm border border-[#CBB994]/25 bg-[#F7F3EB] p-5 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.55)] sm:p-6 ${
                        isWriting ? "nj-mural-note--writing z-20" : ""
                      }`}
                    >
                      {isWriting && (
                        <span className="nj-mural-ink-glow pointer-events-none absolute -inset-4 rounded-md" aria-hidden />
                      )}

                      <blockquote className="min-h-[4.5rem] font-serif text-base italic leading-relaxed text-[#0A211A] sm:text-[1.05rem]">
                        “
                        {isWriting ? (
                          <MagicalInkText
                            text={item.message}
                            prefersReducedMotion={prefersReducedMotion}
                            speedMs={22}
                            onComplete={() => setAuthorDone(true)}
                          />
                        ) : (
                          item.message
                        )}
                        ”
                      </blockquote>

                      <div className="mt-4 flex items-end justify-between gap-2 border-t border-[#CBB994]/30 pt-3">
                        <p className="nj-script-font text-xl text-[#0A211A]/80 sm:text-2xl">
                          {isWriting ? (
                            authorDone ? (
                              <MagicalInkText
                                text={item.author}
                                prefersReducedMotion={prefersReducedMotion}
                                speedMs={40}
                                onComplete={() => finishMagic(item.id)}
                              />
                            ) : (
                              <span className="inline-block min-h-[1.2em] text-[#0A211A]/25">…</span>
                            )
                          ) : (
                            item.author
                          )}
                        </p>
                        <Feather
                          className={`h-3.5 w-3.5 shrink-0 ${
                            isWriting ? "animate-pulse text-[#CBB994]" : "text-[#CBB994]/50"
                          }`}
                          aria-hidden
                        />
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
