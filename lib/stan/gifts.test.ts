import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import {
  STAN_GIFT_GROUPS,
  getStanGiftGroupById,
} from "./gifts-catalog";
import {
  getStanPublicGifts,
  parseStanGiftReservationRpcResponse,
  reserveStanGift,
} from "./gifts";
import fs from "fs";
import path from "path";

const RESERVATIONS_FILE = path.join(
  process.cwd(),
  "data",
  "gifts",
  "stan-reservations.json"
);

describe("Stan Slot-Based Gift Engine", () => {
  beforeEach(async () => {
    if (fs.existsSync(RESERVATIONS_FILE)) {
      await fs.promises.unlink(RESERVATIONS_FILE);
    }
  });

  afterEach(async () => {
    if (fs.existsSync(RESERVATIONS_FILE)) {
      await fs.promises.unlink(RESERVATIONS_FILE);
    }
  });

  it("Agrupamento: 5 slots de Pista formam um único presente público", async () => {
    const pistaGroup = getStanGiftGroupById("stan-pista-carrinhos");
    assert.ok(pistaGroup);
    assert.equal(pistaGroup.slots.length, 5);
    assert.deepEqual(pistaGroup.slots, [
      "stan-pista-carrinhos",
      "stan-pista-carrinhos-02",
      "stan-pista-carrinhos-03",
      "stan-pista-carrinhos-04",
      "stan-pista-carrinhos-05",
    ]);

    const publicGifts = await getStanPublicGifts();
    const pistaPublic = publicGifts.find((g) => g.id === "stan-pista-carrinhos");

    assert.ok(pistaPublic);
    assert.equal(pistaPublic.totalQuantity, 5);
    assert.equal(pistaPublic.availableQuantity, 5);
    assert.equal(pistaPublic.isExhausted, false);
    assert.equal(pistaPublic.status, "available");

    // IDs internos de slots não aparecem como cards separados no payload público
    const slotCards = publicGifts.filter((g) => g.id.includes("-02") || g.id.includes("-05"));
    assert.equal(slotCards.length, 0);
  });

  it("Variantes de Bonecos de Acção permanecem em grupos separados", () => {
    const spiderman = getStanGiftGroupById("stan-boneco-spiderman");
    const batman = getStanGiftGroupById("stan-boneco-batman");
    const sonic = getStanGiftGroupById("stan-boneco-sonic");
    const catboy = getStanGiftGroupById("stan-boneco-catboy");

    assert.ok(spiderman);
    assert.ok(batman);
    assert.ok(sonic);
    assert.ok(catboy);

    assert.equal(spiderman.slots.length, 1);
    assert.equal(batman.slots.length, 1);
    assert.equal(sonic.slots.length, 1);
    assert.equal(catboy.slots.length, 1);
  });

  it("Reservas sequenciais decrementam slots e contabilizam histórico", async () => {
    // 1ª reserva no slot base (stan-pista-carrinhos)
    const r1 = await reserveStanGift("stan-pista-carrinhos", "Ana");
    assert.equal(r1.success, true);
    const p1 = r1.gifts?.find((g) => g.id === "stan-pista-carrinhos");
    assert.equal(p1?.reservedCount, 1);
    assert.equal(p1?.availableQuantity, 4);

    // 2ª reserva no slot 02 (stan-pista-carrinhos-02)
    const r2 = await reserveStanGift("stan-pista-carrinhos", "Bruno");
    assert.equal(r2.success, true);
    const p2 = r2.gifts?.find((g) => g.id === "stan-pista-carrinhos");
    assert.equal(p2?.reservedCount, 2);
    assert.equal(p2?.availableQuantity, 3);

    // 3ª, 4ª e 5ª reserva
    await reserveStanGift("stan-pista-carrinhos", "Carla");
    await reserveStanGift("stan-pista-carrinhos", "Daniel");
    const r5 = await reserveStanGift("stan-pista-carrinhos", "Eduardo");

    assert.equal(r5.success, true);
    const p5 = r5.gifts?.find((g) => g.id === "stan-pista-carrinhos");
    assert.equal(p5?.reservedCount, 5);
    assert.equal(p5?.availableQuantity, 0);
    assert.equal(p5?.isExhausted, true);
    assert.equal(p5?.status, "reserved");

    // 6ª reserva rejeitada como Esgotado
    const r6 = await reserveStanGift("stan-pista-carrinhos", "Fernando");
    assert.equal(r6.success, false);
    assert.equal(r6.error, "Este presente já se encontra esgotado.");
  });

  it("Armazenamento local: reserva posterior escolhe o próximo slot livre", async () => {
    // Reservar 1ª unidade de Blocos de Montar
    await reserveStanGift("stan-blocos-montar", "Convidado 1");

    // No armazenamento local, o próximo pedido encontra os slots 02 e 03 livres.
    const r2 = await reserveStanGift("stan-blocos-montar", "Convidado 2");
    assert.equal(r2.success, true);

    const publicGifts = await getStanPublicGifts();
    const blocos = publicGifts.find((g) => g.id === "stan-blocos-montar");
    assert.equal(blocos?.reservedCount, 2);
    assert.equal(blocos?.availableQuantity, 1);
  });

  it("RPC só classifica already_reserved explícito como conflito de slot", () => {
    assert.deepEqual(parseStanGiftReservationRpcResponse({ ok: true }), {
      success: true,
    });
    assert.deepEqual(
      parseStanGiftReservationRpcResponse({
        ok: false,
        error: "already_reserved",
      }),
      { success: false, error: "already_reserved" }
    );
    assert.deepEqual(parseStanGiftReservationRpcResponse(null), {
      success: false,
      error: "Ocorreu um erro interno ao processar a reserva.",
    });
    assert.deepEqual(parseStanGiftReservationRpcResponse({ ok: false }), {
      success: false,
      error: "Ocorreu um erro interno ao processar a reserva.",
    });
    assert.deepEqual(
      parseStanGiftReservationRpcResponse({
        ok: false,
        error: "permission_denied",
      }),
      { success: false, error: "permission_denied" }
    );
  });

  it("Concorrência na última unidade: exatamente uma sucede e outra recebe Esgotado", async () => {
    // Batman possui apenas 1 slot ('stan-boneco-batman')
    const p1 = reserveStanGift("stan-boneco-batman", "Convidado X");
    const p2 = reserveStanGift("stan-boneco-batman", "Convidado Y");

    const [resX, resY] = await Promise.all([p1, p2]);
    const successes = [resX, resY].filter((r) => r.success);
    const failures = [resX, resY].filter((r) => !r.success);

    assert.equal(successes.length, 1);
    assert.equal(failures.length, 1);
    assert.equal(failures[0].error, "Este presente já se encontra esgotado.");

    const updated = await getStanPublicGifts();
    const batman = updated.find((g) => g.id === "stan-boneco-batman");
    assert.equal(batman?.availableQuantity, 0);
    assert.equal(batman?.isExhausted, true);
  });
});
