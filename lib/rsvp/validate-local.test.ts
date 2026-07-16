import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseAttending } from "./parse-attending";
import { validateLocalRsvpPayload } from "./validate-local";

describe("parseAttending", () => {
  it("aceita true / false booleanos", () => {
    assert.deepEqual(parseAttending(true), { ok: true, attending: true });
    assert.deepEqual(parseAttending(false), { ok: true, attending: false });
  });

  it("rejeita strings e números mesmo quando parecem booleanos", () => {
    for (const value of ["true", "false", "1", "0", 1, 0]) {
      assert.equal(parseAttending(value).ok, false);
    }
  });

  it("rejeita objectos, arrays e valores desconhecidos", () => {
    assert.equal(parseAttending({}).ok, false);
    assert.equal(parseAttending([]).ok, false);
    assert.equal(parseAttending("yes").ok, false);
    assert.equal(parseAttending(2).ok, false);
  });
});

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

  it("aceita RSVP com acompanhantes para casamento tradicional", () => {
    const result = validateLocalRsvpPayload({
      slug: "jessicaesamueltraditionalwedding",
      name: "Convidado Teste",
      attending: true,
      guests: 3,
      phone: "840000000",
      messageForBride: "2 acompanhante(s): Maria Teste, João Teste",
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.slug, "jessicaesamueltraditionalwedding");
      assert.equal(result.submission.attending, true);
      assert.equal(result.submission.guests, 3);
    }
  });

  it("mantém attending=false booleano e força guests=0", () => {
    const result = validateLocalRsvpPayload({
      slug: "jessicaesamueltraditionalwedding",
      name: "Convidado Ausente",
      attending: false,
      guests: 1,
      phone: "840000000",
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.submission.attending, false);
      assert.equal(result.submission.guests, 0);
    }
  });

  it("rejeita attending inválido", () => {
    const result = validateLocalRsvpPayload({
      slug: "jessicaesamueltraditionalwedding",
      name: "Convidado",
      attending: "maybe",
      guests: 1,
      phone: "840000000",
    });
    assert.equal(result.ok, false);
  });

  it("rejeita slug desconhecido sem fallback para jessicakulaya", () => {
    const result = validateLocalRsvpPayload({
      slug: "evento-fantasma",
      name: "Hacker",
      attending: true,
      guests: 1,
      phone: "840000000",
    });
    assert.equal(result.ok, false);
    if (!result.ok && result.outcome === "validation_error") {
      assert.match(result.body.error, /convite/i);
    }
  });

  it("rejeita draft lobolo-jessica-samuel", () => {
    const result = validateLocalRsvpPayload({
      slug: "lobolo-jessica-samuel",
      name: "Convidado",
      attending: true,
      guests: 1,
      phone: "840000000",
    });
    assert.equal(result.ok, false);
  });

  it("limita o tamanho do nome", () => {
    const result = validateLocalRsvpPayload({
      slug: "jessicakulaya",
      name: "A".repeat(500),
      attending: false,
      guests: 1,
      phone: "840000000",
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.submission.name.length, 120);
    }
  });

  it("honeypot devolve 200 sem sucesso nem persistência", () => {
    const result = validateLocalRsvpPayload({
      slug: "jessicakulaya",
      name: "Bot",
      attending: true,
      guests: 1,
      phone: "840000000",
      honeypot: "filled",
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.outcome, "honeypot");
      assert.equal(result.status, 200);
      assert.equal(result.body.success, false);
      assert.equal(result.body.persisted, false);
      assert.doesNotMatch(result.body.message, /honeypot/i);
    }
  });
});
