"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronUp, Gift } from "lucide-react";
import { GiftListItem } from "@/components/gift/GiftListItem";
import { ReserveGiftModal } from "@/components/gift/ReserveGiftModal";
import { GoldButton } from "@/components/ui/GoldButton";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { GIFT_ITEMS, type GiftItem } from "@/lib/event-data";

type Reservation = {
  giftId: string;
  guestName: string;
};

export function GiftRegistrySection() {
  const [isListOpen, setIsListOpen] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOffer = (gift: GiftItem) => {
    setSelectedGift(gift);
    setIsModalOpen(true);
  };

  const handleConfirm = (guestName: string) => {
    if (!selectedGift) return;

    setReservations((prev) => [
      ...prev,
      { giftId: selectedGift.id, guestName },
    ]);
    setIsModalOpen(false);
    setSelectedGift(null);
  };

  const getReservation = (giftId: string) =>
    reservations.find((r) => r.giftId === giftId);

  const totalValue = GIFT_ITEMS.reduce((sum, item) => sum + item.price, 0);
  const reservedCount = reservations.length;

  return (
    <section id="gifts" className="relative py-20 sm:py-28">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-spring-orange/25 to-transparent" />

      <div className="mx-auto max-w-3xl px-6">
        <RevealOnScroll className="mb-10 text-center">
          <p className="mb-3 font-montserrat text-xs uppercase tracking-[0.35em] text-spring-orange">
            A Montra HAXR
          </p>
          <h2 className="mb-4 font-playfair text-3xl font-bold text-off-white sm:text-4xl md:text-5xl">
            Presentear
          </h2>
          <p className="mx-auto max-w-xl font-montserrat text-sm leading-relaxed text-light-gray sm:text-base">
            A vossa presença é o nosso maior presente. A lista definitiva será
            actualizada em breve — será a mesma do dia 15.
          </p>
        </RevealOnScroll>

        <RevealOnScroll delay={0.15} className="flex justify-center">
          <GoldButton
            size="lg"
            onClick={() => setIsListOpen((prev) => !prev)}
            className="inline-flex items-center gap-3"
          >
            <Gift className="h-4 w-4" strokeWidth={1.5} />
            {isListOpen ? "Ocultar Lista" : "Ver Lista de Presentes"}
          </GoldButton>
        </RevealOnScroll>

        <AnimatePresence>
          {isListOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.35, delay: 0.1 }}
                className="pt-10"
              >
                {/* Summary bar */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-spring-orange/15 bg-charcoal/60 px-5 py-4">
                  <p className="font-montserrat text-xs uppercase tracking-[0.2em] text-light-gray">
                    <span className="text-spring-orange">{GIFT_ITEMS.length}</span>{" "}
                    opções disponíveis
                  </p>
                  <p className="font-montserrat text-xs text-light-gray">
                    Total da lista:{" "}
                    <span className="font-playfair text-base font-bold text-gold">
                      {totalValue.toLocaleString("pt-PT")} MZN
                    </span>
                  </p>
                  {reservedCount > 0 && (
                    <p className="w-full font-montserrat text-[10px] uppercase tracking-wider text-gold/70 sm:w-auto">
                      {reservedCount} reservado{reservedCount > 1 ? "s" : ""}
                    </p>
                  )}
                </div>

                {/* Organized list */}
                <ul className="space-y-3" role="list">
                  {GIFT_ITEMS.map((gift, index) => {
                    const reservation = getReservation(gift.id);
                    return (
                      <li key={gift.id}>
                        <GiftListItem
                          gift={gift}
                          index={index}
                          isReserved={!!reservation}
                          reservedBy={reservation?.guestName}
                          onOffer={() => handleOffer(gift)}
                        />
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setIsListOpen(false)}
                    className="inline-flex items-center gap-2 font-montserrat text-xs uppercase tracking-[0.2em] text-light-gray transition-colors hover:text-spring-orange"
                  >
                    <ChevronUp className="h-4 w-4" strokeWidth={1.5} />
                    Fechar lista
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ReserveGiftModal
        gift={selectedGift}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedGift(null);
        }}
        onConfirm={handleConfirm}
      />
    </section>
  );
}
