import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { rateLimit, RATE_LIMITS, type RateLimitStore, type Bucket, setRateLimitStore, getRateLimitStore } from "../security/rate-limit";
import { sanitizeCommentBody } from "./social-store";
import { authorizeMemoriesSession, type MemoriesSessionSnapshot } from "./session-policy";

const eventAId = "11111111-1111-4111-8111-111111111111";
const eventBId = "22222222-2222-4222-8222-222222222222";
const participantAId = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const participantBId = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
const sessionId = "cccccccc-cccc-4ccc-cccc-cccccccccccc";
const linkId = "dddddddd-dddd-4ddd-dddd-dddddddddddd";
const now = new Date("2026-09-11T12:00:00Z");
const validExpiry = "2026-09-11T14:00:00Z";
const pastExpiry = "2026-09-11T10:00:00Z";

function makeSnapshot(overrides: {
  participantRevoked?: boolean;
  sessionRevoked?: boolean;
  linkRevoked?: boolean;
  expired?: boolean;
} = {}): MemoriesSessionSnapshot {
  return {
    event: {
      id: eventAId,
      slug: "event-a",
      active: true,
      visibility: "moderated",
      uploadsEnabled: true,
      competitionEnabled: true,
    },
    participant: {
      id: participantAId,
      eventId: eventAId,
      guestId: null,
      revokedAt: overrides.participantRevoked ? "2026-09-11T11:00:00Z" : null,
    },
    session: {
      id: sessionId,
      eventId: eventAId,
      participantId: participantAId,
      accessLinkId: linkId,
      expiresAt: overrides.expired ? pastExpiry : validExpiry,
      revokedAt: overrides.sessionRevoked ? "2026-09-11T11:00:00Z" : null,
    },
    accessLink: {
      id: linkId,
      eventId: eventAId,
      expiresAt: overrides.expired ? pastExpiry : validExpiry,
      revokedAt: overrides.linkRevoked ? "2026-09-11T11:00:00Z" : null,
    },
  };
}

describe("Plus Memories — Fase 4: Validação Unitária de Social Privado", () => {
  // ===========================================================================
  // 1. RATE LIMITING: ISOLAMENTO E BURST PROTECTION
  // ===========================================================================
  describe("Rate Limiting por Evento + Participante + Endpoint", () => {
    it("comentários: burst até ao limite (15) é permitido, 16º é bloqueado (429)", () => {
      const key = `test_rl:${eventAId}:${participantAId}:comment:${crypto.randomUUID()}`;
      for (let i = 0; i < RATE_LIMITS.mediaComment.max; i++) {
        const res = rateLimit(key, RATE_LIMITS.mediaComment);
        assert.equal(res.allowed, true, `Comentário ${i + 1} deveria ser permitido`);
        assert.equal(res.remaining, RATE_LIMITS.mediaComment.max - (i + 1));
      }

      // 16º comentário deve ser rejeitado com 429
      const blocked = rateLimit(key, RATE_LIMITS.mediaComment);
      assert.equal(blocked.allowed, false, "16º comentário deve ser bloqueado");
      assert.equal(blocked.remaining, 0);
      assert.ok(blocked.retryAfterSeconds > 0);
    });

    it("reacções: churn até ao limite (40) é permitido, 41º é bloqueado (429)", () => {
      const key = `test_rl:${eventAId}:${participantAId}:reaction:${crypto.randomUUID()}`;
      for (let i = 0; i < RATE_LIMITS.mediaReaction.max; i++) {
        const res = rateLimit(key, RATE_LIMITS.mediaReaction);
        assert.equal(res.allowed, true, `Reacção ${i + 1} deveria ser permitida`);
      }

      const blocked = rateLimit(key, RATE_LIMITS.mediaReaction);
      assert.equal(blocked.allowed, false, "41ª reacção deve ser bloqueada");
      assert.equal(blocked.remaining, 0);
    });

    it("favoritos: churn até ao limite (40) é permitido, 41º é bloqueado (429)", () => {
      const key = `test_rl:${eventAId}:${participantAId}:favorite:${crypto.randomUUID()}`;
      for (let i = 0; i < RATE_LIMITS.mediaFavorite.max; i++) {
        const res = rateLimit(key, RATE_LIMITS.mediaFavorite);
        assert.equal(res.allowed, true, `Favorito ${i + 1} deveria ser permitido`);
      }

      const blocked = rateLimit(key, RATE_LIMITS.mediaFavorite);
      assert.equal(blocked.allowed, false, "41º favorito deve ser bloqueado");
      assert.equal(blocked.remaining, 0);
    });

    it("Participant A atingir o limite NÃO bloqueia Participant B", () => {
      const uniqueSuffix = crypto.randomUUID();
      const keyA = `test_rl:${eventAId}:${participantAId}:comment:${uniqueSuffix}`;
      const keyB = `test_rl:${eventAId}:${participantBId}:comment:${uniqueSuffix}`;

      // Exaurir limite de Participant A
      for (let i = 0; i < RATE_LIMITS.mediaComment.max; i++) {
        rateLimit(keyA, RATE_LIMITS.mediaComment);
      }
      assert.equal(rateLimit(keyA, RATE_LIMITS.mediaComment).allowed, false, "A deve estar bloqueado");

      // Participant B continua com acesso total
      const resB = rateLimit(keyB, RATE_LIMITS.mediaComment);
      assert.equal(resB.allowed, true, "B NÃO pode ser afectado pelo limite de A");
      assert.equal(resB.remaining, RATE_LIMITS.mediaComment.max - 1);
    });

    it("Event A atingir o limite NÃO afecta Event B para o mesmo participante", () => {
      const uniqueSuffix = crypto.randomUUID();
      const keyEventA = `test_rl:${eventAId}:${participantAId}:reaction:${uniqueSuffix}`;
      const keyEventB = `test_rl:${eventBId}:${participantAId}:reaction:${uniqueSuffix}`;

      // Exaurir limite no Evento A
      for (let i = 0; i < RATE_LIMITS.mediaReaction.max; i++) {
        rateLimit(keyEventA, RATE_LIMITS.mediaReaction);
      }
      assert.equal(rateLimit(keyEventA, RATE_LIMITS.mediaReaction).allowed, false, "Evento A deve estar bloqueado");

      // No Evento B, o mesmo participante pode reagir normalmente
      const resEventB = rateLimit(keyEventB, RATE_LIMITS.mediaReaction);
      assert.equal(resEventB.allowed, true, "Evento B NÃO pode ser afectado pelo limite do Evento A");
    });

    it("diferentes endpoints do mesmo participante operam em buckets independentes", () => {
      const uniqueSuffix = crypto.randomUUID();
      const reactionKey = `test_rl:${eventAId}:${participantAId}:reaction:${uniqueSuffix}`;
      const commentKey = `test_rl:${eventAId}:${participantAId}:comment:${uniqueSuffix}`;

      // Exaurir comentários
      for (let i = 0; i < RATE_LIMITS.mediaComment.max; i++) {
        rateLimit(commentKey, RATE_LIMITS.mediaComment);
      }
      assert.equal(rateLimit(commentKey, RATE_LIMITS.mediaComment).allowed, false);

      // Reacções permanecem totalmente desimpedidas
      const reactionRes = rateLimit(reactionKey, RATE_LIMITS.mediaReaction);
      assert.equal(reactionRes.allowed, true, "Reacções não devem ser bloqueadas por exaustão de comentários");
    });

    it("permite plugar adaptadores de store via interface RateLimitStore sem alterar callers", () => {
      let customCalls = 0;
      const customStore: RateLimitStore = {
        getBucket(key: string, windowMs: number, now: number): Bucket {
          customCalls++;
          return { count: 0, resetAt: now + windowMs };
        },
      };
      const prevStore = getRateLimitStore();
      try {
        setRateLimitStore(customStore);
        const res = rateLimit("test_custom_store", { max: 10, windowMs: 1000 });
        assert.equal(res.allowed, true);
        assert.equal(customCalls, 1, "Store personalizado deve interceptar chamada");
      } finally {
        setRateLimitStore(prevStore);
      }
    });
  });

  // ===========================================================================
  // 2. REVOGAÇÃO E EXPIRAÇÃO DE SESSÃO NO GATEWAY
  // ===========================================================================
  describe("Validação de Sessão: Revogada / Expirada / Inválida", () => {
    it("sessão activa e válida é autorizada com permissão de galeria", () => {
      const decision = authorizeMemoriesSession(eventAId, makeSnapshot(), "gallery:read", now);
      assert.equal(decision.ok, true);
    });

    it("sessão com session.revokedAt é estritamente negada com motivo 'revoked'", () => {
      const decision = authorizeMemoriesSession(eventAId, makeSnapshot({ sessionRevoked: true }), "gallery:read", now);
      assert.equal(decision.ok, false);
      if (!decision.ok) {
        assert.equal(decision.reason, "revoked");
      }
    });

    it("sessão com participant.revokedAt é estritamente negada com motivo 'revoked'", () => {
      const decision = authorizeMemoriesSession(eventAId, makeSnapshot({ participantRevoked: true }), "gallery:read", now);
      assert.equal(decision.ok, false);
      if (!decision.ok) {
        assert.equal(decision.reason, "revoked");
      }
    });

    it("sessão com accessLink.revokedAt é estritamente negada com motivo 'revoked'", () => {
      const decision = authorizeMemoriesSession(eventAId, makeSnapshot({ linkRevoked: true }), "gallery:read", now);
      assert.equal(decision.ok, false);
      if (!decision.ok) {
        assert.equal(decision.reason, "revoked");
      }
    });

    it("sessão expirada (expiresAt no passado) é estritamente negada com motivo 'expired'", () => {
      const decision = authorizeMemoriesSession(eventAId, makeSnapshot({ expired: true }), "gallery:read", now);
      assert.equal(decision.ok, false);
      if (!decision.ok) {
        assert.equal(decision.reason, "expired");
      }
    });

    it("sessão de outro evento é estritamente negada com motivo 'cross_event'", () => {
      const decision = authorizeMemoriesSession(eventBId, makeSnapshot(), "gallery:read", now);
      assert.equal(decision.ok, false);
      if (!decision.ok) {
        assert.equal(decision.reason, "cross_event");
      }
    });
  });

  // ===========================================================================
  // 3. TEXTO PURO NORMALIZADO EM COMENTÁRIOS (SEM DOUBLE-ESCAPING)
  // ===========================================================================
  describe("Normalização e Sanitização Canónica de Comentários", () => {
    it("preserva caracteres literais <script> sem conversão permanente para &lt;", () => {
      const payload = "<script>alert('xss')</script>";
      const sanitized = sanitizeCommentBody(payload);
      assert.equal(sanitized, "<script>alert('xss')</script>");
      // Provar ausência de entidades HTML para não causar double-escaping no React
      assert.ok(!sanitized.includes("&lt;"), "Não deve conter &lt;");
      assert.ok(!sanitized.includes("&gt;"), "Não deve conter &gt;");
      assert.ok(!sanitized.includes("&amp;"), "Não deve conter &amp;");
    });

    it("elimina caracteres de controlo perigosos (ex: null bytes, bell, escape)", () => {
      const dirty = "Olá\u0000 mundo\u0007 com carinho\u001B!";
      const cleaned = sanitizeCommentBody(dirty);
      assert.equal(cleaned, "Olá mundo com carinho!");
    });

    it("normaliza CRLF e limita quebras de linha excessivas", () => {
      const multiLine = "Linha 1\r\n\r\n\r\n\r\nLinha 2\rLinha 3";
      const cleaned = sanitizeCommentBody(multiLine);
      assert.equal(cleaned, "Linha 1\n\nLinha 2\nLinha 3");
    });

    it("suporta texto com acentuação e pontuação moçambicana", () => {
      const text = "Parabéns à noiva! Que grande bênção e celebração inesquecível.";
      assert.equal(sanitizeCommentBody(text), text);
    });
  });
});
