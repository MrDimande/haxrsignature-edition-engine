import { AYLLA_GIFTS_CONFIG, canBabyAyllaGiftRegistryReserve, type BabyAyllaGiftInvitationStatus } from "./config";

export type BabyAyllaGiftPresentation = {
  readonly mode: "inspiration" | "verification" | "reserve";
  readonly canReserve: boolean;
  readonly message: string;
};

export function resolveBabyAyllaGiftPresentation(input: {
  invitationStatus: BabyAyllaGiftInvitationStatus;
  hasConfirmedRsvp?: boolean;
  hasVerifiedIdentity?: boolean;
}): BabyAyllaGiftPresentation {
  if (!input.hasConfirmedRsvp || !input.hasVerifiedIdentity || !canBabyAyllaGiftRegistryReserve(input)) {
    return {
      mode: "inspiration",
      canReserve: false,
      message: "A reserva fica disponível depois da confirmação de presença e validação do contacto.",
    };
  }

  return {
    mode: "reserve",
    canReserve: true,
    message: "Escolha um mimo disponível para a Aylla.",
  };
}

export const BABY_AYLLA_GIFT_REGISTRY_IS_ENABLED = AYLLA_GIFTS_CONFIG.enabled;
