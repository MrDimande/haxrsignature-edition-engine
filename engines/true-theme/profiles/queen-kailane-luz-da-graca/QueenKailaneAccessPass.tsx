"use client";

import React, { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { toPng } from "html-to-image";
import {
  Download,
  Share2,
  Calendar,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import {
  QUEEN_KAILANE_EVENT,
  downloadQueenKailaneIcsFile,
  type QueenKailaneBlessing,
} from "@lib/queen-kailane/event-details";
import { HAXR_AUTH } from "@lib/brand/authorship";
import { QueenMonogram } from "./QueenMonogram";
import { QUEEN_COLORS, QUEEN_EASE } from "./queen-motion";
import { QUEEN_GRACE_ARC } from "./queen-constants";

export const QUEEN_ACCESS_PASS_ID = "queen-access-pass";

function sanitizeFilename(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

interface QueenKailaneAccessPassProps {
  guestName: string;
  blessing: QueenKailaneBlessing;
}

export function QueenKailaneAccessPass({
  guestName,
  blessing,
}: QueenKailaneAccessPassProps) {
  const reduceMotion = useReducedMotion();
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownloadImage = async () => {
    const node = document.getElementById(QUEEN_ACCESS_PASS_ID);
    if (!node || downloading) return;

    try {
      setDownloading(true);
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2.5,
        backgroundColor: "#FFFDFC",
      });

      const safeName = sanitizeFilename(guestName) || "convidado";
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `passe-crisma-queen-kailane-${safeName}.png`;
      link.click();

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err) {
      console.error("Erro ao gerar imagem do passe:", err);
    } finally {
      setDownloading(false);
    }
  };

  const handleShareWhatsApp = () => {
    const siteUrl = "https://edition.haxrsignature.com/queenkailanecrisma";
    const text = [
      `🕊️ *Sacramento do Crisma · Queen Kailane Cande*`,
      `*Luz da Graça — O Livro da Fé*`,
      ``,
      `✨ *Presença Confirmada para:* ${guestName}`,
      ``,
      `📖 *Bênção de Luz:*`,
      `_«${blessing.verse}»_ — ${blessing.reference}`,
      ``,
      `📅 *Data:* 30 de Agosto de 2026`,
      `⛪ *Missa Solene:* 08h00 (Igreja Anglicana — Paróquia de São Estêvão e Lourenço, Matola)`,
      `🍽️ *Almoço:* 13h00 (São Dâmaso)`,
      ``,
      `🔗 *Convite Digital:* ${siteUrl}`,
    ].join("\n");

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
      text
    )}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <motion.div
      className="mt-12 flex flex-col items-center"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: QUEEN_EASE }}
    >
      {/* O Cartão Fólio / Marcador Sagrado */}
      <div
        id={QUEEN_ACCESS_PASS_ID}
        className="relative w-full max-w-sm overflow-hidden rounded-sm p-7 text-center shadow-xl sm:p-8"
        style={{
          backgroundColor: "#FFFDFC",
          border: `1.5px solid ${QUEEN_COLORS.champagne}`,
          backgroundImage:
            "radial-gradient(ellipse 80% 60% at 50% 15%, rgba(246, 241, 232, 0.65) 0%, transparent 80%), radial-gradient(ellipse 90% 50% at 50% 100%, rgba(231, 215, 193, 0.3) 0%, transparent 70%)",
        }}
      >
        {/* Curva-Mãe Sagrada no topo */}
        <div
          className="mx-auto mb-3 h-4 w-28 opacity-75"
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

        {/* Monograma QKC */}
        <div className="mx-auto flex justify-center">
          <QueenMonogram size="sm" />
        </div>

        {/* Cabeçalho */}
        <p
          className="mt-4 text-[0.6rem] font-semibold uppercase tracking-[0.32em]"
          style={{
            fontFamily:
              "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
            color: QUEEN_COLORS.goldMatte,
          }}
        >
          SACRAMENTO DO CRISMA
        </p>

        <h3
          className="mt-1 text-[1.25rem] font-light tracking-[0.08em]"
          style={{
            fontFamily:
              'var(--font-cormorant), "Cormorant Garamond", Georgia, serif',
            color: QUEEN_COLORS.ink,
          }}
        >
          Luz da Graça
        </h3>

        <div
          className="my-4 h-px w-16 mx-auto"
          style={{ backgroundColor: QUEEN_COLORS.champagne }}
          aria-hidden="true"
        />

        {/* Nome do Convidado */}
        <p
          className="text-[0.58rem] uppercase tracking-[0.24em]"
          style={{
            fontFamily:
              "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
            color: QUEEN_COLORS.taupe,
          }}
        >
          PRESENÇA CONFIRMADA
        </p>

        <p
          className="mt-1 text-[1.12rem] font-medium tracking-wide"
          style={{
            fontFamily:
              'var(--font-cormorant), "Cormorant Garamond", Georgia, serif',
            color: QUEEN_COLORS.ink,
          }}
        >
          {guestName}
        </p>

        {/* Caixa da Bênção de Luz */}
        <div
          className="my-5 rounded-sm p-4 text-center"
          style={{
            backgroundColor: "rgba(246, 241, 232, 0.65)",
            border: `1px solid rgba(185, 151, 91, 0.28)`,
          }}
        >
          <div className="flex items-center justify-center gap-1.5 text-[0.56rem] font-medium uppercase tracking-[0.2em] text-[#B9975B]">
            <Sparkles size={11} strokeWidth={1.5} aria-hidden />
            <span>BÊNÇÃO DE LUZ</span>
          </div>

          <blockquote
            className="mt-2 text-[0.88rem] italic leading-relaxed"
            style={{
              fontFamily:
                'var(--font-cormorant), "Cormorant Garamond", Georgia, serif',
              color: QUEEN_COLORS.inkSoft,
            }}
          >
            «{blessing.verse}»
          </blockquote>

          <p
            className="mt-1.5 text-[0.58rem] font-semibold tracking-widest text-[#736B62]"
            style={{
              fontFamily:
                "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
            }}
          >
            — {blessing.reference}
          </p>
        </div>

        {/* Detalhes do Evento */}
        <div
          className="space-y-1.5 text-[0.62rem] tracking-wider"
          style={{
            fontFamily:
              "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
            color: QUEEN_COLORS.inkSoft,
          }}
        >
          <p className="font-medium text-[#3F3832]">
            DOMINGO · 30 DE AGOSTO DE 2026
          </p>
          <p>
            <strong className="font-medium text-[#B9975B]">08H00</strong> ·
            Igreja Anglicana — Paróquia de São Estêvão e Lourenço
          </p>
          <p>
            <strong className="font-medium text-[#B9975B]">13H00</strong> ·
            Almoço em Família (São Dâmaso)
          </p>
        </div>

        {/* Rodapé do Passe */}
        <div
          className="mt-5 pt-3 text-[0.52rem] uppercase tracking-[0.24em]"
          style={{
            borderTop: `1px dashed ${QUEEN_COLORS.champagne}`,
            color: QUEEN_COLORS.taupe,
            fontFamily:
              "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
          }}
        >
          {HAXR_AUTH.brand} · Alta-Costura Digital
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3 w-full max-w-sm">
        <button
          type="button"
          onClick={handleDownloadImage}
          disabled={downloading}
          className="flex-1 inline-flex min-h-11 items-center justify-center gap-2 border px-4 py-2.5 text-[0.62rem] tracking-[0.2em] uppercase transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{
            fontFamily:
              "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
            color: QUEEN_COLORS.ink,
            borderColor: QUEEN_COLORS.goldMatte,
            backgroundColor: downloadSuccess
              ? "rgba(185, 151, 91, 0.15)"
              : "rgba(255, 253, 252, 0.95)",
            outlineColor: QUEEN_COLORS.goldMatte,
          }}
          aria-label="Descarregar imagem do passe de confirmação"
        >
          {downloadSuccess ? (
            <>
              <CheckCircle2 size={13} strokeWidth={1.5} className="text-[#B9975B]" />
              <span>PASSE GUARDADO!</span>
            </>
          ) : (
            <>
              <Download size={13} strokeWidth={1.5} />
              <span>{downloading ? "A GERAR IMAGEM..." : "GUARDAR PASSE"}</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleShareWhatsApp}
          className="flex-1 inline-flex min-h-11 items-center justify-center gap-2 border px-4 py-2.5 text-[0.62rem] tracking-[0.2em] uppercase transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{
            fontFamily:
              "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
            color: "#FFFDFC",
            borderColor: "#25D366",
            backgroundColor: "#20BA5A",
            outlineColor: "#25D366",
          }}
          aria-label="Partilhar confirmação no WhatsApp"
        >
          <WhatsAppIcon />
          <span>WHATSAPP</span>
        </button>

        <button
          type="button"
          onClick={() => downloadQueenKailaneIcsFile()}
          className="w-full inline-flex min-h-10 items-center justify-center gap-2 border px-4 py-2 text-[0.6rem] tracking-[0.22em] uppercase transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{
            fontFamily:
              "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
            color: QUEEN_COLORS.taupe,
            borderColor: "rgba(185, 151, 91, 0.35)",
            backgroundColor: "rgba(246, 241, 232, 0.6)",
            outlineColor: QUEEN_COLORS.goldMatte,
          }}
          aria-label="Adicionar data ao calendário"
        >
          <Calendar size={12} strokeWidth={1.5} />
          <span>ADICIONAR AO CALENDÁRIO</span>
        </button>
      </div>
    </motion.div>
  );
}
