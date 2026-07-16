import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  resolveRsvpClientOutcome,
  resolveRsvpSubmitUiStateAfterFetch,
  resolveRsvpSubmitUiStateInFinally,
} from "./client-outcome";
import { buildLocalRsvpSuccessBody } from "./local-response";

describe("resolveRsvpClientOutcome", () => {
  it("exige success=true e persisted=true para sucesso visual", () => {
    const payload = buildLocalRsvpSuccessBody({ notificationSkipped: true });
    const outcome = resolveRsvpClientOutcome(true, payload);
    assert.equal(outcome.kind, "success");
  });

  it("rejeita 200 sem persisted", () => {
    const outcome = resolveRsvpClientOutcome(true, {
      success: true,
      message: "ok",
    });
    assert.equal(outcome.kind, "error");
  });

  it("rejeita honeypot mesmo com HTTP 200", () => {
    const outcome = resolveRsvpClientOutcome(true, {
      success: false,
      persisted: false,
      honeypot: true,
    });
    assert.equal(outcome.kind, "error");
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

  it("erro + persisted=true → persisted_partial (explícito)", () => {
    const outcome = resolveRsvpClientOutcome(false, {
      success: false,
      persisted: true,
      error: "Email falhou",
    });
    assert.equal(outcome.kind, "persisted_partial");
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

  it("persisted_partial também mostra sucesso UI", () => {
    assert.equal(
      resolveRsvpSubmitUiStateAfterFetch("sending", {
        kind: "persisted_partial",
        message: "Email falhou",
      }),
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
