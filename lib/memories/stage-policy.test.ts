import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  resolveTargetStage,
  type MemoryStage,
  CANONICAL_WEDDING_STAGES,
} from "./stage-policy";

const mockStages: MemoryStage[] = [
  {
    id: "stage-1",
    experienceId: "exp-1",
    eventId: "event-1",
    slug: "preparativos",
    label: "Preparativos",
    orderIndex: 10,
    isActive: true,
    startsAt: "2026-08-15T08:00:00.000Z",
    endsAt: "2026-08-15T13:00:00.000Z",
    config: {},
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
  },
  {
    id: "stage-2",
    experienceId: "exp-1",
    eventId: "event-1",
    slug: "cerimonia",
    label: "Cerimónia",
    orderIndex: 20,
    isActive: true,
    startsAt: "2026-08-15T13:00:00.000Z",
    endsAt: "2026-08-15T16:00:00.000Z",
    config: {},
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
  },
  {
    id: "stage-3",
    experienceId: "exp-1",
    eventId: "event-1",
    slug: "recepcao",
    label: "Recepção & Brinde",
    orderIndex: 30,
    isActive: true,
    startsAt: "2026-08-15T16:00:00.000Z",
    endsAt: "2026-08-15T20:00:00.000Z",
    config: {},
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
  },
  {
    id: "stage-4",
    experienceId: "exp-1",
    eventId: "event-1",
    slug: "festa",
    label: "Festa & Pista",
    orderIndex: 40,
    isActive: false, // Inactivo
    startsAt: "2026-08-15T20:00:00.000Z",
    endsAt: "2026-08-16T02:00:00.000Z",
    config: {},
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
  },
];

describe("HAXR Plus Memories — Stage Resolution Policy", () => {
  it("deve respeitar overrideStageId explícito quando válido e activo", () => {
    const resolved = resolveTargetStage({
      overrideStageId: "stage-2",
      stages: mockStages,
    });
    assert.equal(resolved?.id, "stage-2");
    assert.equal(resolved?.slug, "cerimonia");
  });

  it("não deve permitir overrideStageId de stage inactivo", () => {
    const resolved = resolveTargetStage({
      overrideStageId: "stage-4", // Inactivo
      stages: mockStages,
      fallbackSlug: "recepcao",
    });
    assert.equal(resolved?.id, "stage-3");
    assert.equal(resolved?.slug, "recepcao");
  });

  it("deve resolver por janela temporal com base em capturedAt", () => {
    // 10:30 UTC -> Preparativos (08:00 - 13:00)
    const morning = resolveTargetStage({
      capturedAt: "2026-08-15T10:30:00.000Z",
      stages: mockStages,
    });
    assert.equal(morning?.slug, "preparativos");

    // 14:15 UTC -> Cerimónia (13:00 - 16:00)
    const afternoon = resolveTargetStage({
      capturedAt: "2026-08-15T14:15:00.000Z",
      stages: mockStages,
    });
    assert.equal(afternoon?.slug, "cerimonia");
  });

  it("deve usar o fallbackSlug (ex: recepcao) quando fora de qualquer janela", () => {
    const midnight = resolveTargetStage({
      capturedAt: "2026-08-16T04:00:00.000Z",
      stages: mockStages,
      fallbackSlug: "recepcao",
    });
    assert.equal(midnight?.slug, "recepcao");
  });

  it("deve usar o primeiro stage activo se o fallbackSlug não existir", () => {
    const resolved = resolveTargetStage({
      capturedAt: null,
      stages: mockStages,
      fallbackSlug: "inexistente",
    });
    assert.equal(resolved?.slug, "preparativos");
  });

  it("deve conter os 5 stages canónicos de casamento recomendados", () => {
    const slugs = CANONICAL_WEDDING_STAGES.map((s) => s.slug);
    assert.deepEqual(slugs, [
      "preparativos",
      "cerimonia",
      "recepcao",
      "festa",
      "pos-festa",
    ]);
  });
});
