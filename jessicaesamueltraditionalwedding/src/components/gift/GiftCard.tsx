"use client";

import { Check } from "lucide-react";
import { GoldButton } from "@/components/ui/GoldButton";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import type { GiftItem } from "@/lib/event-data";

type GiftCardProps = {
  gift: GiftItem;
  index: number;
  isReserved: boolean;
  reservedBy?: string;
  onOffer: () => void;
};

export function GiftCard({
  gift,
  index,
  isReserved,
  reservedBy,
  onOffer,
}: GiftCardProps) {
  return (
    <RevealOnScroll delay={index * 0.1} className="h-full">
      <article
        className={`flex h-full flex-col rounded-lg border border-gold/15 bg-deep-black p-6 transition-all duration-500 sm:p-8 ${
          isReserved ? "opacity-50" : "hover:border-gold/30 hover:shadow-gold-glow-sm"
        }`}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3
            className={`font-playfair text-lg font-bold text-off-white sm:text-xl ${
              isReserved ? "line-through decoration-gold/50" : ""
            }`}
          >
            {gift.name}
          </h3>
          {isReserved && (
            <span className="flex shrink-0 items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 font-montserrat text-[10px] uppercase tracking-wider text-gold">
              <Check className="h-3 w-3" strokeWidth={2} />
              Reservado
            </span>
          )}
        </div>

        <p
          className={`mb-6 flex-1 font-montserrat text-sm leading-relaxed text-light-gray ${
            isReserved ? "line-through decoration-gold/30" : ""
          }`}
        >
          {gift.description}
        </p>

        <div className="mb-6">
          <span className="font-playfair text-2xl font-bold text-gold">
            {gift.price.toLocaleString("pt-PT")}{" "}
            <span className="font-montserrat text-sm font-normal text-gold/70">
              {gift.currency}
            </span>
          </span>
        </div>

        {isReserved && reservedBy && (
          <p className="mb-4 font-montserrat text-xs italic text-light-gray/70">
            Reservado por {reservedBy}
          </p>
        )}

        <GoldButton
          variant={isReserved ? "outline" : "solid"}
          size="sm"
          className="w-full"
          disabled={isReserved}
          onClick={onOffer}
        >
          {isReserved ? "Reservado" : "Oferecer Presente"}
        </GoldButton>
      </article>
    </RevealOnScroll>
  );
}
