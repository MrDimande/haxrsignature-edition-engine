import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { calculateLeaderboardFromPhotos, type RawMemoryPhotoRow } from "./leaderboard";
import {
  mapMemoryExperienceRow,
  resolveMemoriesConfig,
  type MemoryExperienceRow,
} from "./config";
import { filterMemoriesByPhase, type PublicMemoryItem } from "./gallery";
import {
  isValidPhaseId,
  JESSICA_SAMUEL_CHALLENGE_PHASES,
  JESSICA_SAMUEL_PHASES,
  resolvePhaseForChallenge,
} from "./phases";
import { buildMemoriesPublicUrl, renderMemoriesQrPng, renderMemoriesQrSvg } from "./qr";
import {
  generateMemoriesShortCode,
  isValidMemoriesShortCode,
} from "./share-links";
import {
  matchesVoiceMagicBytes,
  normalizeVoiceContentType,
  photoBelongsToMemoriesExperience,
  validateVoiceDuration,
  validateVoiceFileSize,
} from "./voice";
import { requireMemoriesAdmin } from "./admin-auth";

const SHARE_LINK_MIGRATION = join(
  process.cwd(),
  "supabase/migrations/20260817164841_plus_memories_experiences_and_share_links.sql"
);
const VOICE_MIGRATION = join(
  process.cwd(),
  "supabase/migrations/20260817164903_plus_memories_private_voice_messages.sql"
);
const OFFLINE_QUEUE_SOURCE = join(
  process.cwd(),
  "engines/true-theme/profiles/jessica-samuel-wedding/memories/plus-memorias-offline-queue.ts"
);
const EXPERIENCE_SOURCE = join(
  process.cwd(),
  "engines/true-theme/profiles/jessica-samuel-wedding/memories/PlusMemoriasExperience.tsx"
);

function standaloneRow(
  overrides: Partial<MemoryExperienceRow> = {}
): MemoryExperienceRow {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    event_slug: "ana-miguel",
    invitation_slug: null,
    source_type: "standalone",
    display_name: "Ana & Miguel",
    event_type: "Casamento",
    status: "active",
    package: "collection",
    memories_variant: "plus-memories",
    storage_slug: "ana-miguel",
    features: {
      phases: true,
      challenges: true,
      competition: false,
      voiceMessages: true,
      gallery: true,
      offline: true,
    },
    ...overrides,
  };
}

function memory(id: string, phaseId: string | null): PublicMemoryItem {
  return {
    id,
    signedUrl: `https://example.test/${id}`,
    createdAt: "2026-08-17T12:00:00.000Z",
    contentType: "image/jpeg",
    kind: "image",
    caption: null,
    guestName: null,
    challengeId: null,
    tableId: null,
    phaseId,
  };
}

describe("Plus Memories product engine", () => {
  it("resolves the existing HAXR invitation without breaking its canonical route", () => {
    const config = resolveMemoriesConfig("jessicasamuelwedding");
    assert.ok(config);
    assert.equal(config.sourceType, "haxr-invitation");
    assert.equal(config.invitationSlug, "jessicasamuelwedding");
    assert.equal(config.storageSlug, "jessicasamuelwedding");
    assert.equal(config.variant, "plus-memories");
  });

  it("maps standalone experiences without fabricating an InvitationConfig", () => {
    const config = mapMemoryExperienceRow(standaloneRow());
    assert.equal(config.sourceType, "standalone");
    assert.equal(config.invitationSlug, null);
    assert.equal(config.eventSlug, "ana-miguel");
    assert.equal(config.storageSlug, "ana-miguel");
    assert.equal(config.displayName, "Ana & Miguel");
  });

  it("keeps package metadata independent from feature configuration", () => {
    const config = mapMemoryExperienceRow(
      standaloneRow({ package: "collection" })
    );
    assert.equal(config.package, "collection");
    assert.equal(config.features.phases, true);
    assert.equal(config.features.voiceMessages, true);

    const featureOff = mapMemoryExperienceRow(
      standaloneRow({ features: { voiceMessages: false } })
    );
    assert.equal(featureOff.voiceMessages.enabled, false);
  });

  it("generates unique, non-PII, ambiguity-free cryptographic short codes", () => {
    const codes = Array.from({ length: 500 }, () => generateMemoriesShortCode());
    assert.equal(new Set(codes).size, codes.length);
    for (const code of codes) {
      assert.match(code, /^[A-HJ-NP-Za-km-z2-9]{7}$/);
      assert.equal(code.toLowerCase().includes("jessica"), false);
      assert.equal(isValidMemoriesShortCode(code), true);
    }
    assert.equal(isValidMemoriesShortCode("bad"), false);
    assert.equal(isValidMemoriesShortCode("bad/code"), false);
  });

  it("builds the official URL and renders high-contrast SVG and PNG QR assets", async () => {
    const previous = process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_SITE_URL = "https://edition.haxrsignature.com";
    try {
      assert.equal(
        buildMemoriesPublicUrl("K8q4YaP"),
        "https://edition.haxrsignature.com/plusmemories/K8q4YaP"
      );
      const svg = await renderMemoriesQrSvg("K8q4YaP");
      const png = await renderMemoriesQrPng("K8q4YaP");
      assert.match(svg, /^<svg/);
      assert.match(svg, /#171312/i);
      assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    } finally {
      if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
      else process.env.NEXT_PUBLIC_SITE_URL = previous;
    }
  });

  it("defines atomic scan tracking, disabled-link rejection, and service-role-only RPC access", () => {
    const sql = readFileSync(SHARE_LINK_MIGRATION, "utf8");
    assert.match(sql, /scan_count\s*=\s*share_link\.scan_count\s*\+\s*1/i);
    assert.match(sql, /share_link\.enabled\s*=\s*true/i);
    assert.match(sql, /experience\.status\s*=\s*'active'/i);
    assert.match(sql, /REVOKE ALL ON FUNCTION public\.record_memory_share_link_scan\(text\)/i);
    assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.record_memory_share_link_scan\(text\)\s+TO service_role/i);
  });

  it("uses the approved single source of truth for challenge phases", () => {
    const expected: Record<string, string> = {
      "01": "a-mesa",
      "02": "o-sim",
      "04": "a-celebracao",
      "10": "entre-nos",
      "11": "antes-do-sim",
    };
    for (const [challengeId, phaseId] of Object.entries(expected)) {
      assert.equal(
        resolvePhaseForChallenge(
          challengeId,
          JESSICA_SAMUEL_PHASES,
          JESSICA_SAMUEL_CHALLENGE_PHASES
        ),
        phaseId
      );
    }
    assert.equal(isValidPhaseId("invalid", JESSICA_SAMUEL_PHASES), false);
  });

  it("filters the editorial gallery by phase without changing the source list", () => {
    const source = [
      memory("one", "a-mesa"),
      memory("two", "o-sim"),
      memory("three", "a-mesa"),
      memory("legacy", null),
    ];
    assert.deepEqual(
      filterMemoriesByPhase(source, "a-mesa").map((item) => item.id),
      ["one", "three"]
    );
    assert.equal(filterMemoriesByPhase(source, null).length, 4);
    assert.equal(source.length, 4);
  });

  it("preserves the selected phase through the existing offline retry queue", () => {
    const queueSource = readFileSync(OFFLINE_QUEUE_SOURCE, "utf8");
    const experienceSource = readFileSync(EXPERIENCE_SOURCE, "utf8");
    assert.match(queueSource, /phaseId\?: string/);
    assert.match(experienceSource, /phaseId: item\.phaseId/);
  });

  it("validates voice formats, signatures, duration, and cross-event ownership", () => {
    assert.equal(normalizeVoiceContentType("audio/webm;codecs=opus"), "audio/webm");
    assert.equal(normalizeVoiceContentType("audio/wav"), null);
    assert.equal(validateVoiceDuration(45, 45), true);
    assert.equal(validateVoiceDuration(46, 45), false);
    assert.equal(validateVoiceFileSize(10 * 1024 * 1024, 10 * 1024 * 1024), true);
    assert.equal(validateVoiceFileSize(10 * 1024 * 1024 + 1, 10 * 1024 * 1024), false);
    assert.equal(matchesVoiceMagicBytes(new Uint8Array([0x1a, 0x45, 0xdf, 0xa3]), "audio/webm"), true);
    assert.equal(matchesVoiceMagicBytes(new Uint8Array([0x52, 0x49, 0x46, 0x46]), "audio/webm"), false);

    const config = mapMemoryExperienceRow(standaloneRow());
    assert.equal(
      photoBelongsToMemoriesExperience(
        { invitation_slug: "ana-miguel", experience_id: config.experienceId },
        config
      ),
      true
    );
    assert.equal(
      photoBelongsToMemoriesExperience(
        { invitation_slug: "ana-miguel", experience_id: null },
        config
      ),
      false
    );
    assert.equal(
      photoBelongsToMemoriesExperience(
        { invitation_slug: "outro-evento", experience_id: config.experienceId },
        config
      ),
      false
    );

    const haxrConfig = resolveMemoriesConfig("jessicasamuelwedding");
    assert.ok(haxrConfig);
    assert.equal(
      photoBelongsToMemoriesExperience(
        { invitation_slug: "jessicasamuelwedding", experience_id: null },
        haxrConfig
      ),
      true
    );
  });

  it("keeps voice memories host-only, moderated, and outside wedding_photos", () => {
    const sql = readFileSync(VOICE_MIGRATION, "utf8");
    assert.match(sql, /CREATE TABLE IF NOT EXISTS memory_voice_messages/i);
    assert.match(sql, /photo_id uuid NOT NULL/i);
    assert.match(sql, /visibility text NOT NULL DEFAULT 'hosts-only'/i);
    assert.match(sql, /moderation_status text NOT NULL DEFAULT 'pending'/i);
    assert.match(sql, /REVOKE ALL ON memory_voice_messages FROM anon, authenticated/i);
  });

  it("does not give points for phases, free moments, scans, or voice rows", () => {
    const participantId = "22222222-2222-4222-8222-222222222222";
    const photos: Array<RawMemoryPhotoRow & { phase_id?: string | null }> = [
      {
        id: "challenge",
        invitation_slug: "jessicasamuelwedding",
        participant_id: participantId,
        guest_name: "Ana",
        challenge_id: "01",
        phase_id: "a-mesa",
        created_at: "2026-08-17T12:00:00.000Z",
        moderation_status: "approved",
      },
      {
        id: "free-moment",
        invitation_slug: "jessicasamuelwedding",
        participant_id: participantId,
        guest_name: "Ana",
        challenge_id: null,
        phase_id: "entre-nos",
        created_at: "2026-08-17T12:01:00.000Z",
        moderation_status: "approved",
      },
    ];
    const ranking = calculateLeaderboardFromPhotos(photos, "provisional");
    assert.equal(ranking[0]?.completed, 1);
  });

  it("fails closed and accepts only the exact Bearer authorization scheme", () => {
    const previous = process.env.ADMIN_MODERATION_SECRET;
    try {
      delete process.env.ADMIN_MODERATION_SECRET;
      const missing = requireMemoriesAdmin(new Request("https://example.test"));
      assert.equal(missing.ok, false);
      if (!missing.ok) assert.equal(missing.response.status, 503);

      process.env.ADMIN_MODERATION_SECRET = "test-only-admin-secret";
      const queryFallback = requireMemoriesAdmin(
        new Request("https://example.test?secretKey=test-only-admin-secret")
      );
      assert.equal(queryFallback.ok, false);
      if (!queryFallback.ok) assert.equal(queryFallback.response.status, 401);

      const headerFallback = requireMemoriesAdmin(
        new Request("https://example.test", {
          headers: { "x-admin-secret": "test-only-admin-secret" },
        })
      );
      assert.equal(headerFallback.ok, false);

      const bearer = requireMemoriesAdmin(
        new Request("https://example.test", {
          headers: { authorization: "Bearer test-only-admin-secret" },
        })
      );
      assert.equal(bearer.ok, true);
    } finally {
      if (previous === undefined) delete process.env.ADMIN_MODERATION_SECRET;
      else process.env.ADMIN_MODERATION_SECRET = previous;
    }
  });
});
