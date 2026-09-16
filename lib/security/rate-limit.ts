import { NextResponse } from "next/server";

export type RateLimitConfig = {
  max: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export type Bucket = {
  count: number;
  resetAt: number;
};

/**
 * ==============================================================================
 * ARQUITECTURA & TOPOLOGIA DO RATE LIMITER
 * ==============================================================================
 * TOPOLOGIA ACTUAL: Memória Local de Processo (In-Memory Process-Local Map).
 *
 * GARANTIAS FORNECIDAS:
 * - Defesa em profundidade de primeira linha com latência sub-milissegundo (< 0.1ms).
 * - Protecção eficaz contra loops infinitos de interface, double-clicks rápidos e
 *   rajadas sucessivas que atinjam a mesma instância em execução.
 *
 * LIMITAÇÕES OPERACIONAIS (SERVERLESS / MULTI-INSTANCE):
 * - Em ambientes serverless multi-instância (ex: múltiplas Vercel Lambdas efêmeras),
 *   o estado de cada bucket é isolado por processo/instância.
 * - Não constitui garantia global distribuída em larga escala através de instâncias
 *   concorrentes distintas (requereria store centralizado distribuído).
 *
 * DESIGN EXTENSÍVEL:
 * - A interface `RateLimitStore` padroniza o contrato de armazenamento.
 * - A implementação padrão `MemoryRateLimitStore` opera localmente sem custos nem
 *   dependências externas, pronta para receber adaptor distribuído futuro (ex: Redis/KV)
 *   quando formalmente autorizado pelo proprietário do projecto.
 * ==============================================================================
 */

export interface RateLimitStore {
  getBucket(key: string, windowMs: number, now: number): Bucket;
  reset?(): void;
}

export class MemoryRateLimitStore implements RateLimitStore {
  private buckets = new Map<string, Bucket>();

  private pruneExpired(now: number): void {
    if (this.buckets.size < 500) return;
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) {
        this.buckets.delete(key);
      }
    }
  }

  getBucket(key: string, windowMs: number, now: number): Bucket {
    this.pruneExpired(now);
    const existing = this.buckets.get(key);
    if (!existing || existing.resetAt <= now) {
      const bucket = { count: 0, resetAt: now + windowMs };
      this.buckets.set(key, bucket);
      return bucket;
    }
    return existing;
  }

  reset(): void {
    this.buckets.clear();
  }
}

let activeStore: RateLimitStore = new MemoryRateLimitStore();

/**
 * Permite configurar um adaptador de armazenamento alternativo (ex: em testes ou store distribuído futuro).
 */
export function setRateLimitStore(store: RateLimitStore): void {
  activeStore = store;
}

export function getRateLimitStore(): RateLimitStore {
  return activeStore;
}

export const RATE_LIMITS = {
  /** RSVP Edition — por IP (protege Resend + Supabase) */
  editionRsvp: { max: 8, windowMs: 15 * 60 * 1000 },
  /** Gift reservation mutations — por slug + fingerprint */
  giftReserve: { max: 6, windowMs: 15 * 60 * 1000 },
  /** Jessica & Samuel photo wall — signed upload intent */
  jessicaSamuelPhotoIntent: { max: 5, windowMs: 15 * 60 * 1000 },
  /** Jessica & Samuel photo wall — upload completion */
  jessicaSamuelPhotoComplete: { max: 8, windowMs: 15 * 60 * 1000 },
  /** Traditional wedding memories — signed upload intent */
  memoriesIntent: { max: 10, windowMs: 15 * 60 * 1000 },
  /** Traditional wedding memories — upload completion */
  memoriesComplete: { max: 15, windowMs: 15 * 60 * 1000 },
  /** Social reaction mutations — por participante/IP */
  mediaReaction: { max: 40, windowMs: 60 * 1000 },
  /** Social favorite mutations — por participante/IP */
  mediaFavorite: { max: 40, windowMs: 60 * 1000 },
  /** Social comment submissions — por participante/IP */
  mediaComment: { max: 15, windowMs: 60 * 1000 },
} as const satisfies Record<string, RateLimitConfig>;

export function getRequestIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function rateLimit(
  key: string,
  config: RateLimitConfig,
  options?: { increment?: boolean }
): RateLimitResult {
  const increment = options?.increment ?? true;
  const now = Date.now();
  const bucket = activeStore.getBucket(key, config.windowMs, now);

  if (bucket.count >= config.max) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((bucket.resetAt - now) / 1000)
      ),
    };
  }

  if (increment) {
    bucket.count += 1;
  }

  return {
    allowed: true,
    remaining: Math.max(0, config.max - bucket.count),
    retryAfterSeconds: 0,
  };
}

export function rateLimitResponse(
  result: RateLimitResult,
  body?: Record<string, unknown>
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: "Demasiados pedidos. Aguarde alguns minutos e tente novamente.",
      ...body,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
      },
    }
  );
}
