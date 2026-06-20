"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { GoldButton } from "@/components/ui/GoldButton";
import type { GiftItem } from "@/lib/event-data";
import { useEffect, useRef } from "react";

type ReserveGiftModalProps = {
  gift: GiftItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (guestName: string) => void;
};

export function ReserveGiftModal({
  gift,
  isOpen,
  onClose,
  onConfirm,
}: ReserveGiftModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const guestName = (formData.get("guestName") as string).trim();
    if (guestName) {
      onConfirm(guestName);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && gift && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-deep-black/80 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reserve-modal-title"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-gold/25 bg-charcoal p-8 shadow-gold-glow"
          >
            <button
              onClick={onClose}
              aria-label="Fechar modal"
              className="absolute right-4 top-4 text-light-gray transition-colors hover:text-gold"
            >
              <X className="h-5 w-5" strokeWidth={1.5} />
            </button>

            <div className="mb-6 text-center">
              <p className="mb-2 font-montserrat text-[10px] uppercase tracking-[0.3em] text-gold">
                Reservar Presente
              </p>
              <h3
                id="reserve-modal-title"
                className="font-playfair text-xl font-bold text-off-white"
              >
                {gift.name}
              </h3>
              <p className="mt-2 font-montserrat text-sm text-light-gray">
                {gift.price.toLocaleString("pt-PT")} {gift.currency}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="guestName"
                  className="mb-2 block font-montserrat text-xs uppercase tracking-[0.15em] text-light-gray"
                >
                  Nome do Convidado
                </label>
                <input
                  ref={inputRef}
                  id="guestName"
                  name="guestName"
                  type="text"
                  required
                  placeholder="O seu nome completo"
                  className="w-full rounded-sm border border-gold/20 bg-deep-black px-4 py-3 font-montserrat text-sm text-off-white placeholder:text-light-gray/40 transition-colors focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/30"
                />
              </div>

              <GoldButton type="submit" size="md" className="w-full">
                Confirmar Reserva
              </GoldButton>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
