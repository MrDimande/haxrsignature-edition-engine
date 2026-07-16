export type RsvpApiPayload = {
  success?: boolean;
  message?: string;
  error?: string;
  persisted?: boolean;
  notificationSkipped?: boolean;
  guestEmailSent?: boolean;
  /** Honeypot / silent discard — never treat as confirmation. */
  honeypot?: boolean;
};

export type RsvpClientOutcome =
  | { kind: "success" }
  | { kind: "error"; message: string }
  | {
      /** Persistiu, mas a resposta sinaliza falha parcial (ex.: email). */
      kind: "persisted_partial";
      message: string;
    };

/**
 * Confirmação visual exige success=true AND persisted=true.
 * Erro + persisted=true → persisted_partial (UI pode mostrar sucesso com aviso).
 * Honeypot / 200 sem persist → erro (sem confirmação).
 */
export function resolveRsvpClientOutcome(
  responseOk: boolean,
  data: RsvpApiPayload
): RsvpClientOutcome {
  if (data.honeypot) {
    return {
      kind: "error",
      message: "Erro ao processar confirmação.",
    };
  }

  if (data.success === true && data.persisted === true) {
    return { kind: "success" };
  }

  if (data.persisted === true && data.success === false) {
    return {
      kind: "persisted_partial",
      message:
        data.error ||
        "A confirmação foi registada, mas houve um problema adicional.",
    };
  }

  if (!responseOk || data.success === false) {
    return {
      kind: "error",
      message: data.error || "Erro ao processar confirmação.",
    };
  }

  return {
    kind: "error",
    message: data.error || "Erro ao processar confirmação.",
  };
}

export type RsvpSubmitUiState = "idle" | "sending" | "success" | "error";

export function resolveRsvpSubmitUiStateAfterFetch(
  _current: RsvpSubmitUiState,
  outcome: RsvpClientOutcome
): RsvpSubmitUiState {
  if (outcome.kind === "success" || outcome.kind === "persisted_partial") {
    return "success";
  }

  return "error";
}

export function resolveRsvpSubmitUiStateInFinally(
  current: RsvpSubmitUiState
): RsvpSubmitUiState {
  return current === "sending" ? "idle" : current;
}
