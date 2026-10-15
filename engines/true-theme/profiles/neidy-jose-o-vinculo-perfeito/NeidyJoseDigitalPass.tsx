"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { toPng } from "html-to-image";
import { Download, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { NEIDY_JOSE_CONSTANTS } from "@lib/neidy-jose/constants";
import {
  resolveNeidyJoseCheckinUrl,
  CANONICAL_CORE_PRODUCTION_BASE,
  NEIDY_JOSE_CANONICAL_EVENT_ID,
} from "@lib/rsvp/checkin-url";

export interface NeidyJoseDigitalPassProps {
  fullName: string;
  qrToken: string;
  partySize: number;
  companionNames?: string;
  prefersReducedMotion?: boolean;
}

export function buildNeidyJoseCheckinUrl(qrToken: string): string {
  const resolution = resolveNeidyJoseCheckinUrl(qrToken);
  if (!resolution.ok) {
    throw new Error(`[DigitalPass] Falha na resolução da URL de check-in: ${resolution.message}`);
  }
  return resolution.url;
}

export function NeidyJoseDigitalPass({
  fullName,
  qrToken,
  partySize,
  companionNames = "",
  prefersReducedMotion = false,
}: NeidyJoseDigitalPassProps) {
  const passRef = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [qrError, setQrError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!qrToken || qrToken.trim().length < 16) {
      setQrError("Token de check-in não disponibilizado.");
      return;
    }

    const resolution = resolveNeidyJoseCheckinUrl(qrToken);
    if (!resolution.ok) {
      setQrError(resolution.message);
      setQrDataUrl("");
      return;
    }

    const checkinUrl = resolution.url;

    QRCode.toDataURL(checkinUrl, {
      width: 380,
      margin: 2,
      errorCorrectionLevel: "M",
      color: {
        dark: "#0A211A",
        light: "#FFFFFF",
      },
    })
      .then((url) => {
        if (isMounted) {
          setQrDataUrl(url);
          setQrError(null);
        }
      })
      .catch((err) => {
        console.error("[DigitalPass] Falha ao gerar QR:", err);
        if (isMounted) {
          setQrError("Não foi possível gerar a imagem do código QR.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [qrToken]);

  const handleDownload = async () => {
    if (!passRef.current || isDownloading || !qrDataUrl) return;

    setIsDownloading(true);
    setDownloadSuccess(false);

    try {
      const dataUrl = await toPng(passRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: "#0A211A",
      });

      const cleanName = fullName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const link = document.createElement("a");
      link.download = `passe-digital-neidy-jose-${cleanName || "convidado"}.png`;
      link.href = dataUrl;
      link.click();
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error("[DigitalPass] Erro ao descarregar passe:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const companionsList = companionNames
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  const plusOnesCount = Math.max(0, partySize - 1);

  return (
    <div className="flex w-full flex-col items-center">
      {/* Visual luxury pass element ready for high-resolution PNG export */}
      <motion.div
        ref={passRef}
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: prefersReducedMotion ? 0.01 : 0.6,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#CBB994]/40 bg-[#0A211A] p-7 text-[#FCFDFC] shadow-[0_24px_50px_-12px_rgba(10,33,26,0.85)]"
      >
        {/* Monogram luxury background watermark */}
        <div className="pointer-events-none absolute inset-0 opacity-10">
          <Image
            src={NEIDY_JOSE_CONSTANTS.hero.monogram}
            alt=""
            fill
            unoptimized
            className="object-contain p-8"
            aria-hidden
          />
        </div>

        {/* Header with authentic credentials */}
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="mb-2 flex items-center gap-1.5 font-body text-[8.5px] uppercase tracking-[0.42em] text-[#CBB994]">
            <ShieldCheck className="h-3 w-3 text-[#CBB994]" />
            <span>Passe Oficial de Entrada</span>
          </div>

          <h3 className="nj-script-font text-3xl text-[#FCFDFC] sm:text-4xl">
            Neidy Marino & José Mateus
          </h3>
          <div className="nj-hero-rule my-2 w-24 opacity-80" aria-hidden />

          {/* Guest Identity */}
          <div className="my-2 flex flex-col items-center">
            <p className="font-serif text-xl font-light tracking-wide text-[#FCFDFC] sm:text-2xl">
              {fullName}
            </p>
            <p className="font-body text-[9px] uppercase tracking-[0.3em] text-[#CBB994]/90">
              Titular do Convite
            </p>
          </div>

          {/* Event Details */}
          <div className="my-2.5 flex flex-col items-center gap-1 border-y border-[#CBB994]/25 py-2.5 w-full">
            <p className="font-body text-[11px] uppercase tracking-[0.3em] text-[#EBE4D5]/90">
              05 · XII · 2026
            </p>
            <p className="font-body text-[9.5px] tracking-[0.18em] text-[#CBB994]">
              Acolhimento 12:00 · Matrimónio 13:30 · Banquete 14:00
            </p>
            <p className="font-body text-[9.5px] text-[#EBE4D5]/80">
              Espaço Águia · Marracuene
            </p>
          </div>

          {/* Authorized Capacity / Party Allocation */}
          <div className="my-2 rounded-xl bg-[#153B30]/60 px-4 py-2 text-center border border-[#CBB994]/20 w-full">
            <p className="font-body text-[9px] uppercase tracking-[0.28em] text-[#CBB994]">
              Lotação Autorizada: {partySize} {partySize === 1 ? "Pessoa" : "Pessoas"}
            </p>
            {plusOnesCount > 0 ? (
              <p className="mt-0.5 font-serif text-[11px] italic text-[#EBE4D5]/90">
                1 Titular + {plusOnesCount} {plusOnesCount === 1 ? "Acompanhante" : "Acompanhantes"}
                {companionsList.length > 0 && ` (${companionsList.join(", ")})`}
              </p>
            ) : (
              <p className="mt-0.5 font-serif text-[11px] italic text-[#EBE4D5]/75">
                Passe individual intransmissível
              </p>
            )}
          </div>

          {/* High-Contrast Scannable QR Code */}
          <div className="my-3 flex flex-col items-center rounded-2xl bg-white p-3.5 shadow-md">
            {qrDataUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={qrDataUrl}
                alt={`Código QR de entrada oficial para ${fullName}`}
                className="h-44 w-44 rounded-lg object-contain"
              />
            ) : qrError ? (
              <div className="flex h-44 w-44 flex-col items-center justify-center p-2 text-center text-red-700">
                <AlertCircle className="mb-2 h-7 w-7 text-red-600" />
                <p className="text-[10px] leading-tight">{qrError}</p>
              </div>
            ) : (
              <div className="flex h-44 w-44 items-center justify-center text-xs text-[#0A211A]/60">
                A gerar código QR de alta precisão…
              </div>
            )}
          </div>

          <p className="mt-1 font-body text-[8.5px] tracking-[0.2em] uppercase text-[#EBE4D5]/70">
            Apresente este código à equipa na recepção
          </p>

          <p className="mt-3 font-body text-[7.5px] uppercase tracking-[0.25em] text-[#EBE4D5]/40">
            HAXR Signature · Alta-Costura Digital
          </p>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading || !qrDataUrl}
          className="inline-flex items-center gap-2 rounded-full bg-[#0A211A] px-6 py-3 font-body text-[10px] uppercase tracking-[0.25em] text-[#FCFDFC] shadow-md transition-all hover:bg-[#153B30] disabled:opacity-50"
        >
          {downloadSuccess ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-[#CBB994]" />
              Passe Guardado com Sucesso
            </>
          ) : (
            <>
              <Download className="h-3.5 w-3.5 text-[#CBB994]" />
              {isDownloading ? "A gerar imagem..." : "Guardar Passe Digital PNG"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
