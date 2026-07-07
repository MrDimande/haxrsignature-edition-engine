export type RsvpApiPayload = {
  success?: boolean;
  error?: string;
  /** Legado — já não emitido em respostas 200; mantido para erros antigos/proxy. */
  persisted?: boolean;
};

export type RsvpClientOutcome =
  | { kind: "success" }
  | { kind: "error"; message: string };

export function resolveRsvpClientOutcome(
  responseOk: boolean,
  data: RsvpApiPayload
): RsvpClientOutcome {
  if (!responseOk) {
    if (data.persisted) {
      return { kind: "success" };
    }

    return {
      kind: "error",
      message: data.error || "Erro ao processar confirmação.",
    };
  }

  if (data.success === false) {
    return {
      kind: "error",
      message: data.error || "Erro ao processar confirmação.",
    };
  }

  return { kind: "success" };
}

export type RsvpSubmitUiState = "idle" | "sending" | "success" | "error";

export function resolveRsvpSubmitUiStateAfterFetch(
  current: RsvpSubmitUiState,
  outcome: RsvpClientOutcome
): RsvpSubmitUiState {
  if (outcome.kind === "success") {
    return "success";
  }

  return "error";
}

export function resolveRsvpSubmitUiStateInFinally(
  current: RsvpSubmitUiState
): RsvpSubmitUiState {
  return current === "sending" ? "idle" : current;
}
