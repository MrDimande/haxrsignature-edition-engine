"use client";

import React, { useEffect, useId, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { Feather, CheckCircle2, MessageSquareQuote } from "lucide-react";
import { type QueenKailaneGuestbookEntry } from "@lib/queen-kailane/event-details";
import { buildEditionRsvpStorageKey } from "@lib/rsvp/storage-keys";
import { QUEEN_COLORS, QUEEN_EASE } from "./queen-motion";
import { QUEEN_GRACE_ARC } from "./queen-constants";

const STORAGE_KEY_BENCAOS = "haxr_queen_kailane_livro_bencaos_v1";

const RELATIONS = [
  "Padrinho / Madrinha",
  "Família",
  "Amigo(a)",
  "Irmão(ã) na Fé",
] as const;

function loadStoredBlessings(): QueenKailaneGuestbookEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_BENCAOS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredBlessings(entries: QueenKailaneGuestbookEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY_BENCAOS, JSON.stringify(entries));
  } catch {
    /* ignore quota */
  }
}

function getStoredRsvpName(): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = window.localStorage.getItem(
      buildEditionRsvpStorageKey("queenkailanecrisma")
    );
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    return typeof parsed?.name === "string" ? parsed.name.trim() : "";
  } catch {
    return "";
  }
}

export function QueenKailaneLivroDasBencaos() {
  const reduceMotion = useReducedMotion();
  const formId = useId();
  const [name, setName] = useState("");
  const [relation, setRelation] = useState<string>(RELATIONS[1]);
  const [message, setMessage] = useState("");
  const [userEntries, setUserEntries] = useState<QueenKailaneGuestbookEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const stored = loadStoredBlessings();
    setUserEntries(stored);

    const rsvpName = getStoredRsvpName();
    if (rsvpName) {
      setName(rsvpName);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!name.trim()) {
      setErrorMessage("Por favor, indique o seu nome.");
      return;
    }

    if (!message.trim()) {
      setErrorMessage("Por favor, escreva a sua bênção ou oração.");
      return;
    }

    if (message.trim().length < 5) {
      setErrorMessage("A sua mensagem deve ter pelo menos 5 caracteres.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    const newEntry: QueenKailaneGuestbookEntry = {
      id: `user-blessing-${Date.now()}`,
      name: name.trim(),
      relation: relation || "Familiar / Amigo",
      message: message.trim(),
      dateDisplay: "Agosto de 2026",
      isInitial: false,
    };

    const updated = [newEntry, ...userEntries];
    setUserEntries(updated);
    saveStoredBlessings(updated);

    setMessage("");
    setSubmitting(false);
    setSubmittedSuccess(true);
    setTimeout(() => setSubmittedSuccess(false), 4500);
  };

  return (
    <section
      id="queen-bencaos"
      className="relative px-6 py-28 md:py-36 overflow-hidden"
      style={{ backgroundColor: QUEEN_COLORS.pearl }}
      aria-labelledby="queen-bencaos-title"
    >
      {/* Arco Decorativo no topo da secção */}
      <div
        className="mx-auto mb-6 h-6 w-36 opacity-65"
        style={{ color: QUEEN_COLORS.goldMatte }}
        aria-hidden="true"
      >
        <svg viewBox={QUEEN_GRACE_ARC.viewBox} className="h-full w-full">
          <path
            d={QUEEN_GRACE_ARC.pathTopArc}
            fill="none"
            stroke="currentColor"
            strokeWidth={QUEEN_GRACE_ARC.strokeWidth}
          />
        </svg>
      </div>

      <div className="mx-auto max-w-2xl text-center">
        <motion.p
          className="text-center text-[0.65rem] tracking-[0.4em]"
          style={{
            fontFamily:
              "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
            color: QUEEN_COLORS.goldMatte,
          }}
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: QUEEN_EASE }}
        >
          FÓLIO SAGRADO · O LIVRO DAS BÊNÇÃOS
        </motion.p>

        <motion.h2
          id="queen-bencaos-title"
          className="mt-4 text-center text-[clamp(1.5rem,4.5vw,2.25rem)] font-light leading-snug tracking-[0.06em]"
          style={{
            fontFamily:
              'var(--font-cormorant), "Cormorant Garamond", Georgia, serif',
            color: QUEEN_COLORS.ink,
          }}
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease: QUEEN_EASE }}
        >
          Orações & Mensagens de Luz
        </motion.h2>

        <motion.p
          className="mx-auto mt-4 max-w-lg text-[0.88rem] leading-relaxed text-[#736B62]"
          style={{
            fontFamily:
              'var(--font-cormorant), "Cormorant Garamond", Georgia, serif',
            fontStyle: "italic",
          }}
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.1, ease: QUEEN_EASE }}
        >
          «Deixe uma oração, versículo ou palavra de carinho gravada para
          abençoar a caminhada de fé da Queen Kailane.»
        </motion.p>
      </div>

      {/* Formulário de Bênção */}
      <motion.div
        className="mx-auto mt-12 max-w-lg rounded-sm p-6 sm:p-8"
        style={{
          backgroundColor: "#FFFDFC",
          border: `1px solid ${QUEEN_COLORS.champagne}`,
          boxShadow: "0 10px 30px rgba(115, 107, 98, 0.06)",
        }}
        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: QUEEN_EASE }}
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-5 text-left">
          {/* Nome */}
          <div>
            <label
              htmlFor={`${formId}-name`}
              className="mb-1.5 block text-[0.62rem] uppercase tracking-[0.24em]"
              style={{
                fontFamily:
                  "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
                color: QUEEN_COLORS.taupe,
              }}
            >
              O Seu Nome
            </label>
            <input
              id={`${formId}-name`}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Padrinho Carlos ou Tia Helena"
              className="w-full border px-4 py-2.5 text-[0.85rem] transition-colors focus:outline-none focus:ring-1 focus:ring-[#B9975B]"
              style={{
                borderColor: QUEEN_COLORS.champagne,
                backgroundColor: "rgba(255, 253, 252, 0.9)",
                color: QUEEN_COLORS.ink,
                fontFamily:
                  "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
              }}
            />
          </div>

          {/* Vínculo Espiritual */}
          <div>
            <label
              className="mb-2 block text-[0.62rem] uppercase tracking-[0.24em]"
              style={{
                fontFamily:
                  "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
                color: QUEEN_COLORS.taupe,
              }}
            >
              Vínculo / Relação
            </label>
            <div className="flex flex-wrap gap-2">
              {RELATIONS.map((rel) => {
                const active = relation === rel;
                return (
                  <button
                    key={rel}
                    type="button"
                    onClick={() => setRelation(rel)}
                    className="rounded-full px-3 py-1 text-[0.6rem] uppercase tracking-[0.14em] transition-all"
                    style={{
                      fontFamily:
                        "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
                      border: `1px solid ${
                        active ? QUEEN_COLORS.goldMatte : "rgba(185, 151, 91, 0.3)"
                      }`,
                      backgroundColor: active
                        ? "rgba(185, 151, 91, 0.12)"
                        : "transparent",
                      color: active ? QUEEN_COLORS.goldMatte : QUEEN_COLORS.inkSoft,
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    {rel}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mensagem / Oração */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor={`${formId}-message`}
                className="block text-[0.62rem] uppercase tracking-[0.24em]"
                style={{
                  fontFamily:
                    "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
                  color: QUEEN_COLORS.taupe,
                }}
              >
                A sua Bênção ou Oração
              </label>
              <span className="text-[0.58rem] tracking-wider text-[#A59D94]">
                {message.length}/350
              </span>
            </div>
            <textarea
              id={`${formId}-message`}
              rows={3}
              maxLength={350}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Que o Senhor te guarde e ilumine os teus passos..."
              className="w-full resize-none border p-3 text-[0.92rem] leading-relaxed transition-colors focus:outline-none focus:ring-1 focus:ring-[#B9975B]"
              style={{
                borderColor: QUEEN_COLORS.champagne,
                backgroundColor: "rgba(255, 253, 252, 0.9)",
                color: QUEEN_COLORS.ink,
                fontFamily:
                  'var(--font-cormorant), "Cormorant Garamond", Georgia, serif',
              }}
            />
          </div>

          {errorMessage ? (
            <p
              className="text-center text-[0.68rem] tracking-wide text-[#A14332]"
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}

          {submittedSuccess ? (
            <div className="flex items-center justify-center gap-2 text-[0.68rem] tracking-wide text-[#20BA5A]">
              <CheckCircle2 size={14} />
              <span>A sua bênção foi gravada no Livro da Fé com gratidão!</span>
            </div>
          ) : null}

          {/* Botão Submeter com Ícone de Pena/Caligrafia Solene */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex min-h-11 items-center justify-center gap-2 border px-6 py-3 text-[0.65rem] uppercase tracking-[0.24em] transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
              fontFamily:
                "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
              color: QUEEN_COLORS.ink,
              borderColor: QUEEN_COLORS.goldMatte,
              background:
                "linear-gradient(180deg, rgba(255,253,252,0.98), rgba(246,241,232,0.85))",
              outlineColor: QUEEN_COLORS.goldMatte,
            }}
          >
            <Feather size={14} strokeWidth={1.5} className="text-[#B9975B]" />
            <span>{submitting ? "A GRAVAR..." : "GRAVAR NO LIVRO DAS BÊNÇÃOS"}</span>
          </button>
        </form>
      </motion.div>

      {/* Mural dos Fólios / Mensagens */}
      <div className="mx-auto mt-16 max-w-4xl">
        {userEntries.length === 0 ? (
          <motion.div
            className="mx-auto max-w-md rounded-sm p-8 text-center"
            style={{
              border: "1px dashed rgba(185, 151, 91, 0.35)",
              backgroundColor: "rgba(255, 253, 252, 0.6)",
            }}
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: QUEEN_EASE }}
          >
            <div className="mx-auto flex h-10 w-10 items-center justify-center text-[#B9975B]">
              <Feather size={20} strokeWidth={1.3} aria-hidden />
            </div>
            <p
              className="mt-3 text-[0.95rem] italic leading-relaxed text-[#736B62]"
              style={{
                fontFamily:
                  'var(--font-cormorant), "Cormorant Garamond", Georgia, serif',
              }}
            >
              As páginas deste Livro de Fé aguardam as primeiras orações e bênçãos.
              <br />
              Seja o primeiro a deixar uma dedicatória para a Queen Kailane.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <AnimatePresence>
              {userEntries.map((entry, index) => (
                <motion.article
                  key={entry.id}
                  className="relative flex flex-col justify-between rounded-sm p-6 text-left transition-all"
                  style={{
                    backgroundColor: "#FFFDFC",
                    border: "1px solid rgba(185, 151, 91, 0.4)",
                    boxShadow: "0 6px 20px rgba(115, 107, 98, 0.04)",
                  }}
                  initial={
                    reduceMotion
                      ? false
                      : { opacity: 0, y: 12, scale: 0.98 }
                  }
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.8,
                    delay: Math.min(index * 0.08, 0.4),
                    ease: QUEEN_EASE,
                  }}
                >
                  {/* Ícone editorial */}
                  <div className="flex items-center justify-between pb-3">
                    <span
                      className="text-[0.56rem] font-semibold uppercase tracking-[0.24em]"
                      style={{
                        fontFamily:
                          "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
                        color: QUEEN_COLORS.goldMatte,
                      }}
                    >
                      {entry.relation || "BÊNÇÃO"}
                    </span>
                    <MessageSquareQuote
                      size={16}
                      strokeWidth={1.2}
                      className="text-[#D8BE87] opacity-60"
                      aria-hidden
                    />
                  </div>

                  {/* Texto da Bênção */}
                  <blockquote
                    className="my-3 text-[1.05rem] italic leading-relaxed text-[#3F3832]"
                    style={{
                      fontFamily:
                        'var(--font-cormorant), "Cormorant Garamond", Georgia, serif',
                    }}
                  >
                    «{entry.message}»
                  </blockquote>

                  {/* Assinatura */}
                  <div
                    className="mt-4 pt-3 flex items-center justify-between border-t text-[0.6rem] tracking-widest text-[#736B62]"
                    style={{
                      borderColor: "rgba(231, 215, 193, 0.6)",
                      fontFamily:
                        "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
                    }}
                  >
                    <span className="font-medium text-[#3F3832]">
                      {entry.name}
                    </span>
                    <span className="text-[0.54rem] uppercase opacity-75">
                      {entry.dateDisplay}
                    </span>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
}
