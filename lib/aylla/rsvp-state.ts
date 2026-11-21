/**
 * RSVP availability is deliberately derived from the invitation publication
 * state. A visual Preview must never become an authorisation to persist data.
 */
export type BabyAyllaRsvpState = {
  readonly showForm: boolean;
  readonly canSubmit: boolean;
  readonly isDraftPreview: boolean;
};

export function resolveBabyAyllaRsvpState(
  isConfigured: boolean,
  invitationStatus: string
): BabyAyllaRsvpState {
  const isActive = isConfigured && invitationStatus === "active";
  const isDraftPreview = isConfigured && invitationStatus === "draft";

  return {
    showForm: isActive || isDraftPreview,
    canSubmit: isActive,
    isDraftPreview,
  };
}
