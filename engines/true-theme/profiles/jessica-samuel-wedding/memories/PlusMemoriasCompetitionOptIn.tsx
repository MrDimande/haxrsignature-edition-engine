"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { Trophy, Check, User, ShieldCheck } from "lucide-react";
import {
  setParticipantName,
  setCompetitionOptInStatus,
  getParticipantName,
} from "./plus-memorias-identity";

interface PlusMemoriasCompetitionOptInProps {
  slug: string;
  onOptInSuccess: (name: string) => void;
  onOptOut: () => void;
}

export function PlusMemoriasCompetitionOptIn({
  slug,
  onOptInSuccess,
  onOptOut,
}: PlusMemoriasCompetitionOptInProps) {
  const [name, setName] = useState(getParticipantName(slug) || "");
  const [error, setError] = useState("");

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Por favor introduza o seu nome para entrar no desafio.");
      return;
    }
    if (trimmed.length > 80) {
      setError("O nome deve ter no máximo 80 caracteres.");
      return;
    }

    setParticipantName(slug, trimmed);
    setCompetitionOptInStatus(slug, "opted_in");
    onOptInSuccess(trimmed);
  };

  const handleSkip = () => {
    setCompetitionOptInStatus(slug, "opted_out");
    onOptOut();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-xl mx-auto my-6 px-4"
    >
      <div className="bg-[#FFF9F2] border border-[#C9939B]/35 rounded-xl p-6 shadow-md relative overflow-hidden text-center space-y-4">
        {/* Subtle accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#7A2332]" />

        <div className="w-12 h-12 bg-[#7A2332]/10 text-[#7A2332] rounded-full flex items-center justify-center mx-auto mt-1">
          <Trophy className="w-6 h-6" />
        </div>

        <div>
          <p className="font-display text-[10px] tracking-[0.26em] uppercase text-[#7A2332] font-semibold">
            Explorador da Noite
          </p>
          <h3 className="font-display text-xl text-[#171312] font-normal leading-snug mt-1">
            QUER ENTRAR NO DESAFIO?
          </h3>
          <p className="font-body text-xs text-[#171312]/65 max-w-md mx-auto mt-1.5 leading-relaxed">
            Complete o maior número de momentos desta noite. O participante com mais momentos únicos capturados será o vencedor.
          </p>
        </div>

        <form onSubmit={handleJoin} className="space-y-3.5 max-w-md mx-auto pt-2">
          <div className="text-left space-y-1">
            <label className="block text-[10px] tracking-[0.2em] uppercase text-[#171312]/60 font-medium">
              Como devemos chamar-lhe?
            </label>
            <div className="relative">
              <input
                type="text"
                maxLength={80}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                placeholder="Ex: Maria & João"
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded border border-[#C9939B]/35 bg-[#F1E3CF] text-[#171312] focus:outline-none focus:ring-1 focus:ring-[#7A2332] transition-all"
              />
              <User className="w-4 h-4 text-[#171312]/40 absolute left-3 top-3" />
            </div>
            {error && <p className="text-[11px] text-red-600 pt-0.5">{error}</p>}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 rounded-sm bg-[#7A2332] text-[#FFF9F2] font-display text-[10px] tracking-[0.22em] uppercase shadow-sm hover:bg-[#5A1825] transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>ENTRAR NO DESAFIO</span>
            </button>

            <button
              type="button"
              onClick={handleSkip}
              className="w-full sm:w-auto px-5 py-3 rounded-sm border border-[#C9939B]/30 bg-transparent text-[#171312]/70 hover:text-[#171312] font-display text-[10px] tracking-[0.18em] uppercase transition-colors"
            >
              Continuar sem participar
            </button>
          </div>
        </form>

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#171312]/45 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[#7A2332]/70 shrink-0" />
          <span>O seu nome será utilizado apenas para identificar a sua participação no desafio desta celebração.</span>
        </div>
      </div>
    </motion.div>
  );
}
