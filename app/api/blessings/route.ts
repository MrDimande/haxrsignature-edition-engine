import { NextResponse } from "next/server";
import {
  listBlessingsFromDatabase,
  submitBlessingToDatabase,
} from "@lib/blessings/blessings-db";
import { validateBlessingPayload } from "@lib/blessings/validate";
import {
  getRequestIp,
  rateLimit,
  rateLimitResponse,
  type RateLimitConfig,
} from "@lib/security/rate-limit";
import { persistentRateLimit } from "@lib/security/persistent-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 16_384;

const BLESSINGS_RATE_LIMIT: RateLimitConfig = {
  max: 15,
  windowMs: 5 * 60 * 1000, // 15 submissões por IP a cada 5 minutos
};

function isJsonContentType(request: Request): boolean {
  const contentType = request.headers.get("content-type") || "";
  return contentType.toLowerCase().includes("application/json");
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const slug = (url.searchParams.get("slug") || "").trim().toLowerCase();

    if (!slug) {
      return NextResponse.json(
        { success: false, error: "O parâmetro 'slug' é obrigatório." },
        { status: 400 }
      );
    }

    if (slug !== "neidyejosewedding") {
      return NextResponse.json(
        { success: false, error: "Convite não autorizado." },
        { status: 403 }
      );
    }

    const limitParam = parseInt(url.searchParams.get("limit") || "60", 10);
    const limit = Number.isFinite(limitParam) ? limitParam : 60;

    const blessings = await listBlessingsFromDatabase(slug, limit);

    return NextResponse.json({
      success: true,
      blessings,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[api/blessings GET] Erro:", message);
    return NextResponse.json(
      { success: false, error: "Erro ao carregar mensagens do mural." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!isJsonContentType(request)) {
      return NextResponse.json(
        { success: false, error: "Content-Type deve ser application/json." },
        { status: 415 }
      );
    }

    const contentLength = Number(request.headers.get("content-length") || "0");
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      return NextResponse.json(
        { success: false, error: "Pedido demasiado grande." },
        { status: 413 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Corpo do pedido em formato JSON inválido." },
        { status: 400 }
      );
    }

    const validation = validateBlessingPayload(body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const { data } = validation;

    // Honeypot — responder sucesso silencioso sem persistir
    if (data.isHoneypot) {
      return NextResponse.json({
        success: true,
        persisted: false,
      });
    }

    // Rate Limiting distribuído com fallback em memória
    const ip = getRequestIp(request);
    const rateLimitKey = `blessings:${data.slug}:${ip}`;
    let rateLimitResult;
    try {
      rateLimitResult = await persistentRateLimit(
        rateLimitKey,
        BLESSINGS_RATE_LIMIT
      );
    } catch {
      rateLimitResult = rateLimit(rateLimitKey, BLESSINGS_RATE_LIMIT);
    }

    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult);
    }

    // Persistência com Idempotência
    const result = await submitBlessingToDatabase(
      data.slug,
      data.clientId,
      data.author,
      data.message
    );

    if (!result.ok) {
      return NextResponse.json(
        {
          success: false,
          error: "Não foi possível registar a sua mensagem no momento.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      persisted: true,
      duplicate: result.duplicate,
      blessing: result.blessing,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[api/blessings POST] Erro inesperado:", message);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
