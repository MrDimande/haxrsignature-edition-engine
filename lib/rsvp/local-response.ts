export const LOCAL_RSVP_SUCCESS_MESSAGE =
  "O seu RSVP foi registado com sucesso!" as const;

export type LocalRsvpSuccessBody = {
  success: true;
  persisted: true;
  message: typeof LOCAL_RSVP_SUCCESS_MESSAGE;
  notificationSkipped: boolean;
  guestId?: string;
};

export function buildLocalRsvpSuccessBody(options?: {
  notificationSkipped?: boolean;
  guestId?: string;
}): LocalRsvpSuccessBody {
  return {
    success: true,
    persisted: true,
    message: LOCAL_RSVP_SUCCESS_MESSAGE,
    notificationSkipped: Boolean(options?.notificationSkipped),
    ...(options?.guestId ? { guestId: options.guestId } : {}),
  };
}
