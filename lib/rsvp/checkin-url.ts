/**
 * Resolução segura e explícita do URL de check-in do Passe Digital (Neidy & José).
 *
 * Invariantes de Segurança:
 * 1. Em Produção, utiliza estritamente o destino canónico aprovado (https://www.haxrsignature.com).
 * 2. Em Preview, NUNCA produz silenciosamente um URL de Produção.
 * 3. Se o destino de Preview não estiver configurado ou for inválido, a aplicação
 *    falha de forma segura (fail-closed) e bloqueia a emissão do QR.
 */

export const NEIDY_JOSE_CANONICAL_EVENT_ID = "aed4c44a-49f8-4e9e-8b6b-cd5b3c701102";
export const CANONICAL_CORE_PRODUCTION_BASE = "https://www.haxrsignature.com";

export type ResolvedEnvironment = "production" | "preview" | "development";

export type CheckinUrlResolution =
  | {
      ok: true;
      url: string;
      environment: ResolvedEnvironment;
      targetBase: string;
    }
  | {
      ok: false;
      error:
        | "missing_token"
        | "invalid_token"
        | "preview_target_unconfigured"
        | "preview_cannot_target_production"
        | "invalid_target_url";
      message: string;
    };

export interface ResolveCheckinUrlOptions {
  env?: string;
  previewBaseUrl?: string;
  hostname?: string;
}

export function detectEnvironment(options?: ResolveCheckinUrlOptions): ResolvedEnvironment {
  if (options?.env) {
    const norm = options.env.trim().toLowerCase();
    if (norm === "production") return "production";
    if (norm === "preview") return "preview";
    if (norm === "development" || norm === "test") return "development";
  }

  // Detecção via hostname do browser quando disponível
  const hostname =
    options?.hostname ||
    (typeof window !== "undefined" ? window.location.hostname : undefined);

  if (hostname) {
    const normHost = hostname.trim().toLowerCase();
    if (normHost === "edition.haxrsignature.com") {
      return "production";
    }
    if (
      normHost.endsWith(".vercel.app") ||
      normHost.includes("preview") ||
      normHost.includes("staging")
    ) {
      return "preview";
    }
    if (normHost === "localhost" || normHost === "127.0.0.1") {
      return "development";
    }
  }

  // Variáveis Vercel e Node
  const vercelEnv = (
    process.env.NEXT_PUBLIC_VERCEL_ENV ||
    process.env.VERCEL_ENV ||
    ""
  )
    .trim()
    .toLowerCase();

  if (vercelEnv === "production") return "production";
  if (vercelEnv === "preview") return "preview";
  if (vercelEnv === "development") return "development";

  if (process.env.NODE_ENV === "production") {
    return "production";
  }

  return "development";
}

export const PRODUCTION_HOSTNAMES = new Set([
  "haxrsignature.com",
  "www.haxrsignature.com",
  "edition.haxrsignature.com",
  "haxrsignature.vercel.app",
  "projecto-haxrsignature-edition.vercel.app",
]);

export function isProductionHostOrAlias(hostname: string): boolean {
  const norm = hostname.trim().toLowerCase();
  if (PRODUCTION_HOSTNAMES.has(norm)) return true;
  if (norm.endsWith(".haxrsignature.com")) return true;
  return false;
}

export function resolveNeidyJoseCheckinUrl(
  qrToken: string,
  options?: ResolveCheckinUrlOptions
): CheckinUrlResolution {
  if (!qrToken || typeof qrToken !== "string") {
    return {
      ok: false,
      error: "missing_token",
      message: "Token de entrada não disponibilizado.",
    };
  }

  const cleanToken = qrToken.trim();
  if (cleanToken.length < 16) {
    return {
      ok: false,
      error: "invalid_token",
      message: "Token de entrada inválido ou demasiado curto.",
    };
  }

  const environment = detectEnvironment(options);
  const safeToken = encodeURIComponent(cleanToken);
  const path = `/event/${NEIDY_JOSE_CANONICAL_EVENT_ID}/checkin/${safeToken}`;

  if (environment === "production") {
    return {
      ok: true,
      url: `${CANONICAL_CORE_PRODUCTION_BASE}${path}`,
      environment: "production",
      targetBase: CANONICAL_CORE_PRODUCTION_BASE,
    };
  }

  if (environment === "preview") {
    const previewBase =
      options?.previewBaseUrl?.trim() ||
      process.env.NEXT_PUBLIC_CORE_PREVIEW_URL?.trim() ||
      process.env.NEXT_PUBLIC_CORE_BASE_URL?.trim() ||
      process.env.HAXR_CORE_API_BASE_URL?.trim();

    if (!previewBase) {
      return {
        ok: false,
        error: "preview_target_unconfigured",
        message:
          "Ambiente de Preview: Destino de check-in não configurado. Por segurança, a geração de passes com destino a produção está bloqueada neste ambiente.",
      };
    }

    try {
      const parsed = new URL(previewBase);

      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        return {
          ok: false,
          error: "invalid_target_url",
          message: "Ambiente de Preview: Esquema de URL inválido. Apenas http e https são permitidos.",
        };
      }

      if (isProductionHostOrAlias(parsed.hostname)) {
        return {
          ok: false,
          error: "preview_cannot_target_production",
          message:
            "Ambiente de Preview: O destino configurado aponta para a produção ou um alias de produção. Por segurança, os passes de preview não podem apontar para o check-in de produção.",
        };
      }

      const origin = parsed.origin.replace(/\/$/, "");
      return {
        ok: true,
        url: `${origin}${path}`,
        environment: "preview",
        targetBase: origin,
      };
    } catch {
      return {
        ok: false,
        error: "invalid_target_url",
        message: "Ambiente de Preview: URL de destino do Core inválida.",
      };
    }
  }

  // Ambiente de Desenvolvimento
  const devBase =
    options?.previewBaseUrl?.trim() ||
    process.env.NEXT_PUBLIC_CORE_BASE_URL?.trim() ||
    process.env.HAXR_CORE_API_BASE_URL?.trim() ||
    "http://localhost:3000";

  return {
    ok: true,
    url: `${devBase.replace(/\/$/, "")}${path}`,
    environment: "development",
    targetBase: devBase.replace(/\/$/, ""),
  };
}
