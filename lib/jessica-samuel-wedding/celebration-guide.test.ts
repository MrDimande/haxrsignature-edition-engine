import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
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

  it("lista de presentes é orientação presencial — sem catálogo de produtos", () => {
    assert.equal(giftListEnabled, true);
    assert.equal(WEDDING_GIFT_GUIDANCE.storeName, "Casa das Loiças");
    assert.match(WEDDING_GIFT_GUIDANCE.storeAddress, /Karl Marx/);
    assert.match(WEDDING_GIFT_GUIDANCE.storeAddress, /450/);
    assert.equal(WEDDING_GIFT_GUIDANCE.storePhoneDisplay, "+258 82 311 5680");
    assert.ok(WEDDING_GIFT_GUIDANCE.storeMapsUrl.includes("share.google"));
    assert.match(WEDDING_GIFT_GUIDANCE.registryName, /Jessica Muege/);
    assert.match(WEDDING_GIFT_GUIDANCE.registryName, /Samuel Govene/);
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
    assert.match(WEDDING_CHARITY_REQUEST.title, /alegria/i);
    assert.equal(WEDDING_CHARITY_REQUEST.verseReference, "Mateus 25:40");
  });
});
