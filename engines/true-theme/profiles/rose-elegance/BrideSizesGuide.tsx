"use client";

import { Heart, UtensilsCrossed } from "lucide-react";
import { BRIDE_INTIMATE_PIECES } from "@data/gifts/rose-elegance";
import { roseType } from "./rose-typography";

type BrideSizesGuideProps = {
  theme: {
    colors: { accent: string; secondary: string; primary: string };
    palette: { textPrimary: string; textSecondary: string };
  };
};

/** Cores com contraste legível sobre fundo blush */
const ink = {
  label: "#3D2430",
  body: "#5C3848",
  muted: "#CC1470",
  size: "#FF2D8A",
  border: "rgba(255, 45, 138, 0.22)",
  cardBg: "rgba(255, 255, 255, 0.92)",
};

export function BrideSizesGuide({ theme }: BrideSizesGuideProps) {
  return (
    <div className="space-y-5">
      {/* —— Guia de mimos —— */}
      <div
        className="relative overflow-hidden rounded-sm border p-4 sm:p-5"
        style={{
          borderColor: ink.border,
          background: `linear-gradient(145deg, rgba(255,45,138,0.2) 0%, ${ink.cardBg} 50%, rgba(201,168,108,0.08) 100%)`,
        }}
      >
        <div className="mb-4">
          <p
            className={`${roseType.sectionLabel} mb-1`}
            style={{ color: ink.muted, opacity: 1 }}
          >
            Guia de mimos
          </p>
          <h4
            className="font-display italic text-lg sm:text-xl font-light"
            style={{ color: ink.label }}
          >
            Dois gestos para a Jessica
          </h4>
          <p
            className="font-display italic text-[11px] sm:text-xs font-light leading-relaxed mt-1.5"
            style={{ color: ink.body }}
          >
            Uma peça íntima (ver medidas abaixo) e uma peça de cozinha
            reservada na lista.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            className="flex gap-3 items-start p-3.5 rounded-sm border"
            style={{ borderColor: ink.border, backgroundColor: ink.cardBg }}
          >
            <div
              className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full border"
              style={{
                borderColor: "rgba(158, 61, 107, 0.35)",
                color: ink.size,
                backgroundColor: "rgba(255, 45, 138, 0.16)",
              }}
            >
              <Heart size={14} strokeWidth={1.35} />
            </div>
            <div className="min-w-0">
              <p
                className={`${roseType.sectionLabel} mb-1`}
                style={{ color: ink.muted, opacity: 1 }}
              >
                1 · Lingerie
              </p>
              <p
                className="font-display italic text-sm font-medium"
                style={{ color: ink.label }}
              >
                Traz à festa
              </p>
              <p
                className="font-display italic text-[11px] leading-relaxed mt-0.5"
                style={{ color: ink.body }}
              >
                Usa as medidas da Jessica por peça — secção abaixo.
              </p>
            </div>
          </div>

          <div
            className="flex gap-3 items-start p-3.5 rounded-sm border"
            style={{ borderColor: ink.border, backgroundColor: ink.cardBg }}
          >
            <div
              className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full border"
              style={{
                borderColor: "rgba(201, 168, 108, 0.45)",
                color: theme.colors.accent,
                backgroundColor: "rgba(201, 168, 108, 0.12)",
              }}
            >
              <UtensilsCrossed size={14} strokeWidth={1.35} />
            </div>
            <div className="min-w-0">
              <p
                className={`${roseType.sectionLabel} mb-1`}
                style={{ color: ink.muted, opacity: 1 }}
              >
                2 · Cozinha
              </p>
              <p
                className="font-display italic text-sm font-medium"
                style={{ color: ink.label }}
              >
                Uma peça da lista
              </p>
              <p
                className="font-display italic text-[11px] leading-relaxed mt-0.5"
                style={{ color: ink.body }}
              >
                Escolhe e reserva no botão — uma por convidada.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* —— Medidas por peça —— */}
      <div
        className="rounded-sm border p-4 sm:p-5"
        style={{
          borderColor: ink.border,
          backgroundColor: ink.cardBg,
        }}
      >
        <div className="mb-4">
          <p
            className={`${roseType.sectionLabel} mb-1`}
            style={{ color: ink.muted, opacity: 1 }}
          >
            Guia íntimo
          </p>
          <h4
            className="font-display italic text-lg sm:text-xl font-light"
            style={{ color: ink.label }}
          >
            Medidas da Jessica
          </h4>
          <p
            className="font-display italic text-[11px] sm:text-xs leading-relaxed mt-1.5"
            style={{ color: ink.body }}
          >
            Referência para cada peça íntima — escolhe com carinho e no
            tamanho certo.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {BRIDE_INTIMATE_PIECES.map((piece) => (
            <div
              key={piece.id}
              className="flex flex-col items-center text-center px-2 py-3 rounded-sm border"
              style={{
                borderColor: ink.border,
                backgroundColor: "rgba(255, 229, 240, 0.9)",
              }}
            >
              <span
                className={`${roseType.script} text-[2rem] sm:text-[2.25rem] leading-none mb-1`}
                style={{ color: ink.size }}
              >
                {piece.size}
              </span>
              <span
                className="font-display italic text-[11px] sm:text-xs font-medium leading-tight"
                style={{ color: ink.label }}
              >
                {piece.label}
              </span>
              {piece.note ? (
                <span
                  className="text-[9px] sm:text-[10px] mt-1 leading-tight font-display italic"
                  style={{ color: ink.muted }}
                >
                  {piece.note}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
