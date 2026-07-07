export const LOCAL_RSVP_SUCCESS_MESSAGE =
  "O seu RSVP foi registado com sucesso!" as const;

export type LocalRsvpSuccessBody = {
  success: true;
  message: typeof LOCAL_RSVP_SUCCESS_MESSAGE;
};

export function buildLocalRsvpSuccessBody(): LocalRsvpSuccessBody {
  return {
    success: true,
    message: LOCAL_RSVP_SUCCESS_MESSAGE,
  };
}
