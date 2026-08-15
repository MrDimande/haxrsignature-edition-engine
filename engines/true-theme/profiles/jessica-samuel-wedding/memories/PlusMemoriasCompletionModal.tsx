"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, X, Heart } from "lucide-react";

interface PlusMemoriasCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PlusMemoriasCompletionModal({
  isOpen,
  onClose,
}: PlusMemoriasCompletionModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md bg-[#FFF9F2] rounded-xl shadow-2xl border border-[#C9939B]/35 overflow-hidden text-center p-8 relative space-y-5"
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 text-[#171312]/40 hover:text-[#171312] transition-colors rounded-full"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-16 h-16 bg-[#7A2332] text-[#FFF9F2] rounded-full flex items-center justify-center mx-auto shadow-md">
            <Sparkles className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <p className="font-display text-[10px] tracking-[0.28em] uppercase text-[#7A2332]">
              Desafio Concluído
            </p>
            <h3 className="font-display text-2xl text-[#171312] font-normal leading-snug">
              TODOS OS MOMENTOS ENCONTRADOS
            </h3>
          </div>

          <p className="font-body text-sm text-[#171312]/70 leading-relaxed italic">
            Conseguiu ver esta celebração por outros olhos. O seu desafio está completo.
          </p>

          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-3.5 px-6 rounded-sm bg-[#7A2332] text-[#FFF9F2] font-display text-[10px] tracking-[0.24em] uppercase shadow-sm hover:bg-[#5A1825] transition-all flex items-center justify-center gap-2"
            >
              <Heart className="w-4 h-4 text-pink-200 fill-current" />
              <span>CONTINUAR A CELEBRAR</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
