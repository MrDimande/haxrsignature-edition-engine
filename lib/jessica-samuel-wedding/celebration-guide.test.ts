import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { INVITATIONS } from "@data/invitations";
import {
  buildWeddingGoogleCalendarUrl,
  buildWeddingIcsContent,
  WEDDING_CHARITY_REQUEST,
  WEDDING_EVENT,
  WEDDING_ITINERARY,
  WEDDING_ITINERARY_SCHEDULE_CONFIRMED,
  WEDDING_RELIGIOUS_CEREMONY_TIME,
} from "./event-details";
import {
  giftListEnabled,
  shouldShowWeddingGiftGuideCard,
  WEDDING_GIFT_GUIDANCE,
} from "./gifts/catalog";
import { JESSICA_SAMUEL_GIFT_QUOTATION } from "./gifts/quotation-meta";
import { TRADITIONAL_COPY } from "@lib/jessica-samuel-traditional/event-details";

describe("jessica-samuel celebration guide config", () => {
  it("centraliza o horário da cerimónia religiosa numa única fonte", () => {
    assert.equal(WEDDING_ITINERARY[0].timeLabel, WEDDING_RELIGIOUS_CEREMONY_TIME);
    assert.equal(WEDDING_EVENT.timeLabel, WEDDING_RELIGIOUS_CEREMONY_TIME);
    assert.ok(
      WEDDING_EVENT.calendarDescription.includes(WEDDING_RELIGIOUS_CEREMONY_TIME)
    );
  });

  it("marca o horário da cerimónia religiosa como confirmado (10h30)", () => {
    assert.equal(WEDDING_ITINERARY_SCHEDULE_CONFIRMED, true);
    assert.equal(WEDDING_RELIGIOUS_CEREMONY_TIME, "10h30");
  });

  it("alinha invitations, calendário Google e .ics ao horário confirmado (UTC+02)", () => {
    const meta = INVITATIONS.jessicasamuelwedding.metadata;
    assert.equal(meta.time, WEDDING_RELIGIOUS_CEREMONY_TIME);
    assert.equal(WEDDING_EVENT.dateIso, "2026-08-15");

    const calendarUrl = buildWeddingGoogleCalendarUrl();
    assert.ok(calendarUrl);
    // 10h30 Africa/Maputo (+02) → 08:30 UTC; duração 5h → 13:30 UTC
    assert.match(calendarUrl, /dates=20260815T083000Z\/20260815T133000Z/);
    assert.ok(calendarUrl.includes(encodeURIComponent(WEDDING_RELIGIOUS_CEREMONY_TIME)));

    const ics = buildWeddingIcsContent();
    assert.ok(ics);
    assert.match(ics, /DTSTART:20260815T103000/);
    assert.match(ics, /DTEND:20260815T153000/);
    assert.ok(ics.includes(WEDDING_RELIGIOUS_CEREMONY_TIME));
  });

  it("lista de presentes é orientação presencial — sem catálogo de produtos", () => {
    assert.equal(giftListEnabled, true);
    assert.equal(WEDDING_GIFT_GUIDANCE.storeName, "Casa das Loiças");
    assert.match(WEDDING_GIFT_GUIDANCE.storeAddress, /Karl Marx/);
    assert.match(WEDDING_GIFT_GUIDANCE.storeAddress, /450/);
    assert.equal(WEDDING_GIFT_GUIDANCE.storePhoneDisplay, "+258 82 311 5680");
    assert.ok(WEDDING_GIFT_GUIDANCE.storeMapsUrl.includes("share.google"));
    assert.equal(WEDDING_GIFT_GUIDANCE.registryName, "Lista em nome de Jessica & Samuel");
    assert.equal(WEDDING_GIFT_GUIDANCE.registry.listName, "Lista em nome de Jessica & Samuel");
    assert.equal(
      WEDDING_GIFT_GUIDANCE.registry.quotationLine,
      "Cotação n.º 1044 · Série 2026"
    );
    assert.equal(
      WEDDING_GIFT_GUIDANCE.registry.issuedLine,
      "Emitida em 16 de junho de 2026"
    );
    assert.equal(shouldShowWeddingGiftGuideCard(), true);
    assert.equal(shouldShowWeddingGiftGuideCard(false), false);
  });

  it("expõe links de localização sem URLs na copy dos momentos", () => {
    const religiosa = WEDDING_ITINERARY[0];
    const civil = WEDDING_ITINERARY[1];
    assert.ok(religiosa.mapsUrl?.startsWith("https://maps.app.goo.gl/"));
    assert.ok(civil.mapsUrl?.startsWith("https://maps.app.goo.gl/"));
    assert.deepEqual(religiosa.locationLines, [
      "Comunidade Santos Mártires de Uganda",
      "Malhampsene",
    ]);
    assert.equal(civil.note, "Percurso sugerido: via Matola-Rio.");
  });

  it("apresenta o pedido solidário como opcional e com referência bíblica", () => {
    assert.match(WEDDING_CHARITY_REQUEST.lead, /produto não perecível/i);
    assert.match(WEDDING_CHARITY_REQUEST.body, /orfanato/i);
    assert.match(WEDDING_CHARITY_REQUEST.optionalLabel, /opcional/i);
    assert.match(WEDDING_CHARITY_REQUEST.timelineSummary, /produto não perecível/i);
    assert.match(WEDDING_CHARITY_REQUEST.timelineSummary, /orfanato/i);
    assert.equal(WEDDING_CHARITY_REQUEST.verseReference, "Mateus 25:40");
  });
});

describe("jessica-samuel gift quotation 1044", () => {
  it("expõe a identificação editorial canónica partilhada pelos dois convites", () => {
    assert.equal(JESSICA_SAMUEL_GIFT_QUOTATION.listDisplayName, "Lista em nome de Jessica & Samuel");
    assert.equal(JESSICA_SAMUEL_GIFT_QUOTATION.number, "1044");
    assert.equal(JESSICA_SAMUEL_GIFT_QUOTATION.seriesYear, "2026");
    assert.equal(JESSICA_SAMUEL_GIFT_QUOTATION.issueDateIso, "2026-06-16");
    assert.equal(
      JESSICA_SAMUEL_GIFT_QUOTATION.quotationLine,
      "Cotação n.º 1044 · Série 2026"
    );
    assert.equal(
      JESSICA_SAMUEL_GIFT_QUOTATION.issuedLine,
      "Emitida em 16 de junho de 2026"
    );
  });

  it("remove o nome legal da copy de consulta do lobolo", () => {
    assert.doesNotMatch(TRADITIONAL_COPY.giftsConsultNote, /Jessica Muege/);
    assert.doesNotMatch(TRADITIONAL_COPY.giftsConsultNote, /Samuel Govene/);
    assert.match(TRADITIONAL_COPY.giftsConsultNote, /consulta presencial/i);
  });
});
