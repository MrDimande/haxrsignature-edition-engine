import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  STAN_EVENT,
  STAN_TIMEZONE,
  buildStanGoogleCalendarUrl,
  buildStanIcsContent,
  getStanEventStartDate,
  getStanWhatsAppUrl,
  buildCompanionNote,
} from "./event-details";
import { auditStanGallerySrcs } from "../../engines/true-theme/profiles/stan-real-madrid/stan-gallery-data";

describe("stan event-details", () => {
  it("usa Africa/Maputo e 11h00 local (09h00 UTC)", () => {
    assert.equal(STAN_TIMEZONE, "Africa/Maputo");
    const start = getStanEventStartDate();
    assert.equal(start.toISOString(), "2026-09-12T09:00:00.000Z");
  });

  it("Google Calendar usa UTC correcto (não 11h00Z)", () => {
    const url = buildStanGoogleCalendarUrl();
    assert.match(url, /dates=20260912T090000Z\//);
    assert.doesNotMatch(url, /dates=20260912T110000Z/);
    assert.match(url, /ctz=Africa%2FMaputo/);
  });

  it("ICS declara TZID Africa/Maputo e inclui DTSTART e DTEND", () => {
    const ics = buildStanIcsContent();
    assert.match(ics, /TZID:Africa\/Maputo/);
    assert.match(ics, /DTSTART;TZID=Africa\/Maputo:20260912T110000/);
    assert.match(ics, /DTEND;TZID=Africa\/Maputo:20260912T150000/);
    assert.match(ics, /SUMMARY:5º Aniversário do Stan — O Quinto Acto/);
  });

  it("WhatsApp sem número devolve null", () => {
    assert.equal(getStanWhatsAppUrl(""), null);
  });

  it("nota de acompanhantes", () => {
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

  it("data canónica confirmada", () => {
    assert.equal(STAN_EVENT.dateIso, "2026-09-12");
    assert.equal(STAN_EVENT.timeLabel, "11h00");
  });
});

describe("stan gallery audit", () => {
  it("não tem srcs inválidos (CSS / lixo)", () => {
    assert.deepEqual(auditStanGallerySrcs(), []);
  });
});
