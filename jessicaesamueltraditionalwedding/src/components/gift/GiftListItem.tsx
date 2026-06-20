"use client";

import { Check, Gift } from "lucide-react";
import { GoldButton } from "@/components/ui/GoldButton";
import type { GiftItem } from "@/lib/event-data";

type GiftListItemProps = {
  gift: GiftItem;
  index: number;
  isReserved: boolean;
  reservedBy?: string;
  onOffer: () => void;
};

export function GiftListItem({
  gift,
  index,
  isReserved,
  reservedBy,
  onOffer,
}: GiftListItemProps) {
  return (
    <article
      className={`group relative overflow-hidden rounded-lg border border-spring-orange/15 bg-charcoal transition-all duration-300 ${
        isReserved
          ? "opacity-55"
          : "hover:border-spring-orange/35 hover:shadow-spring-glow-sm"
      }`}
    >
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6">
        {/* Index + info */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-spring-orange/25 bg-spring-orange/5 font-montserrat text-[10px] font-semibold text-spring-orange">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3
              className={`font-playfair text-base font-bold text-off-white sm:text-lg ${
                isReserved ? "line-through decoration-spring-orange/40" : ""
              }`}
            >
              {gift.name}
            </h3>
            {isReserved && (
              <span className="flex shrink-0 items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 font-montserrat text-[9px] uppercase tracking-wider text-gold">
                <Check className="h-2.5 w-2.5" strokeWidth={2.5} />
                Reservado
              </span>
            )}
          </div>
          <p
            className={`ml-10 font-montserrat text-sm leading-relaxed text-light-gray ${
              isReserved ? "line-through decoration-spring-orange/20" : ""
            }`}
          >
            {gift.description}
          </p>
          {isReserved && reservedBy && (
            <p className="ml-10 mt-2 font-montserrat text-xs italic text-light-gray/60">
              Reservado por {reservedBy}
            </p>
          )}
        </div>

        {/* Price + action */}
        <div className="ml-10 flex shrink-0 items-center justify-between gap-4 sm:ml-0 sm:flex-col sm:items-end sm:gap-3">
          <div className="text-right">
            <p className="font-montserrat text-[10px] uppercase tracking-[0.2em] text-light-gray/60">
              Valor
            </p>
            <p className="font-playfair text-xl font-bold text-gold sm:text-2xl">
              {gift.price.toLocaleString("pt-PT")}{" "}
              <span className="font-montserrat text-xs font-normal text-gold/70">
                {gift.currency}
              </span>
            </p>
          </div>

          <GoldButton
            variant={isReserved ? "outline" : "solid"}
            size="sm"
            className="min-w-[140px]"
            disabled={isReserved}
            onClick={onOffer}
          >
            {isReserved ? "Reservado" : "Oferecer"}
          </GoldButton>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-spring-orange/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </article>
  );
}
