/**
 * Orientação da lista de presentes — Jessica & Samuel.
 *
 * Sem catálogo digital de produtos.
 * Apenas: onde adquirir, identificação da cotação, notas de consulta presencial.
 * Reserva / API de itens permanece fechada (inventory.ts).
 */

import { WEDDING_COPY, WEDDING_EVENT } from "../event-details";
import { JESSICA_SAMUEL_GIFT_QUOTATION } from "./quotation-meta";

/**
 * Feature flag — cartão / painel de orientação da lista.
 * true: mostra loja, cotação e localização.
 * false: esconde o cartão de presentes no Guia.
 */
export const giftListEnabled: boolean = true;

/** Dados públicos da lista presencial (sem produtos). */
export const WEDDING_GIFT_GUIDANCE = {
  storeName: WEDDING_EVENT.giftStoreName,
  storeAddress: WEDDING_EVENT.giftStoreAddress,
  storePhoneDisplay: WEDDING_EVENT.giftStorePhoneDisplay,
  storePhoneTel: WEDDING_EVENT.giftStorePhoneTel,
  storeMapsUrl: WEDDING_EVENT.giftStoreMapsUrl,
  /** Nome editorial da lista (cotação 1044). */
  registryName: JESSICA_SAMUEL_GIFT_QUOTATION.listDisplayName,
  registry: {
    listName: JESSICA_SAMUEL_GIFT_QUOTATION.listDisplayName,
    quotationLine: JESSICA_SAMUEL_GIFT_QUOTATION.quotationLine,
    issuedLine: JESSICA_SAMUEL_GIFT_QUOTATION.issuedLine,
  },
  consultLabel: "Consulta presencial",
  mapsCta: "Abrir no Maps",
  phoneCta: "Ligar",
  lead: WEDDING_COPY.giftsLead,
  consultNote: WEDDING_COPY.giftsConsultNote,
} as const;

export function shouldShowWeddingGiftGuideCard(
  enabled: boolean = giftListEnabled
): boolean {
  return enabled === true;
}
