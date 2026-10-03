import test from "node:test";
import assert from "node:assert/strict";
import { validateBlessingPayload } from "./validate";

test("Blessings Validation: accepts valid canonical payload", () => {
  const result = validateBlessingPayload({
    slug: "neidyejosewedding",
    clientId: "b-1791024567890",
    author: "Família Marino",
    message: "Que o amor e a bênção de Deus estejam sempre sobre o vosso lar!",
    honeypot: "",
  });

  assert.equal(result.valid, true);
  if (result.valid) {
    assert.equal(result.data.slug, "neidyejosewedding");
    assert.equal(result.data.clientId, "b-1791024567890");
    assert.equal(result.data.author, "Família Marino");
    assert.equal(
      result.data.message,
      "Que o amor e a bênção de Deus estejam sempre sobre o vosso lar!"
    );
    assert.equal(result.data.isHoneypot, false);
  }
});

test("Blessings Validation: detects honeypot submission", () => {
  const result = validateBlessingPayload({
    slug: "neidyejosewedding",
    clientId: "b-1791024567890",
    author: "Spam Bot",
    message: "Promo message",
    honeypot: "http://spam.link",
  });

  assert.equal(result.valid, true);
  if (result.valid) {
    assert.equal(result.data.isHoneypot, true);
  }
});

test("Blessings Scope: accepts neidyejosewedding and strictly rejects queenkailanecrisma and arbitrary slugs", () => {
  // 1. Canonical wedding slug -> ACCEPTED
  const accepted = validateBlessingPayload({
    slug: "neidyejosewedding",
    clientId: "b-scope-1",
    author: "Test Author",
    message: "Test message",
  });
  assert.equal(accepted.valid, true);
  if (accepted.valid) {
    assert.equal(accepted.data.slug, "neidyejosewedding");
  }

  // 2. Out-of-scope slug queenkailanecrisma -> REJECTED
  const rejectedKailane = validateBlessingPayload({
    slug: "queenkailanecrisma",
    clientId: "b-scope-2",
    author: "Test Author",
    message: "Test message",
  });
  assert.equal(rejectedKailane.valid, false);
  if (!rejectedKailane.valid) {
    assert.match(rejectedKailane.error, /não autorizado/i);
  }

  // 3. Arbitrary slug -> REJECTED
  const rejectedArbitrary = validateBlessingPayload({
    slug: "jessicasamuelwedding",
    clientId: "b-scope-3",
    author: "Test Author",
    message: "Test message",
  });
  assert.equal(rejectedArbitrary.valid, false);
  if (!rejectedArbitrary.valid) {
    assert.match(rejectedArbitrary.error, /não autorizado/i);
  }

  // 4. Empty slug -> REJECTED
  const rejectedEmpty = validateBlessingPayload({
    slug: "",
    clientId: "b-scope-4",
    author: "Test Author",
    message: "Test message",
  });
  assert.equal(rejectedEmpty.valid, false);
  if (!rejectedEmpty.valid) {
    assert.match(rejectedEmpty.error, /obrigatório/i);
  }
});

test("Blessings Validation: rejects empty or missing author", () => {
  const r1 = validateBlessingPayload({
    slug: "neidyejosewedding",
    clientId: "b-1",
    author: "   ",
    message: "Felicidades",
  });
  assert.equal(r1.valid, false);
  if (!r1.valid) {
    assert.match(r1.error, /indique quem assina/i);
  }
});

test("Blessings Validation: rejects author exceeding 80 characters", () => {
  const longAuthor = "A".repeat(81);
  const result = validateBlessingPayload({
    slug: "neidyejosewedding",
    clientId: "b-1",
    author: longAuthor,
    message: "Felicidades",
  });
  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.match(result.error, /80 caracteres/i);
  }
});

test("Blessings Validation: accepts author up to exactly 80 characters", () => {
  const validAuthor = "A".repeat(80);
  const result = validateBlessingPayload({
    slug: "neidyejosewedding",
    clientId: "b-1",
    author: validAuthor,
    message: "Felicidades",
  });
  assert.equal(result.valid, true);
});

test("Blessings Validation: rejects empty or missing message", () => {
  const result = validateBlessingPayload({
    slug: "neidyejosewedding",
    clientId: "b-1",
    author: "Marta",
    message: "    ",
  });
  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.match(result.error, /não pode estar vazia/i);
  }
});

test("Blessings Validation: rejects message exceeding 600 characters", () => {
  const longMsg = "B".repeat(601);
  const result = validateBlessingPayload({
    slug: "neidyejosewedding",
    clientId: "b-1",
    author: "Marta",
    message: longMsg,
  });
  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.match(result.error, /600 caracteres/i);
  }
});

test("Blessings Validation: accepts message up to exactly 600 characters", () => {
  const validMsg = "B".repeat(600);
  const result = validateBlessingPayload({
    slug: "neidyejosewedding",
    clientId: "b-1",
    author: "Marta",
    message: validMsg,
  });
  assert.equal(result.valid, true);
});

test("Blessings Validation: rejects null byte injection", () => {
  const r1 = validateBlessingPayload({
    slug: "neidyejosewedding",
    clientId: "b-1\0evil",
    author: "Hacker",
    message: "Felicidades",
  });
  assert.equal(r1.valid, false);

  const r2 = validateBlessingPayload({
    slug: "neidyejosewedding",
    clientId: "b-1",
    author: "Hacker\0evil",
    message: "Felicidades",
  });
  assert.equal(r2.valid, false);

  const r3 = validateBlessingPayload({
    slug: "neidyejosewedding",
    clientId: "b-1",
    author: "Hacker",
    message: "Felicidades\0evil",
  });
  assert.equal(r3.valid, false);
});

test("Blessings Validation: rejects invalid payload types", () => {
  assert.equal(validateBlessingPayload(null).valid, false);
  assert.equal(validateBlessingPayload("string").valid, false);
  assert.equal(validateBlessingPayload([]).valid, false);
});

test("Blessings Legacy Recovery: deduplication and seed filtering logic", () => {
  const SEED_IDS = new Set(["b1", "b2"]);
  const mockStorage = [
    { id: "b1", author: "Seed 1", message: "Seed msg" },
    { id: "b2", author: "Seed 2", message: "Seed msg" },
    { id: "b-100", author: "Convidado Real", message: "Muitas felicidades!" },
  ];

  const validEntries = mockStorage.filter((item) => !SEED_IDS.has(item.id));
  assert.equal(validEntries.length, 1);
  assert.equal(validEntries[0].id, "b-100");
  assert.equal(validEntries[0].author, "Convidado Real");

  // Client-side merge without duplicate IDs
  const remoteEntries = [
    { id: "b-100", author: "Convidado Real", message: "Muitas felicidades!" },
    { id: "b-200", author: "Tia Maria", message: "Parabéns aos noivos!" },
  ];

  const existingIds = new Set(remoteEntries.map((m) => m.id));
  const localOnly = validEntries.filter((p) => !existingIds.has(p.id));
  const merged = [...localOnly, ...remoteEntries];

  assert.equal(merged.length, 2);
  assert.deepEqual(merged.map((m) => m.id).sort(), ["b-100", "b-200"]);
});
