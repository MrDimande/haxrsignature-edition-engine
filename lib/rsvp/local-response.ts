export const LOCAL_RSVP_SUCCESS_MESSAGE =
  "O seu RSVP foi registado com sucesso!" as const;

export type LocalRsvpSuccessBody = {
  success: true;
  message: typeof LOCAL_RSVP_SUCCESS_MESSAGE;
  /**
   * true apenas quando a inserção na base de dados foi confirmada.
   * Aditivo — clientes legados podem ignorar.
   */
  persisted: boolean;
};

/**
 * Envelope público de sucesso.
 * `persisted` deve reflectir confirmação real de escrita na BD — nunca inferir
 * a partir de HTTP 200, success, Supabase configurado ou event ID sozinhos.
 */
export function buildLocalRsvpSuccessBody(
  persisted: boolean
): LocalRsvpSuccessBody {
  return {
    success: true,
    message: LOCAL_RSVP_SUCCESS_MESSAGE,
    persisted: persisted === true,
  };
}
