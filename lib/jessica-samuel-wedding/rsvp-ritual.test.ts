import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildCompanionNote,
  buildWeddingRsvpMessageDraft,
  daysUntilWedding,
  formatDaysUntilLabel,
  isWeddingRsvpSafePreviewEnabled,
  mapRsvpHttpError,
  nextPhaseAfterPresence,
  normalizeMozambiquePhone,
  packWeddingRsvpMessage,
  progressStepIndex,
  validateWeddingRsvpContact,
} from "./rsvp-ritual";

describe("jessica-samuel rsvp ritual helpers", () => {
  it("avança para convidados quando confirma presença", () => {
    assert.equal(nextPhaseAfterPresence("yes"), "guests");
    assert.equal(nextPhaseAfterPresence("no"), "absence-message");
  });

  it("mapeia o progresso discreto por fase", () => {
    assert.equal(progressStepIndex("welcome"), null);
    assert.equal(progressStepIndex("presence"), 1);
    assert.equal(progressStepIndex("guests"), 2);
    assert.equal(progressStepIndex("details"), 3);
    assert.equal(progressStepIndex("review"), 3);
    assert.equal(progressStepIndex("success-attending"), 4);
    assert.equal(progressStepIndex("success-absent"), 4);
    assert.equal(progressStepIndex("already"), 4);
  });

  it("packing: conteúdo vazio", () => {
    const packed = packWeddingRsvpMessage({});
    assert.equal(packed.ok, true);
    if (packed.ok) {
      assert.equal(packed.value, undefined);
      assert.equal(packed.length, 0);
      assert.equal(packed.remaining, 280);
    }
  });

  it("packing: mensagem curta", () => {
    const packed = packWeddingRsvpMessage({
      companionNote: "1 acompanhante(s): Ana",
      preferences: {
        dietary: "vegetariano",
        accessibility: "",
        other: "",
      },
      personalMessage: "Parabéns!",
    });
    assert.equal(packed.ok, true);
    if (packed.ok) {
      assert.ok(packed.value?.includes("acompanhante"));
      assert.ok(packed.value?.includes("Alimentação: vegetariano"));
      assert.ok(packed.value?.includes("Mensagem: Parabéns!"));
      assert.ok(packed.length <= 280);
      assert.equal(packed.remaining, 280 - packed.length);
    }
  });

  it("packing: limite exacto de 280", () => {
    const prefix = "Mensagem: ";
    const body = "á".repeat(280 - prefix.length);
    const draft = `${prefix}${body}`;
    assert.equal(draft.length, 280);
    const packed = packWeddingRsvpMessage({ personalMessage: body });
    assert.equal(packed.ok, true);
    if (packed.ok) {
      assert.equal(packed.length, 280);
      assert.equal(packed.remaining, 0);
      assert.equal(packed.value, draft);
    }
  });

  it("packing: conteúdo superior a 280 — não trunca", () => {
    const packed = packWeddingRsvpMessage({
      companionNote: "2 acompanhante(s): Maria, João",
      personalMessage: "x".repeat(400),
    });
    assert.equal(packed.ok, false);
    if (!packed.ok) {
      assert.ok(packed.length > 280);
      assert.ok(packed.remaining < 0);
      assert.ok(packed.error.includes("máximo 280"));
      assert.equal(
        packed.value,
        buildWeddingRsvpMessageDraft({
          companionNote: "2 acompanhante(s): Maria, João",
          personalMessage: "x".repeat(400),
        })
      );
      assert.ok(packed.value.length > 280);
    }
  });

  it("packing: caracteres especiais e acentuação", () => {
    const packed = packWeddingRsvpMessage({
      preferences: {
        dietary: "sem glúten · amendoim",
        accessibility: "cadeira de rodas",
        other: "chegada às 15h00",
      },
      personalMessage: "Que a bênção vos acompanhe — com amor!",
    });
    assert.equal(packed.ok, true);
    if (packed.ok) {
      assert.ok(packed.value?.includes("glúten"));
      assert.ok(packed.value?.includes("bênção"));
      assert.ok(packed.value?.includes("15h00"));
    }
  });

  it("constrói nota de acompanhantes", () => {
    assert.equal(buildCompanionNote(0, []), undefined);
    assert.equal(
      buildCompanionNote(2, ["", ""]),
      "2 acompanhante(s) · nomes não indicados"
    );
    assert.equal(
      buildCompanionNote(2, ["Ana", "Bruno"]),
      "2 acompanhante(s): Ana, Bruno"
    );
  });

  it("calcula dias até ao casamento", () => {
    const days = daysUntilWedding(
      "2026-08-15",
      new Date("2026-08-10T10:00:00+02:00")
    );
    assert.equal(days, 5);
    assert.equal(formatDaysUntilLabel(5), "Faltam 5 dias para celebrarmos juntos.");
    assert.equal(formatDaysUntilLabel(1), "Falta 1 dia para celebrarmos juntos.");
    assert.equal(formatDaysUntilLabel(0), "É hoje — celebramos juntos.");
  });

  it("normaliza telefone moçambicano com +258", () => {
    const a = normalizeMozambiquePhone("84 123 4567");
    assert.equal(a.ok, true);
    if (a.ok) assert.equal(a.e164, "+258841234567");

    const b = normalizeMozambiquePhone("+258841234567");
    assert.equal(b.ok, true);
    if (b.ok) assert.equal(b.e164, "+258841234567");

    const c = normalizeMozambiquePhone("258841234567");
    assert.equal(c.ok, true);
    if (c.ok) assert.equal(c.e164, "+258841234567");

    const bad = normalizeMozambiquePhone("12345");
    assert.equal(bad.ok, false);
  });

  it("valida contacto email ou telefone", () => {
    const okEmail = validateWeddingRsvpContact({
      email: "a@b.com",
      phone: "",
      requireContact: true,
    });
    assert.equal(okEmail.ok, true);

    const okPhone = validateWeddingRsvpContact({
      email: "",
      phone: "+258 84 123 4567",
      requireContact: true,
    });
    assert.equal(okPhone.ok, true);
    if (okPhone.ok) assert.equal(okPhone.phone, "+258841234567");

    const missing = validateWeddingRsvpContact({
      email: "",
      phone: "",
      requireContact: true,
    });
    assert.equal(missing.ok, false);

    const badEmail = validateWeddingRsvpContact({
      email: "invalido",
      phone: "",
      requireContact: true,
    });
    assert.equal(badEmail.ok, false);
  });

  it("preview seguro só fora de produção com query", () => {
    assert.equal(
      isWeddingRsvpSafePreviewEnabled("?rsvpPreview=1", "development"),
      true
    );
    assert.equal(
      isWeddingRsvpSafePreviewEnabled("?rsvpPreview=1", "production"),
      false
    );
    assert.equal(
      isWeddingRsvpSafePreviewEnabled("", "development"),
      false
    );
  });

  it("mapeia erros HTTP para mensagens claras", () => {
    assert.match(mapRsvpHttpError(429), /Demasiados/);
    assert.match(mapRsvpHttpError(500), /indisponível/);
    assert.match(mapRsvpHttpError(400, "Campo inválido"), /Campo inválido/);
  });
});
