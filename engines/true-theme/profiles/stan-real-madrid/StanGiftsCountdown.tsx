"use client";

import React, { useCallback, useEffect, useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Gift, X } from "lucide-react";
import {
  STAN_EVENT,
  getStanEventStartDate,
} from "@lib/stan/event-details";
import {
  STAN_GIFT_CATEGORIES,
  type StanGiftCategoryId,
  type StanPublicGift,
} from "@lib/stan/gifts-catalog";

const EASE = [0.22, 1, 0.36, 1] as const;

type TimeLeft = {
  dias: number;
  horas: number;
  minutos: number;
  segundos: number;
};

function calcTimeLeft(target: Date): TimeLeft {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { dias: 0, horas: 0, minutos: 0, segundos: 0 };
  return {
    dias: Math.floor(diff / (1000 * 60 * 60 * 24)),
    horas: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutos: Math.floor((diff / (1000 * 60)) % 60),
    segundos: Math.floor((diff / 1000) % 60),
  };
}

function CountdownUnit({
  value,
  label,
  index = 0,
}: {
  value: number;
  label: string;
  index?: number;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className="flex flex-col items-center"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.55, delay: 0.08 + index * 0.07, ease: EASE }}
    >
      <motion.span
        key={value}
        className="inline-block font-display text-3xl font-light tabular-nums text-[#F7F4EF] sm:text-4xl"
        initial={reduceMotion ? false : { scale: 1.04 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.28, ease: EASE }}
      >
        {String(value).padStart(2, "0")}
      </motion.span>
      <span className="mt-1 font-body text-[9px] font-semibold uppercase tracking-[0.28em] text-[#C9A86A]">
        {label}
      </span>
    </motion.div>
  );
}

function EditorialCardShell({
  children,
  tone,
  className = "",
}: {
  children: React.ReactNode;
  tone: "light" | "dark";
  className?: string;
}) {
  const light = tone === "light";
  return (
    <div
      className={`relative flex h-full flex-col overflow-hidden ${className}`}
      style={{
        backgroundColor: light ? "#FFFCFA" : "#0A1628",
        boxShadow: light
          ? "0 24px 60px rgba(10,22,40,0.08)"
          : "0 24px 60px rgba(0,0,0,0.35)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-3"
        style={{
          border: light
            ? "1px solid rgba(201,168,106,0.28)"
            : "1px solid rgba(201,168,106,0.22)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-3 top-3 h-4 w-4 border-l border-t"
        style={{ borderColor: "#C9A86A" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 border-b border-r"
        style={{ borderColor: "#C9A86A" }}
      />
      <div className="relative z-10 flex flex-1 flex-col p-7 sm:p-9">{children}</div>
    </div>
  );
}

/**
 * Presentes + Countdown — dois cards lado a lado.
 * Botão abre lista categorizada com Presentear.
 * Isolado ao perfil stan-real-madrid.
 */
export function StanGiftsSection() {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const panelTitleId = useId();

  const [listOpen, setListOpen] = useState(false);
  const [gifts, setGifts] = useState<StanPublicGift[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] =
    useState<StanGiftCategoryId>("brincar");
  const [pendingGift, setPendingGift] = useState<StanPublicGift | null>(null);
  const [guestName, setGuestName] = useState("");
  const [reserving, setReserving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    calcTimeLeft(getStanEventStartDate())
  );
  const eventReached =
    timeLeft.dias === 0 &&
    timeLeft.horas === 0 &&
    timeLeft.minutos === 0 &&
    timeLeft.segundos === 0;

  useEffect(() => {
    const tick = () => setTimeLeft(calcTimeLeft(getStanEventStartDate()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const loadGifts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stan/gifts");
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Erro ao carregar");
      setGifts(data.gifts as StanPublicGift[]);
    } catch {
      setError("Não foi possível carregar a lista de presentes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (listOpen) void loadGifts();
  }, [listOpen, loadGifts]);

  useEffect(() => {
    if (listOpen) {
      document.body.setAttribute("data-stan-panel", "gifts");
    } else {
      document.body.removeAttribute("data-stan-panel");
    }
    return () => {
      document.body.removeAttribute("data-stan-panel");
    };
  }, [listOpen]);

  useEffect(() => {
    if (!listOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (pendingGift) setPendingGift(null);
        else setListOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [listOpen, pendingGift]);

  const filtered = gifts.filter((g) => g.category === activeCategory);

  const handleReserve = async () => {
    if (!pendingGift) return;
    setReserving(true);
    setError(null);
    try {
      const res = await fetch("/api/stan/gifts/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          giftId: pendingGift.id,
          reservedBy: guestName,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Não foi possível reservar.");
        if (data.gifts) setGifts(data.gifts);
        return;
      }
      if (data.gifts) setGifts(data.gifts);
      setSuccessMsg(
        data.giftName
          ? `“${data.giftName}” reservado. Obrigado!`
          : "Presente reservado. Obrigado!"
      );
      setPendingGift(null);
      setGuestName("");
      window.setTimeout(() => setSuccessMsg(null), 3200);
    } catch {
      setError("Ocorreu um erro ao reservar. Tente novamente.");
    } finally {
      setReserving(false);
    }
  };

  return (
    <section
      id="presentes"
      aria-labelledby={titleId}
      className="relative w-full scroll-mt-24 px-4 py-20 sm:scroll-mt-28 sm:px-6 sm:py-28"
      style={{ backgroundColor: "#F7F4EF" }}
    >
      <div className="mx-auto mb-12 max-w-3xl text-center sm:mb-14">
        <span className="font-body text-[10px] font-semibold uppercase tracking-[0.42em] text-[#C9A86A]">
          Antes do grande dia
        </span>
        <h2
          id={titleId}
          className="mt-3 font-display text-[clamp(2rem,4.5vw,3rem)] font-light text-[#0A1628]"
        >
          Presentes & Countdown
        </h2>
        <p className="mx-auto mt-4 max-w-lg font-body text-sm font-light leading-relaxed text-[#5B6B7C]">
          A sua presença é o presente principal. Se desejar oferecer uma
          lembrança ao Stan, explore a lista — e acompanhe a contagem até ao
          apito inicial.
        </p>
      </div>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
        {/* Card Presentes */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.85, ease: EASE }}
        >
          <EditorialCardShell tone="light">
            <span className="font-body text-[10px] font-semibold uppercase tracking-[0.36em] text-[#C9A86A]">
              Guia de presentes
            </span>
            <h3 className="mt-3 font-display text-2xl font-light text-[#0A1628] sm:text-3xl">
              Kit do Pequeno Campeão
            </h3>
            <p className="mt-4 flex-1 font-body text-sm font-light leading-relaxed text-[#5B6B7C]">
              Sugestões organizadas por categorias — brincar, aprender, ar livre
              e criar. Escolha um item e reserve com um clique.
            </p>
            <button
              type="button"
              onClick={() => setListOpen(true)}
              className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 bg-[#0A1628] px-7 py-3.5 font-body text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#F7F4EF] transition hover:bg-[#122038] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A86A]"
            >
              <Gift size={16} className="text-[#C9A86A]" aria-hidden />
              Abrir lista de presentes
            </button>
          </EditorialCardShell>
        </motion.div>

        {/* Card Countdown */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.85, delay: 0.08, ease: EASE }}
        >
          <EditorialCardShell tone="dark">
            <span className="font-body text-[10px] font-semibold uppercase tracking-[0.36em] text-[#C9A86A]">
              Até ao Matchday
            </span>
            <h3 className="mt-3 font-display text-2xl font-light text-[#F7F4EF] sm:text-3xl">
              {eventReached ? "É hoje" : "O apito aproxima-se"}
            </h3>
            <p className="mt-3 font-body text-xs font-light uppercase tracking-[0.2em] text-[#E8DCC8]/70">
              {STAN_EVENT.dateIso.split("-").reverse().join(".")} ·{" "}
              {STAN_EVENT.timeLabel}
            </p>

            {eventReached ? (
              <p className="mt-10 font-display text-xl font-light italic text-[#E8DCC8]">
                O grande dia chegou. Bem-vindo ao Quinto Acto.
              </p>
            ) : (
              <div className="mt-10 flex flex-wrap items-end justify-between gap-4 sm:gap-2">
                <CountdownUnit value={timeLeft.dias} label="Dias" index={0} />
                <span className="pb-6 font-display text-2xl text-[#C9A86A]/50" aria-hidden>
                  :
                </span>
                <CountdownUnit value={timeLeft.horas} label="Horas" index={1} />
                <span className="pb-6 font-display text-2xl text-[#C9A86A]/50" aria-hidden>
                  :
                </span>
                <CountdownUnit value={timeLeft.minutos} label="Min" index={2} />
                <span className="pb-6 font-display text-2xl text-[#C9A86A]/50" aria-hidden>
                  :
                </span>
                <CountdownUnit value={timeLeft.segundos} label="Seg" index={3} />
              </div>
            )}

            <p className="mt-auto pt-10 font-body text-[10px] uppercase tracking-[0.28em] text-[#F7F4EF]/35">
              See you on Matchday
            </p>
          </EditorialCardShell>
        </motion.div>
      </div>

      {/* Painel lista de presentes */}
      <AnimatePresence>
        {listOpen ? (
          <motion.div
            className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={panelTitleId}
          >
            <button
              type="button"
              className="absolute inset-0 bg-[#07101C]/70 backdrop-blur-sm"
              aria-label="Fechar lista de presentes"
              onClick={() => {
                setPendingGift(null);
                setListOpen(false);
              }}
            />

            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.45, ease: EASE }}
              className="relative z-10 flex max-h-[92svh] w-full max-w-2xl flex-col overflow-hidden bg-[#FFFCFA] shadow-2xl sm:max-h-[85vh]"
            >
              <div className="flex items-start justify-between border-b border-[#C9A86A]/25 px-5 py-5 sm:px-7">
                <div>
                  <span className="font-body text-[10px] font-semibold uppercase tracking-[0.36em] text-[#C9A86A]">
                    Plantel de presentes
                  </span>
                  <h3
                    id={panelTitleId}
                    className="mt-1 font-display text-2xl font-light text-[#0A1628]"
                  >
                    Kit do Pequeno Campeão
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPendingGift(null);
                    setListOpen(false);
                  }}
                  className="flex min-h-11 min-w-11 items-center justify-center text-[#0A1628] transition hover:text-[#C9A86A]"
                  aria-label="Fechar"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Categorias */}
              <div className="flex gap-2 overflow-x-auto border-b border-[#E8DCC8] px-4 py-3 sm:px-6">
                {STAN_GIFT_CATEGORIES.map((cat) => {
                  const active = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategory(cat.id)}
                      className={`shrink-0 px-3 py-2 font-body text-[10px] font-semibold uppercase tracking-[0.16em] transition ${
                        active
                          ? "bg-[#0A1628] text-[#F7F4EF]"
                          : "bg-transparent text-[#5B6B7C] hover:text-[#0A1628]"
                      }`}
                    >
                      {cat.title}
                    </button>
                  );
                })}
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="font-body text-xs font-light text-[#5B6B7C]">
                    {
                      STAN_GIFT_CATEGORIES.find((c) => c.id === activeCategory)
                        ?.subtitle
                    }
                  </p>
                  <span className="shrink-0 font-body text-[9px] font-semibold uppercase tracking-[0.28em] text-[#C9A86A]/80">
                    Plantel ·{" "}
                    {String(
                      gifts.filter((g) => g.category === activeCategory).length
                    ).padStart(2, "0")}
                  </span>
                </div>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-14 text-center">
                    <span className="font-body text-[10px] font-semibold uppercase tracking-[0.36em] text-[#C9A86A]">
                      A formar o plantel…
                    </span>
                    <p className="mt-3 font-body text-sm font-light text-[#5B6B7C]">
                      A carregar convocados
                    </p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div
                    role="status"
                    className="relative overflow-hidden border border-[#C9A86A]/25 bg-[#0A1628] px-5 py-10 text-center sm:px-8 sm:py-12"
                  >
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-3 border border-[#C9A86A]/15"
                    />
                    {/* Camisas fantasma — plantel por preencher */}
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-end justify-center gap-3 opacity-[0.07] sm:gap-5"
                    >
                      {["01", "05", "07", "09", "10"].map((n) => (
                        <span
                          key={n}
                          className="font-display text-[3.25rem] font-light leading-none text-[#F7F4EF] sm:text-[4.25rem]"
                        >
                          {n}
                        </span>
                      ))}
                    </div>

                    <div className="relative z-10">
                      <div className="mx-auto flex h-14 w-14 flex-col items-center justify-center rounded-full border border-[#C9A86A]/45 bg-[#0A1628]">
                        <span className="font-body text-[8px] font-bold tracking-[0.24em] text-[#C9A86A]">
                          S · 5
                        </span>
                        <span className="font-display text-lg font-light leading-none text-[#F7F4EF]">
                          —
                        </span>
                      </div>

                      <p className="mt-5 font-body text-[10px] font-semibold uppercase tracking-[0.36em] text-[#C9A86A]">
                        {gifts.length === 0
                          ? "Plantel por anunciar"
                          : "Posição livre"}
                      </p>
                      <p className="mt-3 font-display text-xl font-light text-[#F7F4EF] sm:text-2xl">
                        {gifts.length === 0
                          ? "O plantel ainda está a ser formado"
                          : "Nenhum convocado nesta posição"}
                      </p>
                      <p className="mx-auto mt-3 max-w-sm font-body text-sm font-light leading-relaxed text-[#F7F4EF]/55">
                        {gifts.length === 0
                          ? "Em breve entram as primeiras sugestões no Kit do Pequeno Campeão. A sua presença continua a ser o presente principal."
                          : "Esta categoria não tem itens disponíveis de momento. Explore outra posição do plantel — ou volte mais tarde."}
                      </p>

                      {gifts.length > 0 ? (
                        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                          {STAN_GIFT_CATEGORIES.filter(
                            (c) => c.id !== activeCategory
                          ).map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setActiveCategory(cat.id)}
                              className="border border-[#C9A86A]/35 px-3 py-2 font-body text-[10px] font-bold uppercase tracking-[0.16em] text-[#F7F4EF] transition hover:border-[#C9A86A] hover:bg-[#C9A86A]/12"
                            >
                              {cat.title}
                            </button>
                          ))}
                        </div>
                      ) : null}

                      <p className="mt-8 font-body text-[9px] uppercase tracking-[0.32em] text-[#C9A86A]/60">
                        See you on Matchday
                      </p>
                    </div>
                  </div>
                ) : (
                  <ul className="space-y-2" aria-label="Plantel de presentes">
                    {filtered.map((gift, index) => {
                      const reserved = gift.status === "reserved";
                      const shirt = String(index + 1).padStart(2, "0");
                      return (
                        <li
                          key={gift.id}
                          className="flex items-center justify-between gap-4 border border-[#E8DCC8] bg-white px-4 py-3.5"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span
                              aria-hidden
                              className={`shrink-0 font-display text-sm font-light tabular-nums ${
                                reserved
                                  ? "text-[#C9A86A]/45"
                                  : "text-[#C9A86A]"
                              }`}
                            >
                              {shirt}
                            </span>
                            <span
                              className={`font-body text-sm font-light leading-snug ${
                                reserved
                                  ? "text-[#5B6B7C] line-through decoration-[#C9A86A]/50"
                                  : "text-[#0A1628]"
                              }`}
                            >
                              {gift.name}
                            </span>
                          </div>
                          {reserved ? (
                            <span className="shrink-0 font-body text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C9A86A]">
                              Fora · Reservado
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setError(null);
                                setPendingGift(gift);
                              }}
                              className="shrink-0 border border-[#0A1628] px-3 py-2 font-body text-[10px] font-bold uppercase tracking-[0.18em] text-[#0A1628] transition hover:bg-[#0A1628] hover:text-[#F7F4EF]"
                            >
                              Presentear
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}

                {error && !pendingGift ? (
                  <p className="mt-4 font-body text-xs text-red-700" role="alert">
                    {error}
                  </p>
                ) : null}
                {successMsg ? (
                  <p
                    className="mt-4 font-body text-xs text-[#0A1628]"
                    role="status"
                  >
                    {successMsg}
                  </p>
                ) : null}
              </div>

              {/* Confirmar presentear */}
              <AnimatePresence>
                {pendingGift ? (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    className="border-t border-[#C9A86A]/30 bg-[#F7F4EF] px-5 py-5 sm:px-7"
                  >
                    <p className="font-display text-lg font-light text-[#0A1628]">
                      Presentear
                    </p>
                    <p className="mt-1 font-body text-sm font-light text-[#5B6B7C]">
                      {pendingGift.name}
                    </p>
                    <label className="mt-4 block">
                      <span className="font-body text-[10px] font-semibold uppercase tracking-[0.24em] text-[#C9A86A]">
                        O seu nome
                      </span>
                      <input
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="Nome completo"
                        autoComplete="name"
                        className="mt-2 w-full border border-[#E8DCC8] bg-white px-3 py-3 font-body text-sm text-[#0A1628] outline-none focus:border-[#C9A86A]"
                      />
                    </label>
                    {error ? (
                      <p className="mt-2 font-body text-xs text-red-700" role="alert">
                        {error}
                      </p>
                    ) : null}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={reserving}
                        onClick={() => void handleReserve()}
                        className="min-h-11 bg-[#C9A86A] px-5 py-2.5 font-body text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#07101C] transition hover:bg-[#D4B87A] disabled:opacity-60"
                      >
                        {reserving ? "A reservar…" : "Confirmar"}
                      </button>
                      <button
                        type="button"
                        disabled={reserving}
                        onClick={() => {
                          setPendingGift(null);
                          setError(null);
                        }}
                        className="min-h-11 border border-[#0A1628]/20 px-5 py-2.5 font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0A1628]"
                      >
                        Cancelar
                      </button>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
