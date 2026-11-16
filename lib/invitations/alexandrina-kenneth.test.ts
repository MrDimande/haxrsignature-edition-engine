import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { INVITATIONS } from "@data/invitations";
import { ThemeRegistry } from "@theme/registry";
import { resolveCanonicalInvitationSlug, resolveActiveInvitationSlug } from "@lib/invitations/allowlist";
import { validateLocalRsvpPayload } from "@lib/rsvp/validate-local";
import { submitUniversalRsvp } from "@lib/rsvp/universal-client";
import { buildEditionRsvpStorageKey, buildEditionGiftStorageKey } from "@lib/rsvp/storage-keys";
import { getInvitationAdminBinding, getEditionEventBinding } from "@lib/rsvp/events";
import { buildLocalRsvpSuccessBody } from "@lib/rsvp/local-response";

describe("Alexandrina & Kenneth — Engine Registry & Architecture Verification", () => {
  it("registers alexandrinaekennethwedding with correct metadata and theme", () => {
    const invite = INVITATIONS.alexandrinaekennethwedding;
    assert.ok(invite, "alexandrinaekennethwedding must be registered in INVITATIONS");
    assert.equal(invite.theme, "alexandrina-kenneth-gold");
    assert.equal(invite.engine, "theme");
    assert.equal(invite.status, "active");
    assert.equal(
      invite.metadata.title,
      "Alexandrina Mitilane e Kenneth Novele | Convite de Casamento"
    );
    assert.equal(invite.metadata.date, "2027-01-09");
    assert.equal(invite.metadata.time, "08h00 · Casamento Civil");
    assert.equal(invite.metadata.location, "Maputo, Moçambique");
    assert.equal(invite.metadata.eventType, "Casamento");
  });

  it("registers theme alexandrina-kenneth-gold in ThemeRegistry with alexandrina-kenneth-wedding profile", () => {
    const theme = ThemeRegistry["alexandrina-kenneth-gold"];
    assert.ok(theme, "alexandrina-kenneth-gold must exist in ThemeRegistry");
    assert.equal(theme.identity, "alexandrina-kenneth-gold");
    assert.equal(theme.renderProfile, "alexandrina-kenneth-wedding");
    assert.equal(theme.structure, "ceremonial");
    assert.equal(theme.audio.type, "ambient");
    assert.equal(theme.audio.audioStartMode, "explicit-user-choice");
    assert.ok(theme.audio.credit, "Audio must have credit defined");
  });

  it("has aliases declared for alexandrinaekennethwedding and resolves canonical slug", () => {
    const invite = INVITATIONS.alexandrinaekennethwedding;
    assert.ok(Array.isArray(invite.aliases));
    assert.ok(invite.aliases.includes("alexandrinaekenneth"));
    assert.ok(invite.aliases.includes("alexandrina-kenneth"));
    assert.ok(invite.aliases.includes("alexandrinaekenneth2027"));

    assert.equal(
      resolveCanonicalInvitationSlug("alexandrinaekennethwedding"),
      "alexandrinaekennethwedding"
    );
    assert.equal(
      resolveCanonicalInvitationSlug("alexandrinaekenneth"),
      "alexandrinaekennethwedding"
    );
    assert.equal(
      resolveCanonicalInvitationSlug("alexandrina-kenneth"),
      "alexandrinaekennethwedding"
    );
    assert.equal(
      resolveCanonicalInvitationSlug("conviteak"),
      "alexandrinaekennethwedding"
    );

    assert.equal(
      resolveActiveInvitationSlug("alexandrinaekennethwedding"),
      "alexandrinaekennethwedding"
    );
  });

  it("accepts valid local RSVP payload for alexandrinaekennethwedding", () => {
    const payload = {
      slug: "alexandrinaekennethwedding",
      name: "Convidado de Teste",
      attending: true,
      guests: 2,
      phone: "+258 84 123 4567",
      email: "convidado@teste.com",
      messageForBride: "Muitas felicidades aos noivos!",
    };

    const result = validateLocalRsvpPayload(payload);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.slug, "alexandrinaekennethwedding");
      assert.equal(result.submission.name, "Convidado de Teste");
      assert.equal(result.submission.attending, true);
      assert.equal(result.submission.guests, 2);
    }
  });

  it("preserves existing invitations and aliases unchanged", () => {
    const neidyInvite = INVITATIONS.neidyejosewedding;
    assert.ok(neidyInvite, "neidyejosewedding must still be registered");
    assert.equal(neidyInvite.theme, "neidy-jose-vinculo");
    assert.equal(
      resolveCanonicalInvitationSlug("neidyejosewedding"),
      "neidyejosewedding"
    );
    assert.equal(
      resolveCanonicalInvitationSlug("neidy-jose"),
      "neidyejosewedding"
    );
  });

  it("submits universal RSVP for alexandrinaekennethwedding successfully", async () => {
    const originalFetch = globalThis.fetch;
    try {
      let sentBody: any = null;
      globalThis.fetch = async (_input, init) => {
        sentBody = JSON.parse(String(init?.body));
        return new Response(
          JSON.stringify({
            success: true,
            persisted: true,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      };

      const result = await submitUniversalRsvp({
        slug: "alexandrinaekennethwedding",
        name: "Maria e João",
        attending: true,
        guests: 2,
        email: "maria@teste.com",
        phone: "+258 84 999 8888",
        messageForBride: "Felicidades!",
      });

      assert.equal(result.outcome.kind, "success");
      assert.equal(sentBody.slug, "alexandrinaekennethwedding");
      assert.equal(sentBody.name, "Maria e João");
      assert.equal(sentBody.attending, true);
      assert.equal(sentBody.guests, 2);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("verifies RSVP destination and storage binding for HAXR team consultation", () => {
    // 1. Scoped storage key for alexandrinaekennethwedding
    const rsvpStorageKey = buildEditionRsvpStorageKey("alexandrinaekennethwedding");
    assert.equal(
      rsvpStorageKey,
      "haxr:edition:alexandrinaekennethwedding:rsvp:v1"
    );

    const giftStorageKey = buildEditionGiftStorageKey("alexandrinaekennethwedding");
    assert.equal(
      giftStorageKey,
      "haxr:edition:alexandrinaekennethwedding:gifts:v1"
    );

    // 2. Admin binding for HAXR team event resolution
    const binding = getInvitationAdminBinding("alexandrinaekennethwedding");
    assert.ok(binding, "Admin binding must exist for HAXR team");
    assert.equal(binding.clientName, "Alexandrina Mitilane e Kenneth Novele");
    assert.equal(
      binding.adminEventName,
      "Edition · Casamento · Alexandrina Mitilane e Kenneth Novele"
    );
    assert.equal(binding.envVar, "EDITION_EVENT_ALEXANDRINA_KENNETH_ID");
    assert.equal(binding.expectedRegistryKey, "alexandrina-kenneth-gold");

    // 3. Simulated persistent response validation with fictional guest
    const fictionalGuestResponse = buildLocalRsvpSuccessBody({
      notificationSkipped: true,
      guestId: "fictional-guest-uuid-1234",
      qrToken: "token-alexandrina-kenneth-abc",
      status: "confirmed",
      created: true,
      partySize: 2,
      plusOnes: 1,
    });

    assert.equal(fictionalGuestResponse.success, true);
    assert.equal(fictionalGuestResponse.persisted, true);
    assert.equal(fictionalGuestResponse.status, "confirmed");
    assert.equal(fictionalGuestResponse.partySize, 2);
    assert.equal(fictionalGuestResponse.plusOnes, 1);
    assert.equal(fictionalGuestResponse.guestId, "fictional-guest-uuid-1234");
    assert.equal(fictionalGuestResponse.qrToken, "token-alexandrina-kenneth-abc");
  });

  it("validates ceremonies, locations, confirmed coordinates and navigation button links", () => {
    const venues = [
      {
        id: "civil",
        name: "3.ª Conservatória do Registo Civil",
        time: "08h00",
        address: "Rua 5343, Bairro 25 de Junho B, KaMubukwana, Maputo.",
        reference: "Junto ao Mercado 25 de Junho.",
        lat: -25.9096223,
        lng: 32.5674959,
        isConfirmed: true,
      },
      {
        id: "religioso",
        name: "Igreja Internacional Casa da Glória da Palavra",
        time: "10h00",
        address: "Av. de Moçambique, Coqueiros, Zimpeto, KaMubukwana, Maputo.",
        reference: "Perto das bombas da BP, na zona da Missão Roque.",
        lat: -25.8680067,
        lng: 32.5667773,
        isConfirmed: true,
      },
      {
        id: "copo-agua",
        name: "Salão da Igreja Evangélica Assembleia Livre em Moçambique – Ministério Filadélfia",
        time: "15h00",
        address: "Rua do Rio Revue, Zimpeto, Maputo.",
        reference: "Acesso pela rua do portão principal da Escola Secundária Quisse Mavota.",
        lat: -25.8503187,
        lng: 32.5789995,
        isConfirmed: true,
      },
    ];

    for (const venue of venues) {
      assert.equal(venue.isConfirmed, true, `${venue.id} must be confirmed`);
      const pin = `${venue.lat}%2C${venue.lng}`;
      assert.ok(pin.includes("%2C"), "PIN must encode comma as %2C");

      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${pin}`;
      const wazeUrl = `https://waze.com/ul?ll=${pin}&navigate=yes`;
      const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${pin}`;

      assert.equal(
        googleMapsUrl,
        `https://www.google.com/maps/search/?api=1&query=${venue.lat}%2C${venue.lng}`
      );
      assert.equal(
        wazeUrl,
        `https://waze.com/ul?ll=${venue.lat}%2C${venue.lng}&navigate=yes`
      );
      assert.equal(
        directionsUrl,
        `https://www.google.com/maps/dir/?api=1&destination=${venue.lat}%2C${venue.lng}`
      );
    }
  });

  it("validates official contact channels for Alexandrina & Kenneth RSVP", () => {
    const contacts = {
      whatsapp: {
        number: "+258 87 041 0112",
        url: "https://wa.me/258870410112",
      },
      chamada: {
        number: "+258 84 967 4279",
        url: "tel:+258849674279",
      },
    };

    assert.equal(contacts.whatsapp.number, "+258 87 041 0112");
    assert.equal(contacts.whatsapp.url, "https://wa.me/258870410112");
    assert.equal(contacts.chamada.number, "+258 84 967 4279");
    assert.equal(contacts.chamada.url, "tel:+258849674279");
  });

  it("validates online gifts catalog completeness and atomic reservation engine", async () => {
    const {
      ALEXANDRINA_KENNETH_CATALOG,
      ALEXANDRINA_KENNETH_CATEGORIES,
    } = await import("@data/gifts/alexandrina-kenneth");
    const {
      getAlexandrinaKennethPublicGifts,
      reserveAlexandrinaKennethGift,
      __clearAlexandrinaKennethReservationsForTests,
    } = await import("@lib/alexandrina-kenneth-wedding/gifts/inventory");

    await __clearAlexandrinaKennethReservationsForTests();

    // 1. Catalog structure
    assert.equal(ALEXANDRINA_KENNETH_CATALOG.length, 44, "Must contain exactly 44 items");
    const totalUnits = ALEXANDRINA_KENNETH_CATALOG.reduce((sum, i) => sum + i.totalQuantity, 0);
    assert.equal(totalUnits, 60, "Must sum to exactly 60 total units");

    // Check specific items from user prompt
    const batedeira = ALEXANDRINA_KENNETH_CATALOG.find((i) => i.id === "batedeira");
    assert.ok(batedeira);
    assert.equal(batedeira.totalQuantity, 1);

    const tacas = ALEXANDRINA_KENNETH_CATALOG.find((i) => i.id === "conjuntos-tacas");
    assert.ok(tacas);
    assert.equal(tacas.totalQuantity, 2);

    // 2. Initial public state
    const initialGifts = await getAlexandrinaKennethPublicGifts();
    const initialBatedeira = initialGifts.find((i) => i.id === "batedeira");
    assert.equal(initialBatedeira?.availableQuantity, 1);
    assert.equal(initialBatedeira?.selectedQuantity, 0);
    assert.equal(initialBatedeira?.status, "available");

    // 3. Session 1: Reserve Batedeira (1 unit item)
    const res1 = await reserveAlexandrinaKennethGift({
      itemId: "batedeira",
      guestName: "Sessão Convidado 1",
      quantity: 1,
    });
    assert.equal(res1.success, true);
    const postRes1Batedeira = res1.items.find((i) => i.id === "batedeira");
    assert.equal(postRes1Batedeira?.availableQuantity, 0);
    assert.equal(postRes1Batedeira?.selectedQuantity, 1);
    assert.equal(postRes1Batedeira?.status, "reserved");

    // 4. Session 2: Concurrent attempt to reserve Batedeira must be BLOCKED
    const res2 = await reserveAlexandrinaKennethGift({
      itemId: "batedeira",
      guestName: "Sessão Convidado 2",
      quantity: 1,
    });
    assert.equal(res2.success, false);
    if (!res2.success) {
      assert.equal(res2.code, "GIFT_SOLD_OUT");
      assert.equal(res2.error, "Este presente acabou de ser escolhido.");
      assert.equal(res2.available, 0);
    }

    // 5. Idempotent re-submission by Session 1 does NOT decrement extra units
    const resIdempotent = await reserveAlexandrinaKennethGift({
      itemId: "batedeira",
      guestName: "Sessão Convidado 1",
      quantity: 1,
    });
    assert.equal(resIdempotent.success, true);
    assert.equal(resIdempotent.alreadyReserved, true);

    // 6. 2-unit item: Conjuntos de taças
    // Guest A chooses 1 of 2
    const resTacas1 = await reserveAlexandrinaKennethGift({
      itemId: "conjuntos-tacas",
      guestName: "Convidado A",
      quantity: 1,
    });
    assert.equal(resTacas1.success, true);
    const postTacas1 = resTacas1.items.find((i) => i.id === "conjuntos-tacas");
    assert.equal(postTacas1?.selectedQuantity, 1);
    assert.equal(postTacas1?.availableQuantity, 1);
    assert.equal(postTacas1?.status, "partial");

    // Guest B chooses the 2nd of 2
    const resTacas2 = await reserveAlexandrinaKennethGift({
      itemId: "conjuntos-tacas",
      guestName: "Convidado B",
      quantity: 1,
    });
    assert.equal(resTacas2.success, true);
    const postTacas2 = resTacas2.items.find((i) => i.id === "conjuntos-tacas");
    assert.equal(postTacas2?.selectedQuantity, 2);
    assert.equal(postTacas2?.availableQuantity, 0);
    assert.equal(postTacas2?.status, "reserved");

    // Guest C attempts 3rd -> BLOCKED with exact error message
    const resTacas3 = await reserveAlexandrinaKennethGift({
      itemId: "conjuntos-tacas",
      guestName: "Convidado C",
      quantity: 1,
    });
    assert.equal(resTacas3.success, false);
    if (!resTacas3.success) {
      assert.equal(resTacas3.code, "GIFT_SOLD_OUT");
      assert.equal(resTacas3.error, "Este presente acabou de ser escolhido.");
    }

    await __clearAlexandrinaKennethReservationsForTests();
  });
});

// ---------------------------------------------------------------------------
// Fail-Closed Gift Registry — Production / Preview enforcement
// ---------------------------------------------------------------------------

describe("Alexandrina & Kenneth — Fail-Closed Gift Registry (Production / Preview)", () => {
  it("isAlexandrinaKennethGiftFileStoreAllowed returns false in production even with GIFT_REGISTRY_FORCE_FILE=1", async () => {
    const { isAlexandrinaKennethGiftFileStoreAllowed } = await import(
      "@lib/alexandrina-kenneth-wedding/gifts/inventory"
    );

    const prevNodeEnv = process.env.NODE_ENV;
    const prevVercelEnv = process.env.VERCEL_ENV;
    const prevForceFile = process.env.GIFT_REGISTRY_FORCE_FILE;
    try {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      delete process.env.VERCEL_ENV;
      process.env.GIFT_REGISTRY_FORCE_FILE = "1";

      const allowed = isAlexandrinaKennethGiftFileStoreAllowed();
      assert.equal(
        allowed,
        false,
        "File store must be strictly forbidden in production even when GIFT_REGISTRY_FORCE_FILE=1"
      );
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = prevNodeEnv;
      if (prevVercelEnv !== undefined) process.env.VERCEL_ENV = prevVercelEnv;
      else delete process.env.VERCEL_ENV;
      if (prevForceFile !== undefined) process.env.GIFT_REGISTRY_FORCE_FILE = prevForceFile;
      else delete process.env.GIFT_REGISTRY_FORCE_FILE;
    }
  });

  it("isAlexandrinaKennethGiftFileStoreAllowed returns false in Vercel preview even with GIFT_REGISTRY_FORCE_FILE=1", async () => {
    const { isAlexandrinaKennethGiftFileStoreAllowed } = await import(
      "@lib/alexandrina-kenneth-wedding/gifts/inventory"
    );

    const prevNodeEnv = process.env.NODE_ENV;
    const prevVercelEnv = process.env.VERCEL_ENV;
    const prevVercel = process.env.VERCEL;
    const prevForceFile = process.env.GIFT_REGISTRY_FORCE_FILE;
    try {
      (process.env as Record<string, string | undefined>).NODE_ENV = "development";
      process.env.VERCEL_ENV = "preview";
      process.env.GIFT_REGISTRY_FORCE_FILE = "1";

      const allowed = isAlexandrinaKennethGiftFileStoreAllowed();
      assert.equal(
        allowed,
        false,
        "File store must be strictly forbidden in Vercel preview even when GIFT_REGISTRY_FORCE_FILE=1"
      );
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = prevNodeEnv;
      if (prevVercelEnv !== undefined) process.env.VERCEL_ENV = prevVercelEnv;
      else delete process.env.VERCEL_ENV;
      if (prevVercel !== undefined) process.env.VERCEL = prevVercel;
      else delete process.env.VERCEL;
      if (prevForceFile !== undefined) process.env.GIFT_REGISTRY_FORCE_FILE = prevForceFile;
      else delete process.env.GIFT_REGISTRY_FORCE_FILE;
    }
  });

  it("isAlexandrinaKennethGiftFileStoreAllowed returns false when VERCEL=1", async () => {
    const { isAlexandrinaKennethGiftFileStoreAllowed } = await import(
      "@lib/alexandrina-kenneth-wedding/gifts/inventory"
    );

    const prevNodeEnv = process.env.NODE_ENV;
    const prevVercelEnv = process.env.VERCEL_ENV;
    const prevVercel = process.env.VERCEL;
    const prevForceFile = process.env.GIFT_REGISTRY_FORCE_FILE;
    try {
      (process.env as Record<string, string | undefined>).NODE_ENV = "development";
      delete process.env.VERCEL_ENV;
      process.env.VERCEL = "1";
      process.env.GIFT_REGISTRY_FORCE_FILE = "1";

      const allowed = isAlexandrinaKennethGiftFileStoreAllowed();
      assert.equal(
        allowed,
        false,
        "File store must be strictly forbidden when VERCEL=1 (Vercel runtime)"
      );
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = prevNodeEnv;
      if (prevVercelEnv !== undefined) process.env.VERCEL_ENV = prevVercelEnv;
      else delete process.env.VERCEL_ENV;
      if (prevVercel !== undefined) process.env.VERCEL = prevVercel;
      else delete process.env.VERCEL;
      if (prevForceFile !== undefined) process.env.GIFT_REGISTRY_FORCE_FILE = prevForceFile;
      else delete process.env.GIFT_REGISTRY_FORCE_FILE;
    }
  });

  it("getAlexandrinaKennethReservations throws fail-closed when database is unconfigured in production", async () => {
    const { getAlexandrinaKennethReservations } = await import(
      "@lib/alexandrina-kenneth-wedding/gifts/inventory"
    );
    const { __setEditionDatabaseProviderForTests } = await import("@lib/db");

    const prevNodeEnv = process.env.NODE_ENV;
    const prevVercelEnv = process.env.VERCEL_ENV;
    try {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      delete process.env.VERCEL_ENV;

      // Mock unconfigured provider
      __setEditionDatabaseProviderForTests({
        name: "neon",
        isConfigured: () => false,
        listMemoriesPhotos: async () => [],
        insertPendingPhoto: async () => false,
        createUploadIntent: async () => {},
        consumeUploadIntent: async () => null,
        checkApiRateLimit: async () => ({ allowed: true, remaining: 10, retryAfterSeconds: 0 }),
        getLeaderboardPhotos: async () => [],
        getParticipantPhotos: async () => [],
        updateModerationStatus: async () => false,
        listGiftReservations: async () => [],
        reserveGift: async () => ({ ok: false }),
      });

      await assert.rejects(
        () => getAlexandrinaKennethReservations(),
        (err: Error) => {
          assert.ok(
            err.message.includes("unconfigured"),
            `Error should mention unconfigured, got: ${err.message}`
          );
          return true;
        },
        "Must throw fail-closed when DB unconfigured in production"
      );
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = prevNodeEnv;
      if (prevVercelEnv !== undefined) process.env.VERCEL_ENV = prevVercelEnv;
      else delete process.env.VERCEL_ENV;
      __setEditionDatabaseProviderForTests(null);
    }
  });

  it("getAlexandrinaKennethReservations throws fail-closed when Neon query fails in production", async () => {
    const { getAlexandrinaKennethReservations } = await import(
      "@lib/alexandrina-kenneth-wedding/gifts/inventory"
    );
    const { __setEditionDatabaseProviderForTests } = await import("@lib/db");

    const prevNodeEnv = process.env.NODE_ENV;
    const prevVercelEnv = process.env.VERCEL_ENV;
    try {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      delete process.env.VERCEL_ENV;

      // Mock a configured but failing provider
      __setEditionDatabaseProviderForTests({
        name: "neon",
        isConfigured: () => true,
        listMemoriesPhotos: async () => [],
        insertPendingPhoto: async () => false,
        createUploadIntent: async () => {},
        consumeUploadIntent: async () => null,
        checkApiRateLimit: async () => ({ allowed: true, remaining: 10, retryAfterSeconds: 0 }),
        getLeaderboardPhotos: async () => [],
        getParticipantPhotos: async () => [],
        updateModerationStatus: async () => false,
        listGiftReservations: async () => [],
        reserveGift: async () => ({ ok: false }),
      });

      // Override DATABASE_URL to force getNeonPool() to initialise, but point to unreachable
      const prevDbUrl = process.env.DATABASE_URL;
      process.env.DATABASE_URL =
        "postgres://fakeuser:fakepass@does-not-exist.invalid:5432/neondb?sslmode=verify-full";

      try {
        await assert.rejects(
          () => getAlexandrinaKennethReservations(),
          (err: unknown) => {
            assert.ok(err instanceof Error, "Must throw an Error");
            return true;
          },
          "Must throw (not silently return []) when Neon query fails in production"
        );
      } finally {
        if (prevDbUrl !== undefined) process.env.DATABASE_URL = prevDbUrl;
        else delete process.env.DATABASE_URL;
      }
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = prevNodeEnv;
      if (prevVercelEnv !== undefined) process.env.VERCEL_ENV = prevVercelEnv;
      else delete process.env.VERCEL_ENV;
      __setEditionDatabaseProviderForTests(null);
    }
  });

  it("reserveAlexandrinaKennethGift throws fail-closed when DB unconfigured in production", async () => {
    const { reserveAlexandrinaKennethGift } = await import(
      "@lib/alexandrina-kenneth-wedding/gifts/inventory"
    );
    const { __setEditionDatabaseProviderForTests } = await import("@lib/db");

    const prevNodeEnv = process.env.NODE_ENV;
    const prevVercelEnv = process.env.VERCEL_ENV;
    try {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      delete process.env.VERCEL_ENV;

      __setEditionDatabaseProviderForTests({
        name: "neon",
        isConfigured: () => false,
        listMemoriesPhotos: async () => [],
        insertPendingPhoto: async () => false,
        createUploadIntent: async () => {},
        consumeUploadIntent: async () => null,
        checkApiRateLimit: async () => ({ allowed: true, remaining: 10, retryAfterSeconds: 0 }),
        getLeaderboardPhotos: async () => [],
        getParticipantPhotos: async () => [],
        updateModerationStatus: async () => false,
        listGiftReservations: async () => [],
        reserveGift: async () => ({ ok: false }),
      });

      await assert.rejects(
        () =>
          reserveAlexandrinaKennethGift({
            itemId: "batedeira",
            guestName: "Convidado Teste",
            quantity: 1,
          }),
        (err: Error) => {
          assert.ok(
            err.message.includes("DATABASE_URL") || err.message.includes("produção"),
            `Error should mention DATABASE_URL or produção, got: ${err.message}`
          );
          return true;
        },
        "Must throw fail-closed when DB unconfigured in production"
      );
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = prevNodeEnv;
      if (prevVercelEnv !== undefined) process.env.VERCEL_ENV = prevVercelEnv;
      else delete process.env.VERCEL_ENV;
      __setEditionDatabaseProviderForTests(null);
    }
  });

  it("file store fallback works normally in local test environment (non-production)", async () => {
    const {
      isAlexandrinaKennethGiftFileStoreAllowed,
      __clearAlexandrinaKennethReservationsForTests,
    } = await import("@lib/alexandrina-kenneth-wedding/gifts/inventory");
    const { __setEditionDatabaseProviderForTests } = await import("@lib/db");

    const prevNodeEnv = process.env.NODE_ENV;
    const prevVercelEnv = process.env.VERCEL_ENV;
    const prevVercel = process.env.VERCEL;
    const prevForceFile = process.env.GIFT_REGISTRY_FORCE_FILE;
    try {
      (process.env as Record<string, string | undefined>).NODE_ENV = "test";
      delete process.env.VERCEL_ENV;
      delete process.env.VERCEL;
      process.env.GIFT_REGISTRY_FORCE_FILE = "1";

      // Mock unconfigured provider (simulates no DATABASE_URL in test)
      __setEditionDatabaseProviderForTests({
        name: "neon",
        isConfigured: () => false,
        listMemoriesPhotos: async () => [],
        insertPendingPhoto: async () => false,
        createUploadIntent: async () => {},
        consumeUploadIntent: async () => null,
        checkApiRateLimit: async () => ({ allowed: true, remaining: 10, retryAfterSeconds: 0 }),
        getLeaderboardPhotos: async () => [],
        getParticipantPhotos: async () => [],
        updateModerationStatus: async () => false,
        listGiftReservations: async () => [],
        reserveGift: async () => ({ ok: false }),
      });

      // With FORCE_FILE=1 in non-production, file store should be allowed
      const allowed = isAlexandrinaKennethGiftFileStoreAllowed();
      assert.equal(
        allowed,
        true,
        "File store must be allowed in non-production test environment with GIFT_REGISTRY_FORCE_FILE=1"
      );

      await __clearAlexandrinaKennethReservationsForTests();
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = prevNodeEnv;
      if (prevVercelEnv !== undefined) process.env.VERCEL_ENV = prevVercelEnv;
      else delete process.env.VERCEL_ENV;
      if (prevVercel !== undefined) process.env.VERCEL = prevVercel;
      else delete process.env.VERCEL;
      if (prevForceFile !== undefined) process.env.GIFT_REGISTRY_FORCE_FILE = prevForceFile;
      else delete process.env.GIFT_REGISTRY_FORCE_FILE;
      __setEditionDatabaseProviderForTests(null);
    }
  });
});
