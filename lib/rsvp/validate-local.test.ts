import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateLocalRsvpPayload } from "./validate-local";

describe("validateLocalRsvpPayload", () => {
  it("rejeita nome vazio com 400", () => {
    const result = validateLocalRsvpPayload({
      slug: "despedida-de-solteira",
      name: "",
      attending: true,
      guests: 1,
      phone: "840000000",
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 400);
      assert.equal(result.outcome, "validation_error");
      assert.match(result.body.error, /nome/i);
    }
  });

  it("rejeita despedida sem telefone com 400", () => {
    const result = validateLocalRsvpPayload({
      slug: "despedida-de-solteira",
      name: "Convidada Teste",
      attending: true,
      guests: 1,
      phone: "",
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 400);
      assert.match(result.body.error, /telefone/i);
    }
  });

  it("aceita payload mínimo válido para despedida", () => {
    const result = validateLocalRsvpPayload({
      slug: "despedida-de-solteira",
      name: "Convidada Teste",
      attending: true,
      guests: 1,
      phone: "840000000",
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.slug, "jessicachadelingerie");
      assert.equal(result.submission.attending, true);
      assert.equal(result.submission.guests, 1);
    }
  });
});
