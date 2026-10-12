export const LOCAL_RSVP_SUCCESS_MESSAGE =
  "O seu RSVP foi registado com sucesso!" as const;

export type LocalRsvpSuccessBody = {
  success: true;
  persisted: true;
  message: typeof LOCAL_RSVP_SUCCESS_MESSAGE;
  notificationSkipped: boolean;
  guestId?: string;
  qrToken?: string;
  status?: "confirmed" | "declined";
  created?: boolean;
  partySize?: number;
  plusOnes?: number;
};

export function buildLocalRsvpSuccessBody(options?: {
  notificationSkipped?: boolean;
  guestId?: string;
  qrToken?: string;
  status?: "confirmed" | "declined";
  created?: boolean;
  partySize?: number;
  plusOnes?: number;
}): LocalRsvpSuccessBody {
  return {
    success: true,
    persisted: true,
    message: LOCAL_RSVP_SUCCESS_MESSAGE,
    notificationSkipped: Boolean(options?.notificationSkipped),
    ...(options?.guestId ? { guestId: options.guestId } : {}),
    ...(options?.qrToken ? { qrToken: options.qrToken } : {}),
    ...(options?.status ? { status: options.status } : {}),
    ...(options?.created !== undefined ? { created: options.created } : {}),
    ...(options?.partySize !== undefined ? { partySize: options.partySize } : {}),
    ...(options?.plusOnes !== undefined ? { plusOnes: options.plusOnes } : {}),
  };
}
