/**
 * HAXR PLUS MEMORIES — FASE 5: MEDIA DERIVATIVES PIPELINE & LEASE ENGINE
 *
 * Processamento assíncrono de derivados de mídias (thumbnails, medium/previews, posters de vídeo)
 * com WebP de alta-costura, auto-orientação, remoção de metadados privados,
 * protecção contra decompression bombs, validação de magic bytes,
 * lease de worker atómico/reclaim com timeout e idempotência estrita de armazenamento.
 */

import sharp from "sharp";
import { getNeonPool } from "../db/neon-client";
import { getMemoriesStorageProvider } from "./storage";
import { assertCanonicalStoragePath } from "./storage/path-security";
import type { MemoriesStorageProvider } from "./storage/types";

export const DERIVATIVE_CONFIG = {
  thumbnail: {
    maxWidth: 320,
    maxHeight: 320,
    quality: 80,
    format: "webp" as const,
  },
  medium: {
    maxWidth: 1280,
    maxHeight: 1280,
    quality: 85,
    format: "webp" as const,
  },
  limits: {
    maxInputPixels: 50_000_000, // 50 Megapixels (protecção contra decompression bombs)
    maxDimension: 16384,
    defaultLeaseTimeoutSeconds: 300, // 5 minutos
  },
} as const;

export type DerivativeJobStatus = "pending" | "processing" | "ready" | "failed";

export interface GeneratedDerivative {
  buffer: Buffer;
  width: number;
  height: number;
  format: "webp";
  contentType: "image/webp";
}

export interface GeneratedImageDerivatives {
  thumbnail: GeneratedDerivative;
  medium: GeneratedDerivative;
  metadata: {
    width: number;
    height: number;
    orientation: "portrait" | "landscape" | "square";
    format: string;
  };
}

export interface ProcessMediaDerivativesOptions {
  force?: boolean;
  workerId?: string;
  leaseTimeoutSeconds?: number;
  storageProvider?: MemoriesStorageProvider;
}

export interface ProcessPendingDerivativesBatchOptions extends ProcessMediaDerivativesOptions {
  slug?: string;
  /**
   * Limits selection before a lease is claimed. This is intentionally distinct
   * from the media processor input: it is a batch-selection constraint only.
   */
  mediaId?: string;
}

type DerivativeBatchProcessor = (
  mediaId: string,
  options?: ProcessMediaDerivativesOptions
) => Promise<ProcessMediaDerivativesResult>;

type DerivativeBatchDependencies = {
  pool: Pick<ReturnType<typeof getNeonPool>, "query">;
  processMedia: DerivativeBatchProcessor;
};

export interface ProcessMediaDerivativesResult {
  success: boolean;
  mediaId: string;
  status: DerivativeJobStatus;
  thumbnailPath?: string | null;
  mediumPath?: string | null;
  posterPath?: string | null;
  hasDerivatives: boolean;
  error?: string;
  attempts?: number;
  leaseExpired?: boolean;
}

export interface SniffedMediaFormat {
  format: "jpeg" | "png" | "webp" | "mp4" | "unknown";
  isImage: boolean;
  isVideo: boolean;
}

/**
 * Validação rigorosa de magic bytes independentemente da extensão do ficheiro ou content-type declarado.
 */
export function sniffMediaFormat(buffer: Buffer | Uint8Array): SniffedMediaFormat {
  if (!buffer || buffer.length < 4) {
    return { format: "unknown", isImage: false, isVideo: false };
  }

  // JPEG: 0xFF, 0xD8, 0xFF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { format: "jpeg", isImage: true, isVideo: false };
  }

  // PNG: 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { format: "png", isImage: true, isVideo: false };
  }

  // WebP: 'RIFF'....'WEBP'
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return { format: "webp", isImage: true, isVideo: false };
  }

  // MP4: 'ftyp' at bytes 4..7
  if (
    buffer.length >= 8 &&
    buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70
  ) {
    return { format: "mp4", isImage: false, isVideo: true };
  }

  return { format: "unknown", isImage: false, isVideo: false };
}

/**
 * Gera derivados de alta performance para uma imagem a partir do buffer original.
 * Aplica rotação automática via EXIF, remove metadados privados e converte para WebP.
 * Garante que imagens pequenas não são ampliadas artificialmente (`withoutEnlargement: true`).
 */
export async function generateImageDerivatives(
  inputBuffer: Buffer | Uint8Array
): Promise<GeneratedImageDerivatives> {
  const buf = Buffer.isBuffer(inputBuffer) ? inputBuffer : Buffer.from(inputBuffer);

  const sniffed = sniffMediaFormat(buf);
  if (!sniffed.isImage) {
    if (sniffed.isVideo) {
      throw new Error("MIME_MISMATCH: Declarado como imagem, mas o payload contém assinatura de vídeo MP4.");
    }
    throw new Error("CORRUPT_OR_UNSUPPORTED_IMAGE: Os bytes fornecidos não contêm cabeçalho de imagem válido (JPEG/PNG/WebP).");
  }

  // 1. Inspecção de metadados e salvaguarda contra decompression bombs
  const image = sharp(buf, {
    limitInputPixels: DERIVATIVE_CONFIG.limits.maxInputPixels,
    sequentialRead: true,
  });

  const meta = await image.metadata();

  if (!meta.width || !meta.height) {
    throw new Error("Não foi possível ler as dimensões da imagem original.");
  }

  if (
    meta.width > DERIVATIVE_CONFIG.limits.maxDimension ||
    meta.height > DERIVATIVE_CONFIG.limits.maxDimension
  ) {
    throw new Error(
      `Dimensões da imagem (${meta.width}x${meta.height}) excedem o limite de segurança de ${DERIVATIVE_CONFIG.limits.maxDimension}px.`
    );
  }

  // 2. Determinação de orientação canónica pós-rotação EXIF
  let effectiveWidth = meta.width;
  let effectiveHeight = meta.height;
  if (meta.orientation && [5, 6, 7, 8].includes(meta.orientation)) {
    effectiveWidth = meta.height;
    effectiveHeight = meta.width;
  }

  const orientation: "portrait" | "landscape" | "square" =
    effectiveWidth > effectiveHeight
      ? "landscape"
      : effectiveWidth < effectiveHeight
      ? "portrait"
      : "square";

  // 3. Geração de Thumbnail (máx. 320x320 WebP, sem ampliação forçada, EXIF limpo)
  const thumbBuffer = await sharp(buf, { limitInputPixels: DERIVATIVE_CONFIG.limits.maxInputPixels })
    .rotate() // Auto-orienta com base no EXIF antes de remover
    .resize({
      width: DERIVATIVE_CONFIG.thumbnail.maxWidth,
      height: DERIVATIVE_CONFIG.thumbnail.maxHeight,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: DERIVATIVE_CONFIG.thumbnail.quality, effort: 4 })
    .toBuffer();

  const thumbMeta = await sharp(thumbBuffer).metadata();

  // 4. Geração de Medium / Preview (máx. 1280x1280 WebP, sem ampliação forçada, EXIF limpo)
  const mediumBuffer = await sharp(buf, { limitInputPixels: DERIVATIVE_CONFIG.limits.maxInputPixels })
    .rotate()
    .resize({
      width: DERIVATIVE_CONFIG.medium.maxWidth,
      height: DERIVATIVE_CONFIG.medium.maxHeight,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: DERIVATIVE_CONFIG.medium.quality, effort: 4 })
    .toBuffer();

  const mediumMeta = await sharp(mediumBuffer).metadata();

  return {
    thumbnail: {
      buffer: thumbBuffer,
      width: thumbMeta.width || effectiveWidth,
      height: thumbMeta.height || effectiveHeight,
      format: "webp",
      contentType: "image/webp",
    },
    medium: {
      buffer: mediumBuffer,
      width: mediumMeta.width || effectiveWidth,
      height: mediumMeta.height || effectiveHeight,
      format: "webp",
      contentType: "image/webp",
    },
    metadata: {
      width: effectiveWidth,
      height: effectiveHeight,
      orientation,
      format: meta.format || "jpeg",
    },
  };
}

/**
 * Processa com segurança um poster de vídeo fornecido pelo browser (Canvas / captura de frame).
 * 
 * Salvaguardas:
 * - Não confia no Content-Type declarado pelo cliente.
 * - Valida magic bytes como imagem real (JPEG/PNG/WebP).
 * - Protecção contra decompression bombs (50 Megapixels).
 * - Remove metadados privados e auto-orienta via EXIF.
 * - Converte estritamente para WebP canónico: ${slug}/${mediaId}/poster.webp.
 * - O cliente NUNCA decide o caminho de armazenamento final.
 */
export async function processBrowserVideoPoster(
  inputBuffer: Buffer | Uint8Array,
  slug: string,
  mediaId: string,
  _untrustedPath?: string
): Promise<{
  buffer: Buffer;
  canonicalPath: string;
  width: number;
  height: number;
  format: "webp";
  contentType: "image/webp";
}> {
  const buf = Buffer.isBuffer(inputBuffer) ? inputBuffer : Buffer.from(inputBuffer);

  if (!buf || buf.length === 0) {
    throw new Error("EMPTY_POSTER: Buffer de poster vazio.");
  }

  // 1. Validação estrita de magic bytes de imagem
  const sniffed = sniffMediaFormat(buf);
  if (!sniffed.isImage) {
    throw new Error("INVALID_POSTER_BYTES: Os bytes fornecidos não contêm cabeçalho de imagem válido (JPEG/PNG/WebP).");
  }

  // 2. Leitura de metadados e validação de limites
  const image = sharp(buf, {
    limitInputPixels: DERIVATIVE_CONFIG.limits.maxInputPixels,
    sequentialRead: true,
  });

  const meta = await image.metadata();
  if (!meta.width || !meta.height) {
    throw new Error("INVALID_POSTER_DIMENSIONS: Não foi possível ler as dimensões do poster.");
  }

  if (
    meta.width > DERIVATIVE_CONFIG.limits.maxDimension ||
    meta.height > DERIVATIVE_CONFIG.limits.maxDimension
  ) {
    throw new Error(
      `Dimensões do poster (${meta.width}x${meta.height}) excedem o limite de segurança de ${DERIVATIVE_CONFIG.limits.maxDimension}px.`
    );
  }

  // 3. Transcodificação e remoção de metadados
  const posterBuffer = await sharp(buf, { limitInputPixels: DERIVATIVE_CONFIG.limits.maxInputPixels })
    .rotate()
    .resize({ width: 1280, height: 720, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85, effort: 4 })
    .toBuffer();

  const posterMeta = await sharp(posterBuffer).metadata();

  // 4. O cliente não decide o storage path final: gera SEMPRE o path canónico
  const canonicalPath = `${slug}/${mediaId}/poster.webp`;
  assertCanonicalStoragePath(canonicalPath);

  return {
    buffer: posterBuffer,
    canonicalPath,
    width: posterMeta.width || meta.width,
    height: posterMeta.height || meta.height,
    format: "webp",
    contentType: "image/webp",
  };
}

/**
 * Processa o job de derivados de uma foto/vídeo com lease de worker e crash recovery.
 * 
 * Garantias:
 * - Lease atómico: claim curto na BD, libertando a ligação imediatamente durante o download e transcodificação.
 * - Token opaco único (UUID): Worker B não consegue finalizar job de Worker A mesmo reutilizando workerId.
 * - Worker antigo tentando finalizar após timeout/reclaim resulta em no-op seguro.
 * - Falhas não invalidam a mídia original nem eliminam o registo.
 * - has_derivatives é marcado como true APENAS quando os ficheiros físicos estão confirmados no storage.
 */
export async function processMediaDerivatives(
  mediaId: string,
  options: ProcessMediaDerivativesOptions = {}
): Promise<ProcessMediaDerivativesResult> {
  const workerId = options.workerId || `worker-${Math.random().toString(36).substring(2, 9)}`;
  const provider = options.storageProvider || getMemoriesStorageProvider();
  const leaseTimeout = options.leaseTimeoutSeconds || DERIVATIVE_CONFIG.limits.defaultLeaseTimeoutSeconds;
  const pool = getNeonPool();

  // 1. Tentar adquirir o lease atómico via função PostgreSQL com token opaco
  const claimRes = await pool.query(
    `SELECT claimed, media_id, invitation_slug, storage_path, content_type,
            media_type, poster_storage_path, locked_at, attempts, lease_token
     FROM haxr_claim_media_derivative_job($1, $2, $3, $4);`,
    [mediaId, workerId, leaseTimeout, Boolean(options.force)]
  );

  if (claimRes.rows.length === 0) {
    // Outro worker activo detém o lease ou registo não existe
    const currentRes = await pool.query(
      `SELECT id, derivatives_status, has_derivatives, thumbnail_storage_path, medium_storage_path, poster_storage_path, derivatives_attempts
       FROM wedding_photos WHERE id = $1;`,
      [mediaId]
    );

    if (currentRes.rows.length === 0) {
      return {
        success: false,
        mediaId,
        status: "failed",
        hasDerivatives: false,
        error: "Mídia não encontrada.",
      };
    }

    const row = currentRes.rows[0];
    return {
      success: row.derivatives_status === "ready",
      mediaId,
      status: row.derivatives_status as DerivativeJobStatus,
      hasDerivatives: row.has_derivatives,
      thumbnailPath: row.thumbnail_storage_path,
      mediumPath: row.medium_storage_path,
      posterPath: row.poster_storage_path,
      attempts: row.derivatives_attempts,
      error: row.derivatives_status === "processing" ? "LEASE_ACTIVE_ANOTHER_WORKER" : undefined,
    };
  }

  const claimRow = claimRes.rows[0];
  if (!claimRow.claimed) {
    // Mídia já se encontra em estado 'ready' e não foi especificado 'force'
    return {
      success: true,
      mediaId,
      status: "ready",
      hasDerivatives: true,
      thumbnailPath: `${claimRow.invitation_slug}/${mediaId}/thumbnail.webp`,
      mediumPath: `${claimRow.invitation_slug}/${mediaId}/medium.webp`,
      posterPath: claimRow.poster_storage_path,
      attempts: claimRow.attempts,
    };
  }

  const slug = claimRow.invitation_slug;
  const originalPath = claimRow.storage_path;
  const mediaType = claimRow.media_type || (claimRow.content_type?.startsWith("video/") ? "video" : "image");
  const leaseToken = claimRow.lease_token;

  try {
    assertCanonicalStoragePath(originalPath);

    // Validação estrita de namespace de storage: nunca permitir que caminhos de outro evento sejam processados
    if (!originalPath.startsWith(`${slug}/`)) {
      throw new Error(`Inconsistência de namespace: storage_path '${originalPath}' não pertence ao evento '${slug}'.`);
    }

    // 2. Carregar ficheiro original do storage provider (fora de qualquer transacção PostgreSQL)
    const originalBytes = await provider.readObject(originalPath);
    if (!originalBytes || originalBytes.length === 0) {
      throw new Error("ORIGINAL_MISSING: O ficheiro original não existe no armazenamento.");
    }

    if (mediaType === "image") {
      // 3. Gerar derivados de imagem (thumbnail + medium) com validação de magic bytes
      const derivatives = await generateImageDerivatives(originalBytes);

      // Caminhos determinísticos (sem sufixos aleatórios nem lixo incremental)
      const thumbnailPath = `${slug}/${mediaId}/thumbnail.webp`;
      const mediumPath = `${slug}/${mediaId}/medium.webp`;

      assertCanonicalStoragePath(thumbnailPath);
      assertCanonicalStoragePath(mediumPath);

      // 4. Gravar derivados no storage provider
      await provider.putObject(thumbnailPath, derivatives.thumbnail.buffer, "image/webp");
      await provider.putObject(mediumPath, derivatives.medium.buffer, "image/webp");

      // 5. Confirmação física de existência no storage antes de finalizar na BD
      const thumbInfo = await provider.getObjectInfo(thumbnailPath);
      const mediumInfo = await provider.getObjectInfo(mediumPath);

      if (!thumbInfo.exists || !mediumInfo.exists) {
        throw new Error("Falha ao verificar gravação física dos derivados no armazenamento.");
      }

      // 6. Finalização atómica condicionada à posse do lease token
      const finalizeRes = await pool.query(
        `SELECT haxr_finalize_media_derivative_job(
          $1, $2, 'ready', true, $3, $4, NULL, $5, $6, $7, NULL, NULL
        ) AS finalized;`,
        [
          mediaId,
          leaseToken,
          thumbnailPath,
          mediumPath,
          derivatives.metadata.width,
          derivatives.metadata.height,
          derivatives.metadata.orientation,
        ]
      );

      const finalized = finalizeRes.rows[0]?.finalized === true;
      if (!finalized) {
        console.warn(`[processMediaDerivatives] Lease expirado ou reclamado por outro worker (${mediaId}); finalização ignorada.`);
        return {
          success: false,
          mediaId,
          status: "processing",
          hasDerivatives: false,
          leaseExpired: true,
          error: "LEASE_LOST: O lease expirou e foi reclamado por outro worker antes da finalização.",
        };
      }

      return {
        success: true,
        mediaId,
        status: "ready",
        thumbnailPath,
        mediumPath,
        hasDerivatives: true,
      };
    } else {
      // Mídia do tipo vídeo: verificar magic bytes de MP4
      const sniffed = sniffMediaFormat(originalBytes);
      if (!sniffed.isVideo && sniffed.format !== "mp4") {
        throw new Error("MIME_MISMATCH: O ficheiro não possui cabeçalho ou container MP4 válido.");
      }

      // Se existir poster pré-carregado no storage, optimizá-lo via processBrowserVideoPoster
      let posterPath = claimRow.poster_storage_path;
      if (posterPath) {
        const posterBytes = await provider.readObject(posterPath);
        if (posterBytes && posterBytes.length > 0) {
          const processedPoster = await processBrowserVideoPoster(posterBytes, slug, mediaId, posterPath);
          const canonicalPosterPath = processedPoster.canonicalPath;
          await provider.putObject(canonicalPosterPath, processedPoster.buffer, "image/webp");

          const finalizeRes = await pool.query(
            `SELECT haxr_finalize_media_derivative_job(
              $1, $2, 'ready', true, $3, NULL, $3, $4, $5, NULL, NULL, NULL
            ) AS finalized;`,
            [mediaId, leaseToken, canonicalPosterPath, processedPoster.width, processedPoster.height]
          );

          return {
            success: finalizeRes.rows[0]?.finalized === true,
            mediaId,
            status: "ready",
            posterPath: canonicalPosterPath,
            hasDerivatives: true,
          };
        }
      }

      // Se nenhum poster estiver disponível:
      // Como o runtime serverless não dispõe de extractor binário FFmpeg,
      // não simulamos falsamente a extracção de frame de vídeo.
      // O vídeo é mantido com status 'pending' e fallback transparente para reprodução directa de vídeo.
      await pool.query(
        `SELECT haxr_finalize_media_derivative_job(
          $1, $2, 'pending', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, $3
        ) AS finalized;`,
        [mediaId, leaseToken, "VIDEO_POSTER_EXTRACTOR_NOT_AVAILABLE: Extractor FFmpeg server-side ausente; utilizando fallback para vídeo directo."]
      );

      return {
        success: true,
        mediaId,
        status: "pending",
        hasDerivatives: false,
        posterPath: null,
      };
    }
  } catch (err: any) {
    console.error(`[processMediaDerivatives] Erro ao processar derivados para ${mediaId}:`, err.message);

    // Finalizar como falha condicionado ao lease, limpando os locks para permitir retries posteriores
    if (leaseToken) {
      await pool.query(
        `SELECT haxr_finalize_media_derivative_job(
          $1, $2, 'failed', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, $3
        );`,
        [mediaId, leaseToken, err.message]
      ).catch(() => {});
    }

    return {
      success: false,
      mediaId,
      status: "failed",
      hasDerivatives: false,
      error: err.message,
    };
  }
}

/**
 * Enfileira um job desacoplado para execução assíncrona após upload concluído.
 */
export function enqueueDerivativeJob(mediaId: string, options?: ProcessMediaDerivativesOptions): void {
  setImmediate(async () => {
    try {
      await processMediaDerivatives(mediaId, options);
    } catch (err: any) {
      console.warn(`[enqueueDerivativeJob] Falha no job desacoplado (${mediaId}):`, err.message);
    }
  });
}

/**
 * Processamento em lote de jobs pendentes ou bloqueios expirados (worker background / retry pool).
 */
export async function processPendingDerivativesBatch(
  limit = 10,
  options?: ProcessPendingDerivativesBatchOptions
): Promise<{ processed: number; successes: number; failures: number }> {
  return processPendingDerivativesBatchWithDependencies(limit, options, {
    pool: getNeonPool(),
    processMedia: processMediaDerivatives,
  });
}

/**
 * Dependency boundary for deterministic verification that a scoped selector
 * excludes non-target jobs before any processor can claim a lease.
 */
export async function processPendingDerivativesBatchWithDependencies(
  limit: number,
  options: ProcessPendingDerivativesBatchOptions | undefined,
  dependencies: DerivativeBatchDependencies
): Promise<{ processed: number; successes: number; failures: number }> {
  const safeLimit = Math.max(1, Math.floor(limit));
  const { mediaId, slug, ...processingOptions } = options ?? {};
  const pool = dependencies.pool;

  // Selecciona registos pendentes ou bloqueios órfãos (com mais de 5 minutos)
  const pendingRes = await pool.query(
    `
    SELECT id
    FROM wedding_photos
    WHERE (derivatives_status = 'pending'
       OR (derivatives_status = 'processing' AND derivatives_locked_at < now() - INTERVAL '5 minutes'))
      AND ($2::text IS NULL OR invitation_slug = $2)
      AND ($3::uuid IS NULL OR id = $3::uuid)
    ORDER BY created_at ASC
    LIMIT $1;
    `,
    [safeLimit, slug || null, mediaId || null]
  );

  let successes = 0;
  let failures = 0;

  for (const row of pendingRes.rows) {
    const res = await dependencies.processMedia(row.id, processingOptions);
    if (res.success) {
      successes++;
    } else {
      failures++;
    }
  }

  return {
    processed: pendingRes.rows.length,
    successes,
    failures,
  };
}
