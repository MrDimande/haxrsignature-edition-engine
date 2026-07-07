import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  resolveRsvpClientOutcome,
  resolveRsvpSubmitUiStateAfterFetch,
  resolveRsvpSubmitUiStateInFinally,
} from "./client-outcome";
import { buildLocalRsvpSuccessBody } from "./local-response";

describe("resolveRsvpClientOutcome", () => {
  it("trata envelope mínimo 200 como sucesso", () => {
    const payload = buildLocalRsvpSuccessBody();
    const outcome = resolveRsvpClientOutcome(true, payload);
    assert.equal(outcome.kind, "success");
  });

  it("trata 400 de validação como erro", () => {
    const outcome = resolveRsvpClientOutcome(false, {
      success: false,
      error: "Por favor, introduza o seu nome.",
    });
    assert.equal(outcome.kind, "error");
    if (outcome.kind === "error") {
      assert.match(outcome.message, /nome/i);
    }
  });

  it("trata 500 como erro", () => {
    const outcome = resolveRsvpClientOutcome(false, {
      success: false,
      error: "Ocorreu um erro ao processar o seu RSVP.",
    });
    assert.equal(outcome.kind, "error");
  });

  it("trata 502 legado com persisted como sucesso", () => {
    const outcome = resolveRsvpClientOutcome(false, {
      success: false,
      persisted: true,
      error: "Email falhou",
    });
    assert.equal(outcome.kind, "success");
  });

  it("trata 200 com success false como erro", () => {
    const outcome = resolveRsvpClientOutcome(true, {
      success: false,
      error: "Erro inesperado",
    });
    assert.equal(outcome.kind, "error");
  });
});

describe("resolveRsvpSubmitUiStateAfterFetch", () => {
  it("passa para success após resposta válida", () => {
    assert.equal(
      resolveRsvpSubmitUiStateAfterFetch("sending", { kind: "success" }),
      "success"
    );
  });

  it("passa para error após falha", () => {
    assert.equal(
      resolveRsvpSubmitUiStateAfterFetch("sending", {
        kind: "error",
        message: "Falhou",
      }),
      "error"
    );
  });
});

describe("resolveRsvpSubmitUiStateInFinally", () => {
  it("limpa sending órfão para idle", () => {
    assert.equal(resolveRsvpSubmitUiStateInFinally("sending"), "idle");
  });

  it("preserva success após sucesso", () => {
    assert.equal(resolveRsvpSubmitUiStateInFinally("success"), "success");
  });

  it("preserva error após falha", () => {
    assert.equal(resolveRsvpSubmitUiStateInFinally("error"), "error");
  });
});

describe("duplicate-click / in-flight protection", () => {
  it("segundo outcome de erro não regressa para sending", () => {
    assert.equal(resolveRsvpSubmitUiStateInFinally("error"), "error");
  });
});
