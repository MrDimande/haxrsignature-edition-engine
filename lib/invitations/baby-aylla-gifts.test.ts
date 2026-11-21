import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { POST as reserveGiftPost } from "../../app/api/gifts/reserve/route";
import { GET as getGifts } from "../../app/api/gifts/route";
import {
  AYLLA_GIFTS_CONFIG,
  canBabyAyllaGiftRegistryReserve,
} from "../aylla/gifts/config";
import {
  AYLLA_GIFT_CATEGORIES,
  AYLLA_GIFT_CANDIDATES,
  AYLLA_GIFT_CATALOG,
  type BabyAyllaGiftCandidate,
  getBabyAyllaPublicGiftCatalog,
} from "../../data/gifts/baby-aylla";
import * as ayllaGiftData from "../../data/gifts/baby-aylla";
import { evaluateBabyAyllaGiftEligibility } from "../aylla/gifts/eligibility";
import { resolveBabyAyllaGiftPresentation } from "../aylla/gifts/presentation";

const approvedCandidateState: BabyAyllaGiftCandidate["familyApproval"] = "approved";

describe("Baby Aylla Gift Registry — Phase A safety contract", () => {
  it("keeps the candidate approval contract ready for all family decisions", () => {
    assert.equal(approvedCandidateState, "approved");
  });
  it("keeps the registry disabled and structurally scoped to the canonical event", () => {
    assert.equal(AYLLA_GIFTS_CONFIG.slug, "babyaylla");
    assert.equal(AYLLA_GIFTS_CONFIG.registryKey, "baby-aylla-couture");
    assert.equal(AYLLA_GIFTS_CONFIG.enabled, false);
    assert.equal(AYLLA_GIFTS_CONFIG.allowDraftReservations, false);
    assert.equal(canBabyAyllaGiftRegistryReserve({ invitationStatus: "draft" }), false);
    assert.equal(canBabyAyllaGiftRegistryReserve({ invitationStatus: "active" }), false);
  });

  it("publishes only the seven approved structural categories while the family catalog is pending", () => {
    assert.equal(AYLLA_GIFT_CATEGORIES.length, 7);
    assert.equal(AYLLA_GIFT_CATEGORIES[0].id, "cantinho-dos-sonhos");
    assert.equal(AYLLA_GIFT_CATALOG.length, 0);
    assert.deepEqual(getBabyAyllaPublicGiftCatalog(), []);
  });

  it("keeps the official 52-item family candidate catalogue separate from the public catalogue", () => {
    const candidateCatalog = (ayllaGiftData as { AYLLA_GIFT_CANDIDATES?: readonly unknown[] })
      .AYLLA_GIFT_CANDIDATES;

    assert.equal(Array.isArray(candidateCatalog), true);
    assert.equal(candidateCatalog?.length, 52);
  });

  it("keeps all 52 candidates pending, unique and distributed across the official categories", () => {
    const expectedCounts = {
      "cantinho-dos-sonhos": 11,
      "guarda-roupa": 7,
      "bonecas-companhia": 4,
      "descobrir-aprender": 11,
      "brincar-explorar": 7,
      "pequenos-essenciais": 7,
      "tesouros-recordacoes": 5,
    } as const;

    assert.equal(new Set(AYLLA_GIFT_CANDIDATES.map((gift) => gift.id)).size, 52);
    assert.deepEqual(
      Object.fromEntries(
        AYLLA_GIFT_CATEGORIES.map((category) => [
          category.id,
          AYLLA_GIFT_CANDIDATES.filter((gift) => gift.category === category.id).length,
        ])
      ),
      expectedCounts
    );
    assert.equal(AYLLA_GIFT_CANDIDATES.every((gift) => gift.approvedByFamily === false), true);
    assert.equal(AYLLA_GIFT_CANDIDATES.every((gift) => gift.enabled === false), true);
    assert.equal(AYLLA_GIFT_CANDIDATES.every((gift) => gift.familyApproval === "pending"), true);
    assert.equal(AYLLA_GIFT_CANDIDATES.every((gift) => gift.suggestedQuantity === null), true);
    assert.equal(AYLLA_GIFT_CANDIDATES.every((gift) => gift.approvedQuantity === null), true);
    assert.equal(AYLLA_GIFT_CANDIDATES.some((gift) => gift.id.includes("walker")), false);
  });

  it("contains only the official Phase B candidate names in their supplied order", () => {
    assert.deepEqual(AYLLA_GIFT_CANDIDATES.map((gift) => gift.name), [
      "Lençóis de berço", "Cobertores e mantinhas", "Tapete infantil macio e lavável", "Candeeiro infantil", "Luz de presença nocturna", "Quadros decorativos infantis", "Decoração personalizada com o nome Aylla", "Cestos organizadores de brinquedos", "Caixa de recordações", "Régua decorativa de crescimento", "Trocador acolchoado",
      "Vestidos de princesa", "Vestidos para ocasiões especiais", "Conjuntos de passeio", "Pijamas confortáveis", "Sapatos infantis", "Sandálias infantis", "Conjuntos de roupa casual",
      "Bonecas adequadas a partir de 12 meses", "Ursinhos de peluche", "Bonecas de pano macias", "Peluches de animais",
      "Cubo de actividades", "Brinquedo de encaixar formas", "Torre de argolas para empilhar", "Copos de empilhar", "Blocos de construção grandes", "Blocos de madeira", "Livros de cartão resistentes", "Puzzles simples com peças grandes", "Instrumentos musicais infantis", "Mesa de actividades", "Bola sensorial macia",
      "Tapete de actividades", "Brinquedo de empurrar estável, adequado à idade", "Escorrega infantil pequeno", "Tenda infantil", "Mesa de brincar com água", "Bola grande e macia", "Piscina insuflável pequena",
      "Pratos infantis", "Copos de aprendizagem", "Talheres infantis", "Cadeira de alimentação", "Mochila infantil", "Garrafa térmica infantil", "Babadores impermeáveis",
      "Cofrinho para a poupança da Mana Dior", "Álbum de fotografias", "Caixa de recordações personalizada", "Livro de memórias do primeiro ano", "Presente comemorativo personalizado",
    ]);
  });

  it("requires a verified session bound to a confirmed RSVP from this event", () => {
    const eligible = evaluateBabyAyllaGiftEligibility({
      session: { verified: true, guestId: "guest-aylla", eventId: AYLLA_GIFTS_CONFIG.eventId },
      guest: {
        id: "guest-aylla",
        eventId: AYLLA_GIFTS_CONFIG.eventId,
        status: "confirmed",
        source: "edition_rsvp",
        archived: false,
        deleted: false,
        incorrect: false,
      },
    });
    assert.deepEqual(eligible, { allowed: true, guestId: "guest-aylla" });

    assert.equal(
      evaluateBabyAyllaGiftEligibility({
        session: { verified: true, guestId: "guest-other", eventId: AYLLA_GIFTS_CONFIG.eventId },
        guest: {
          id: "guest-other",
          eventId: "another-event",
          status: "confirmed",
          source: "edition_rsvp",
          archived: false,
          deleted: false,
          incorrect: false,
        },
      }).allowed,
      false
    );

    for (const input of [
      {
        session: { verified: false, guestId: "guest-aylla", eventId: AYLLA_GIFTS_CONFIG.eventId },
        guest: {
          id: "guest-aylla", eventId: AYLLA_GIFTS_CONFIG.eventId, status: "confirmed", source: "edition_rsvp",
          archived: false, deleted: false, incorrect: false,
        },
      },
      {
        session: { verified: true, guestId: "guest-someone-else", eventId: AYLLA_GIFTS_CONFIG.eventId },
        guest: {
          id: "guest-aylla", eventId: AYLLA_GIFTS_CONFIG.eventId, status: "confirmed", source: "edition_rsvp",
          archived: false, deleted: false, incorrect: false,
        },
      },
      {
        session: { verified: true, guestId: "guest-aylla", eventId: AYLLA_GIFTS_CONFIG.eventId },
        guest: {
          id: "guest-aylla", eventId: AYLLA_GIFTS_CONFIG.eventId, status: "declined", source: "edition_rsvp",
          archived: false, deleted: false, incorrect: false,
        },
      },
      {
        session: { verified: true, guestId: "guest-aylla", eventId: AYLLA_GIFTS_CONFIG.eventId },
        guest: {
          id: "guest-aylla", eventId: AYLLA_GIFTS_CONFIG.eventId, status: "confirmed", source: "import",
          archived: false, deleted: false, incorrect: false,
        },
      },
    ]) {
      assert.deepEqual(evaluateBabyAyllaGiftEligibility(input), { allowed: false, reason: "access_denied" });
    }
  });

  it("rejects reservations for the draft disabled registry before a public name can be used", async () => {
    const response = await reserveGiftPost(
      new Request("https://example.test/api/gifts/reserve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug: "babyaylla",
          itemId: "aylla-pijamas",
          guestName: "Não deve ser usado",
        }),
      })
    );

    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), {
      success: false,
      code: "GIFT_REGISTRY_CLOSED",
      error: "A lista de presentes da Aylla ainda não está disponível.",
    });
  });

  it("serves an isolated no-store structural catalog and never falls back to rose-elegance", async () => {
    const response = await getGifts(new Request("https://example.test/api/gifts?slug=babyaylla"));

    assert.equal(response.status, 200);
    assert.match(response.headers.get("cache-control") ?? "", /no-store/);
    assert.deepEqual(await response.json(), {
      success: true,
      registry: { key: "baby-aylla-couture", enabled: false, reservationsEnabled: false },
      categories: AYLLA_GIFT_CATEGORIES,
      gifts: [],
    });
  });

  it("shows an inspiration-only editorial state while catalog activation is pending", () => {
    assert.deepEqual(resolveBabyAyllaGiftPresentation({ invitationStatus: "draft" }), {
      mode: "inspiration",
      canReserve: false,
      message: "A reserva fica disponível depois da confirmação de presença e validação do contacto.",
    });
  });
});
