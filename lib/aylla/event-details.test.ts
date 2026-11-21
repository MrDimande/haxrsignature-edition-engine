import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BABY_AYLLA_EVENT } from "./event-details";

describe("Baby Aylla — Event Details & Contract", () => {
  it("has exact canonical date of 2027-01-23 (Sábado)", () => {
    assert.equal(BABY_AYLLA_EVENT.eventDateIso, "2027-01-23");
    assert.equal(BABY_AYLLA_EVENT.eventDayOfWeek, "Sábado");
    assert.equal(BABY_AYLLA_EVENT.timezone, "Africa/Maputo");
  });

  it("marks confirmed venue and unconfirmed fields explicitly without inventing fake data", () => {
    assert.equal(BABY_AYLLA_EVENT.time.isConfirmed, false);
    assert.equal(BABY_AYLLA_EVENT.time.display, "Hora a confirmar");
    assert.equal(BABY_AYLLA_EVENT.venue.isConfirmed, true);
    assert.equal(BABY_AYLLA_EVENT.venue.name, "Vila do Mar Eventos");
    assert.equal(BABY_AYLLA_EVENT.dressCode.isConfirmed, false);
  });

  it("has approved editorial narrative matching the creative brief", () => {
    assert.equal(BABY_AYLLA_EVENT.editorial.coverEyebrow, "CONVITE DIGITAL");
    assert.equal(BABY_AYLLA_EVENT.editorial.titlePart1, "BABY");
    assert.equal(BABY_AYLLA_EVENT.editorial.titlePart2, "Aylla");
    assert.equal(BABY_AYLLA_EVENT.editorial.occasionBadge, "ANIVERSÁRIO");
    assert.equal(
      BABY_AYLLA_EVENT.editorial.coverTagline,
      "Um convite para viver um dia encantado"
    );
    assert.equal(BABY_AYLLA_EVENT.editorial.ctaLabel, "ABRIR CONVITE");
    assert.equal(BABY_AYLLA_EVENT.chapters.length, 3);
    assert.equal(BABY_AYLLA_EVENT.chapters[0].title, "O Encanto");
  });

  it("specifies correct admin binding environment variable", () => {
    assert.equal(BABY_AYLLA_EVENT.rsvp.adminEnvVar, "EDITION_EVENT_AYLLA_ID");
  });
});
