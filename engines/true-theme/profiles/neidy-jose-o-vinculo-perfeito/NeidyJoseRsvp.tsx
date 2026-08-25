"use client";

import { NEIDY_JOSE_CONSTANTS } from "@lib/neidy-jose/constants";
import { submitUniversalRsvp } from "@lib/rsvp/universal-client";
import { toPng } from "html-to-image";
import {
  CheckCircle2,
  Download,
  MessageCircle,
  XCircle,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import Image from "next/image";
import React, { useRef, useState } from "react";

interface NeidyJoseRsvpProps {
  prefersReducedMotion?: boolean;
}

function buildTicketCode(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  const stamp = Date.now().toString(36).slice(-5).toUpperCase();
  return `NJ-${initials || "GV"}-${stamp}`;
}

/** Inline letter fields — feel like writing on paper */
const inkLine =
  "w-full border-0 border-b border-[#0A211A]/25 bg-transparent px-0 py-1.5 font-serif text-base italic text-[#0A211A] outline-none transition-colors placeholder:text-[#0A211A]/30 focus:border-[#CBB994] sm:text-lg";

export function NeidyJoseRsvp({ prefersReducedMotion = false }: NeidyJoseRsvpProps) {
  const duration = prefersReducedMotion ? 0.01 : 1.0;
  const ease = [0.16, 1, 0.3, 1] as const;
  const ticketRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const springX = useSpring(mx, { stiffness: 100, damping: 20 });
  const springY = useSpring(my, { stiffness: 100, damping: 20 });
  const rotateX = useTransform(springY, [-0.5, 0.5], [5, -5]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-6, 6]);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [isAttending, setIsAttending] = useState<boolean | null>(null);
  const [guestsCount, setGuestsCount] = useState("1");
  const [companionOne, setCompanionOne] = useState("");
  const [companionTwo, setCompanionTwo] = useState("");
  const [dietaryOrNotes, setDietaryOrNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketCode, setTicketCode] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const supportWhatsApp = process.env.NEXT_PUBLIC_EDITION_NEIDY_JOSE_WHATSAPP
    ?.replace(/\D/g, "")
    .trim();

  const onMove = (e: React.MouseEvent) => {
    if (prefersReducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  const companionNames = [companionOne, companionTwo]
    .map((n) => n.trim())
    .filter(Boolean)
    .join(", ");

  const companionsNeeded = Math.max(0, parseInt(guestsCount, 10) - 1);
  const companionsFilled =
    companionsNeeded === 0 ||
    (companionsNeeded === 1 && companionOne.trim().length > 0) ||
    (companionsNeeded === 2 &&
      companionOne.trim().length > 0 &&
      companionTwo.trim().length > 0);

  const handleGuestsChange = (value: string) => {
    setGuestsCount(value);
    const n = parseInt(value, 10);
    if (n < 3) setCompanionTwo("");
    if (n < 2) setCompanionOne("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || isAttending === null) return;
    if (isAttending && !companionsFilled) return;
    if (isAttending && !phone.trim()) {
      setErrorMessage("Indique um contacto para registar a sua confirmação.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    const code = buildTicketCode(fullName);

    const guests = isAttending ? parseInt(guestsCount, 10) : 0;
    const messageForBride = [
      companionNames ? `Acompanhantes: ${companionNames}` : "",
      dietaryOrNotes.trim(),
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      try {
        const { outcome } = await submitUniversalRsvp(
          {
            slug: "neidyejosewedding",
            name: fullName.trim(),
            phone: phone.trim() || undefined,
            attending: isAttending,
            guests,
            messageForBride: messageForBride || undefined,
            honeypot: "",
          },
          controller.signal
        );

        if (outcome.kind !== "success" && outcome.kind !== "persisted_partial") {
          setErrorMessage(outcome.message);
          return;
        }
      } finally {
        clearTimeout(timeout);
      }

      try {
        localStorage.setItem(
          "nj_rsvp_submission",
          JSON.stringify({
            fullName,
            phone,
            isAttending,
            guestsCount: isAttending ? guestsCount : 0,
            guestNames: isAttending ? companionNames : "",
            companionOne: isAttending ? companionOne.trim() : "",
            companionTwo: isAttending ? companionTwo.trim() : "",
            dietaryOrNotes,
            ticketCode: code,
            submittedAt: new Date().toISOString(),
          })
        );
      } catch {
        /* ignore */
      }

      setTicketCode(code);
      setIsSubmitted(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error && error.name === "AbortError"
          ? "O pedido demorou demasiado. Tente novamente."
          : "Não foi possível registar a confirmação. Tente novamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const openWhatsApp = () => {
    const attendanceText = isAttending
      ? "✅ SIM, confirmo a minha presença"
      : "❌ Infelizmente não poderei comparecer";

    let message =
      `*CONFIRMAÇÃO — ${NEIDY_JOSE_CONSTANTS.coupleTitle}*\n` +
      `05/12/2026 · Espaço Águia\n\n` +
      `*Nome:* ${fullName.trim()}\n` +
      (phone ? `*Contacto:* ${phone.trim()}\n` : "") +
      `*Presença:* ${attendanceText}\n`;

    if (isAttending) {
      message += `*Pessoas:* ${guestsCount}\n`;
      if (companionNames) message += `*Acompanhantes:* ${companionNames}\n`;
      message += `*Ticket:* ${ticketCode}\n`;
    }
    if (dietaryOrNotes.trim()) {
      message += `*Nota:* ${dietaryOrNotes.trim()}\n`;
    }
    message += `\n_Convite HAXR Signature_`;

    const base = supportWhatsApp
      ? `https://wa.me/${supportWhatsApp}`
      : "https://wa.me/";
    window.open(`${base}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const downloadTicket = async () => {
    if (!ticketRef.current || !isAttending) return;
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(ticketRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#0A211A",
      });
      const link = document.createElement("a");
      link.download = `ticket-neidy-jose-${ticketCode}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <section
      id="rsvp"
      className="nj-section-full nj-section-rise relative w-full overflow-hidden bg-[#FBFBFA] py-16 sm:py-20 md:py-28"
    >
      <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center px-5 text-center sm:px-8">
        <motion.p
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration, ease }}
          className="mb-3 font-body text-[10px] uppercase tracking-[0.4em] text-[#3B6456]"
        >
          Uma carta aos noivos
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration, delay: 0.08, ease }}
          className="nj-script-font mb-3 text-4xl text-[#CBB994] sm:text-5xl"
        >
          RSVP
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration, delay: 0.12 }}
          className="mb-10 max-w-md font-serif text-sm italic leading-relaxed text-[#3B6456] sm:mb-12 sm:text-base"
        >
          Escreva-nos como quem responde a um convite à mão.
          <br className="hidden sm:block" />
          Até {NEIDY_JOSE_CONSTANTS.rsvpDeadlineFormatted}.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration, delay: 0.15, ease }}
          style={{ perspective: 1400 }}
          className="w-full max-w-xl"
        >
          <motion.div
            ref={cardRef}
            onMouseMove={onMove}
            onMouseLeave={onLeave}
            style={
              prefersReducedMotion
                ? undefined
                : { rotateX, rotateY, transformStyle: "preserve-3d" }
            }
            className="nj-letter-frame nj-letter-emerge"
          >
            {/* Soft emerald glow under frame */}
            <div
              className="pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] bg-[radial-gradient(ellipse_at_center,rgba(45,90,76,0.22),transparent_70%)] blur-2xl"
              aria-hidden
            />

            <div className="nj-letter-paper">
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
                }}
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(203,185,148,0.2),transparent_45%)]"
                aria-hidden
              />

              <div className="relative z-10 px-7 py-10 text-left sm:px-11 sm:py-12 md:px-12 md:py-14">
              <AnimatePresence mode="wait">
                {!isSubmitted ? (
                  <form onSubmit={handleSubmit} className="flex flex-col">
                    {/* Letterhead with monogram */}
                    <div className="mb-9 flex flex-col items-center text-center">
                      <div className="relative mb-4 h-14 w-14 sm:h-16 sm:w-16">
                        <Image
                          src={NEIDY_JOSE_CONSTANTS.hero.monogram}
                          alt=""
                          fill
                          unoptimized
                          quality={100}
                          className="object-contain opacity-80"
                          aria-hidden
                        />
                      </div>
                      <p className="nj-script-font text-3xl text-[#CBB994] sm:text-4xl">
                        Neidy Marino & José Cabral Mateus
                      </p>
                      <div className="nj-letter-ornament my-4" aria-hidden />
                      <p className="font-body text-[9px] uppercase tracking-[0.42em] text-[#3B6456]">
                        Carta de confirmação
                      </p>
                    </div>

                    <p className="mb-8 text-right font-serif text-sm italic text-[#3B6456]">
                      Maputo, Dezembro de 2026
                    </p>

                    <p className="mb-6 font-serif text-lg italic text-[#0A211A] sm:text-xl">
                      Queridos Neidy e José,
                    </p>

                    <p className="mb-1 font-serif text-base leading-relaxed text-[#0A211A]/80 sm:text-lg">
                      Eu,{" "}
                      <label htmlFor="nj-name" className="sr-only">
                        Nome completo
                      </label>
                      <input
                        id="nj-name"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className={`${inkLine} mt-1 inline-block max-w-full sm:mt-0`}
                        placeholder="escrevo o meu nome aqui…"
                        aria-label="Nome completo"
                      />
                    </p>

                    <p className="mb-8 mt-5 font-serif text-base leading-relaxed text-[#0A211A]/80 sm:text-lg">
                      e deixo o meu contacto{" "}
                      <label htmlFor="nj-phone" className="sr-only">
                        Contacto
                      </label>
                      <input
                        id="nj-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={inkLine}
                        placeholder="+258 …"
                        aria-label="Contacto"
                      />
                    </p>

                    <p className="-mt-5 mb-8 font-body text-[10px] uppercase tracking-[0.2em] text-[#3B6456]/75">
                      A confirmação será registada no sistema HAXR.
                    </p>

                    <p className="mb-5 font-serif text-base italic leading-relaxed text-[#0A211A]/85 sm:text-lg">
                      para vos dizer, com o coração, que:
                    </p>

                    <div className="mb-8 flex flex-col gap-3">
                      <button
                        type="button"
                        onClick={() => setIsAttending(true)}
                        className={`flex items-start gap-3 rounded-xl px-3.5 py-3.5 text-left transition-colors ${
                          isAttending === true
                            ? "bg-[rgba(10,33,26,0.07)] ring-1 ring-[#CBB994]/55"
                            : "hover:bg-[rgba(10,33,26,0.03)]"
                        }`}
                      >
                        <CheckCircle2
                          className={`mt-0.5 h-5 w-5 shrink-0 ${
                            isAttending === true ? "text-[#2D5A4C]" : "text-[#0A211A]/25"
                          }`}
                        />
                        <span className="font-serif text-base italic leading-snug text-[#0A211A] sm:text-lg">
                          Sim — estarei presente no vosso dia.
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAttending(false)}
                        className={`flex items-start gap-3 rounded-xl px-3.5 py-3.5 text-left transition-colors ${
                          isAttending === false
                            ? "bg-[rgba(10,33,26,0.07)] ring-1 ring-[#CBB994]/55"
                            : "hover:bg-[rgba(10,33,26,0.03)]"
                        }`}
                      >
                        <XCircle
                          className={`mt-0.5 h-5 w-5 shrink-0 ${
                            isAttending === false ? "text-[#0A211A]/60" : "text-[#0A211A]/25"
                          }`}
                        />
                        <span className="font-serif text-base italic leading-snug text-[#0A211A] sm:text-lg">
                          Lamentavelmente, não poderei comparecer.
                        </span>
                      </button>
                    </div>

                    {isAttending === true && (
                      <div className="nj-companion-card mb-8 space-y-5 px-5 py-6 sm:px-6">
                        <div className="flex flex-col items-center text-center">
                          <p className="font-body text-[9px] uppercase tracking-[0.35em] text-[#CBB994]">
                            Acompanhantes
                          </p>
                          <p className="mt-1 font-serif text-sm italic text-[#3B6456]">
                            Convite até +2
                          </p>
                        </div>

                        <p className="text-center font-serif text-base leading-relaxed text-[#0A211A]/80 sm:text-lg">
                          Viremos em{" "}
                          <select
                            id="nj-guests"
                            value={guestsCount}
                            onChange={(e) => handleGuestsChange(e.target.value)}
                            className="mx-1 cursor-pointer border-0 border-b border-[#0A211A]/25 bg-transparent py-0.5 font-serif text-base italic text-[#0A211A] outline-none focus:border-[#CBB994] sm:text-lg"
                            aria-label="Total de pessoas (máximo 3 — convite +2)"
                          >
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                          </select>{" "}
                          {parseInt(guestsCount, 10) === 1 ? "pessoa." : "pessoas."}
                        </p>

                        {companionsNeeded >= 1 && (
                          <div>
                            <p className="mb-2 font-serif text-sm italic text-[#3B6456]">
                              Nome do/a acompanhante *
                            </p>
                            <input
                              id="nj-companion-1"
                              required
                              value={companionOne}
                              onChange={(e) => setCompanionOne(e.target.value)}
                              className={inkLine}
                              placeholder="Escreva o nome do/a acompanhante…"
                              aria-label="Nome do primeiro acompanhante"
                            />
                          </div>
                        )}

                        {companionsNeeded >= 2 && (
                          <div>
                            <p className="mb-2 font-serif text-sm italic text-[#3B6456]">
                              Nome do/a 2.º acompanhante *
                            </p>
                            <input
                              id="nj-companion-2"
                              required
                              value={companionTwo}
                              onChange={(e) => setCompanionTwo(e.target.value)}
                              className={inkLine}
                              placeholder="Escreva o nome do/a 2.º acompanhante…"
                              aria-label="Nome do segundo acompanhante"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mb-8">
                      <p className="mb-2 font-serif text-sm italic text-[#3B6456]">
                        Se desejar acrescentar uma palavra…
                      </p>
                      <textarea
                        id="nj-notes"
                        rows={3}
                        value={dietaryOrNotes}
                        onChange={(e) => setDietaryOrNotes(e.target.value)}
                        className="w-full resize-none border-0 border-b border-[#0A211A]/20 bg-transparent px-0 py-2 font-serif text-base italic leading-relaxed text-[#0A211A] outline-none placeholder:text-[#0A211A]/30 focus:border-[#CBB994]"
                        placeholder="Mensagem, restrições alimentares, ou um desejo…"
                      />
                    </div>

                    <p className="mb-1 font-serif text-base italic text-[#0A211A]/80 sm:text-lg">
                      Com afecto e gratidão,
                    </p>
                    <p className="nj-script-font mb-10 min-h-[2.5rem] text-2xl text-[#0A211A]/70 sm:text-3xl">
                      {fullName.trim() || "—"}
                    </p>

                    <div className="flex flex-col items-center gap-4">
                      {errorMessage ? (
                        <p className="max-w-sm text-center font-serif text-sm italic text-[#8B2E2E]">
                          {errorMessage}
                        </p>
                      ) : null}
                      <button
                        type="submit"
                        disabled={
                          isSubmitting ||
                          !fullName.trim() ||
                          isAttending === null ||
                          (isAttending === true && !companionsFilled)
                        }
                        className="group relative flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full bg-[#0A211A] shadow-[0_16px_40px_-10px_rgba(10,33,26,0.65),0_0_0_1px_rgba(203,185,148,0.35)] transition-transform hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 sm:h-[4.75rem] sm:w-[4.75rem]"
                        aria-label="Selar e enviar a carta"
                      >
                        <span className="absolute inset-[3px] rounded-full border border-[#CBB994]/55" />
                        <span className="absolute inset-[7px] rounded-full border border-[#CBB994]/25" />
                        <span className="nj-script-font relative z-10 text-2xl text-[#CBB994] sm:text-[1.65rem]">
                          {isSubmitting ? "…" : "NJ"}
                        </span>
                      </button>
                      <p className="font-body text-[9px] uppercase tracking-[0.35em] text-[#3B6456]">
                        {isSubmitting ? "A selar a carta…" : "Toque no selo para enviar"}
                      </p>
                    </div>
                  </form>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center gap-6 text-center"
                  >
                    <p className="nj-script-font text-3xl text-[#CBB994] sm:text-4xl">
                      Carta recebida
                    </p>
                    <p className="max-w-sm font-serif text-base italic leading-relaxed text-[#0A211A]/80 sm:text-lg">
                      {isAttending
                        ? `Obrigado, ${fullName}. A sua presença foi registada e o vosso lugar está guardado.`
                        : `Obrigado, ${fullName}. A sua resposta foi registada com carinho.`}
                    </p>

                    {isAttending && (
                      <>
                        <div
                          ref={ticketRef}
                          className="nj-depth-card relative w-full max-w-sm overflow-hidden rounded-2xl border border-[#CBB994]/50 bg-[#0A211A] p-6 text-[#FCFDFC]"
                        >
                          <div className="absolute inset-0 opacity-15">
                            <Image
                              src={NEIDY_JOSE_CONSTANTS.hero.monogram}
                              alt=""
                              fill
                              unoptimized
                              className="object-contain p-10"
                            />
                          </div>
                          <div className="relative z-10 flex flex-col items-center gap-3">
                            <p className="font-body text-[9px] uppercase tracking-[0.4em] text-[#CBB994]">
                              Ticket de presença
                            </p>
                            <p className="nj-script-font text-3xl text-[#FCFDFC]">Neidy e José</p>
                            <div className="nj-hero-rule my-1 opacity-80" />
                            <p className="font-serif text-lg tracking-wide">{fullName}</p>
                            <p className="font-body text-[10px] uppercase tracking-[0.3em] text-[#EBE4D5]/80">
                              05 · XII · 2026
                            </p>
                            <p className="font-body text-[10px] tracking-[0.2em] text-[#CBB994]">
                              Civil 13:00 · Copo de Água 15:00
                            </p>
                            <p className="font-body text-[10px] text-[#EBE4D5]/70">
                              Espaço Águia · Marracuene
                            </p>
                            <p className="mt-3 border border-[#CBB994]/40 px-3 py-1 font-mono text-[11px] tracking-widest text-[#CBB994]">
                              {ticketCode}
                            </p>
                            <p className="mt-2 font-body text-[8px] uppercase tracking-[0.25em] text-[#EBE4D5]/45">
                              HAXR Signature · Private Edition
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={downloadTicket}
                          disabled={isDownloading}
                          className="inline-flex items-center gap-2 rounded-full bg-[#0A211A] px-5 py-3 font-body text-[10px] uppercase tracking-[0.25em] text-[#FCFDFC] hover:bg-[#153B30] disabled:opacity-60"
                        >
                          <Download className="h-3.5 w-3.5 text-[#CBB994]" />
                          {isDownloading ? "A gerar…" : "Descarregar ticket PNG"}
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={openWhatsApp}
                      className="inline-flex items-center gap-2 rounded-full border border-[#0A211A]/20 px-5 py-3 font-body text-[10px] uppercase tracking-[0.25em] text-[#0A211A] hover:border-[#CBB994]"
                    >
                      <MessageCircle className="h-3.5 w-3.5 text-[#CBB994]" />
                      Dúvidas no WhatsApp
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsSubmitted(false);
                        setTicketCode("");
                        setErrorMessage("");
                      }}
                      className="font-serif text-sm italic text-[#3B6456] underline underline-offset-4"
                    >
                      Escrever outra carta
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
