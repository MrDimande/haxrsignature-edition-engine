/**
 * Orientação da lista de presentes — Jessica & Samuel.
 *
 * Sem catálogo digital de produtos.
 * Apenas: onde adquirir, nome da lista, notas de consulta presencial.
 * Reserva / API de itens permanece fechada (inventory.ts).
 */

import { WEDDING_COPY, WEDDING_COUPLE, WEDDING_EVENT } from "../event-details";

/**
 * Feature flag — cartão / painel de orientação da lista.
 * true: mostra loja, nome da lista e localização.
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
  /** Nome sob o qual a lista está registada na loja. */
  registryName: `${WEDDING_COUPLE.bride} e ${WEDDING_COUPLE.groom}`,
  consultLabel: "Consulta presencial",
  mapsCta: "Abrir no Maps",
  phoneCta: "Ligar",
  lead: WEDDING_COPY.giftsLead,
  registryNameNote: WEDDING_COPY.giftsRegistryNameNote,
  consultNote: WEDDING_COPY.giftsConsultNote,
} as const;

export function shouldShowWeddingGiftGuideCard(
  enabled: boolean = giftListEnabled
): boolean {
  return enabled === true;
}
