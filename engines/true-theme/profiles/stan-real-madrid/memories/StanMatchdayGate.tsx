"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { KeyRound, ShieldCheck, QrCode, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { StanleyWordmark } from "../StanleyWordmark";

interface StanMatchdayGateProps {
  slug: string;
  errorMessage?: string;
  onSuccess?: () => void;
}

export function StanMatchdayGate({ slug, errorMessage: initialError }: StanMatchdayGateProps) {
  const [accessCode, setAccessCode] = useState("stan-matchday");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(initialError || "");

  const handleExchange = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = accessCode.trim();
    if (!trimmed) {
      setError("Por favor introduza o código de acesso.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/memories/session/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenOrCode: trimmed }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Código de acesso inválido ou expirado.");
        setIsLoading(false);
        return;
      }

      // Recarrega a página para inicializar a sessão com o cookie HttpOnly definido
      window.location.href = `/${slug}/memorias`;
    } catch (err: any) {
      setError("Não foi possível validar o código. Verifique a sua ligação.");
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-[#050A12] text-[#F7F4EF] overflow-hidden">
      {/* Background Stadium Glow */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-radial from-[#C9A86A]/20 via-[#0A1628]/40 to-transparent blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md mx-auto text-center"
      >
        {/* Crest & Header */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0A1628]/80 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] tracking-[0.28em] uppercase mb-6 shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Pass Matchday Oficial</span>
        </div>

        {/* Stanley S·5 Wordmark */}
        <div className="mb-3">
          <StanleyWordmark size="gate" />
        </div>

        <h1 className="font-display text-xl sm:text-2xl font-light text-[#F7F4EF] tracking-wide mb-2">
          Eu Espio · Matchday Edition
        </h1>

        <p className="font-body text-xs sm:text-sm text-[#F7F4EF]/70 mb-8 max-w-xs mx-auto leading-relaxed">
          Álbum de memórias exclusivo e jogo de missões fotográficas do 5º Aniversário do Stan.
        </p>

        {/* Card de Entrada */}
        <div className="bg-[#0A1628]/80 backdrop-blur-md border border-[#D4AF37]/25 rounded-2xl p-6 shadow-xl mb-8">
          <form onSubmit={handleExchange} className="space-y-4">
            <div className="text-left">
              <label
                htmlFor="accessCode"
                className="block text-[11px] font-mono tracking-widest text-[#D4AF37] uppercase mb-1.5"
              >
                Chave ou Código de Acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5B6B7C]">
                  <KeyRound className="w-4 h-4 text-[#D4AF37]/70" />
                </div>
                <input
                  id="accessCode"
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Ex: stan-matchday"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#050A12]/90 border border-[#D4AF37]/30 text-[#F7F4EF] placeholder-[#5B6B7C] text-sm focus:outline-hidden focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all font-mono"
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex items-center gap-2 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs text-left"
              >
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C9A86A] text-[#0A1628] font-serif font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-md hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#0A1628]" />
                  <span>A validar acesso...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Matchday</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* QR Code Section & Hint */}
        <div className="flex flex-col items-center justify-center gap-3 pt-2">
          <div className="relative w-28 h-28 p-2 rounded-xl bg-[#F7F4EF] border-2 border-[#D4AF37] shadow-lg">
            <Image
              src="/images/stan/qr-stan-matchday.svg"
              alt="QR Code Oficial Stanley Matchday"
              width={112}
              height={112}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[#F7F4EF]/60">
            <QrCode className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Digitalize o QR Code do seu convite para aceder instantaneamente.</span>
          </div>
        </div>

        {/* Editorial Footer */}
        <div className="mt-12 text-center text-[10px] tracking-[0.25em] text-[#5B6B7C] uppercase">
          HAXR Signature · Alta-Costura Digital
        </div>
      </motion.div>
    </main>
  );
}
