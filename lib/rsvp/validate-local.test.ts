import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseAttending } from "./parse-attending";
import { validateLocalRsvpPayload } from "./validate-local";

describe("parseAttending", () => {
  it("aceita true / false booleanos", () => {
    assert.deepEqual(parseAttending(true), { ok: true, attending: true });
    assert.deepEqual(parseAttending(false), { ok: true, attending: false });
  });

  it('aceita "true" / "false" / "1" / "0"', () => {
    assert.deepEqual(parseAttending("true"), { ok: true, attending: true });
    assert.deepEqual(parseAttending("false"), { ok: true, attending: false });
    assert.deepEqual(parseAttending("1"), { ok: true, attending: true });
    assert.deepEqual(parseAttending("0"), { ok: true, attending: false });
    assert.deepEqual(parseAttending(1), { ok: true, attending: true });
    assert.deepEqual(parseAttending(0), { ok: true, attending: false });
  });

  it('rejeita "false" que Boolean() interpretaria como true', () => {
    const result = parseAttending("false");
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.attending, false);
    assert.equal(Boolean("false"), true);
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

  it("aceita RSVP com acompanhantes para convite activo", () => {
    const result = validateLocalRsvpPayload({
      slug: "jessicakulaya",
      name: "Convidado Teste",
      attending: true,
      guests: 3,
      phone: "840000000",
      messageForBride: "2 acompanhante(s): Maria Teste, João Teste",
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.slug, "jessicakulaya");
      assert.equal(result.submission.attending, true);
      assert.equal(result.submission.guests, 3);
    }
  });

  it('mantém attending false quando body envia "false" ou "0"', () => {
    for (const attending of ["false", "0", false, 0] as const) {
      const result = validateLocalRsvpPayload({
        slug: "jessicakulaya",
        name: "Convidado Ausente",
        attending,
        guests: 1,
        phone: "840000000",
      });
      assert.equal(result.ok, true, `failed for ${String(attending)}`);
      if (result.ok) {
        assert.equal(result.submission.attending, false);
        assert.equal(result.submission.guests, 0);
      }
    }
  });

  it("rejeita attending inválido", () => {
    const result = validateLocalRsvpPayload({
      slug: "jessicakulaya",
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

  it("honeypot devolve sucesso silencioso", () => {
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
      assert.doesNotMatch(result.body.message, /honeypot/i);
    }
  });
});
