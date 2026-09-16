/**
 * HAXR PLUS MEMORIES — MEDIA CORE METADATA & DERIVATIVES
 * 
 * Directrizes de Alta-Costura Digital:
 * - Sanitização rigorosa: remoção de PII, coordenadas GPS e dados sensíveis de EXIF.
 * - Inferência determinística de media_type ('image' | 'video').
 * - Fallback temporal seguro: se captured_at for nulo ou inválido, utiliza created_at.
 * - Suporte a derivados de baixa largura de banda (thumbnails/posters) para redes móveis em Moçambique.
 */

export type MediaType = 'image' | 'video';
export type MediaOrientation = 'portrait' | 'landscape' | 'square';

export interface RawMediaMetadataInput {
  capturedAt?: string | Date | null;
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
  mediaType?: string | null;
  contentType?: string | null;
  fileName?: string | null;
}

export interface SanitizedMediaMetadata {
  capturedAt: string | null;
  width: number | null;
  height: number | null;
  orientation: MediaOrientation | null;
  durationSeconds: number | null;
  mediaType: MediaType;
}

/**
 * Determina se o tipo de conteúdo ou extensão corresponde a um vídeo suportado.
 */
export function inferMediaType(contentType?: string | null, fileName?: string | null): MediaType {
  const normalizedType = contentType?.trim().toLowerCase() ?? '';
  if (
    normalizedType.startsWith('video/') ||
    normalizedType === 'video/mp4' ||
    normalizedType === 'video/quicktime' ||
    normalizedType === 'video/webm'
  ) {
    return 'video';
  }

  const normalizedName = fileName?.trim().toLowerCase() ?? '';
  if (
    normalizedName.endsWith('.mp4') ||
    normalizedName.endsWith('.mov') ||
    normalizedName.endsWith('.webm') ||
    normalizedName.endsWith('.m4v')
  ) {
    return 'video';
  }

  return 'image';
}

/**
 * Calcula a orientação com base na largura e altura da imagem/vídeo.
 */
export function calculateOrientation(width?: number | null, height?: number | null): MediaOrientation | null {
  if (!width || !height || width <= 0 || height <= 0) return null;
  const ratio = width / height;
  if (ratio > 1.05) return 'landscape';
  if (ratio < 0.95) return 'portrait';
  return 'square';
}

/**
 * Sanitiza e valida o timestamp de captura.
 * Rejeita datas no futuro (tolerância de 24h para fusos horários desajustados) ou anteriores a 2000.
 */
export function sanitizeCapturedAt(capturedAt?: string | Date | null, fallbackDate?: string | Date | null): string | null {
  if (!capturedAt) {
    if (fallbackDate) {
      const fb = new Date(fallbackDate);
      if (!isNaN(fb.getTime())) return fb.toISOString();
    }
    return null;
  }

  const d = new Date(capturedAt);
  if (isNaN(d.getTime())) {
    if (fallbackDate) {
      const fb = new Date(fallbackDate);
      if (!isNaN(fb.getTime())) return fb.toISOString();
    }
    return null;
  }

  const now = Date.now();
  const maxFuture = now + 24 * 60 * 60 * 1000; // +24 horas
  const minPast = new Date('2000-01-01T00:00:00Z').getTime();

  if (d.getTime() > maxFuture || d.getTime() < minPast) {
    if (fallbackDate) {
      const fb = new Date(fallbackDate);
      if (!isNaN(fb.getTime())) return fb.toISOString();
    }
    return null;
  }

  return d.toISOString();
}

/**
 * Sanitiza dimensões (largura/altura).
 * Limite superior: 16384px (resoluções 8K+ ou panorâmicas extremas).
 */
export function sanitizeDimension(val?: number | null): number | null {
  if (val === undefined || val === null) return null;
  const num = Math.round(Number(val));
  if (isNaN(num) || num <= 0 || num > 16384) return null;
  return num;
}

/**
 * Sanitiza duração em segundos para vídeos.
 * Limite máximo: 600 segundos (10 minutos) para carregamentos no atelier.
 */
export function sanitizeDuration(val?: number | null): number | null {
  if (val === undefined || val === null) return null;
  const num = Number(val);
  if (isNaN(num) || num <= 0) return null;
  if (num > 600) return 600;
  return Math.round(num * 100) / 100;
}

/**
 * Sanitiza metadados completos de ficheiros de mídia, garantindo que nenhum
 * dado de rastreio de GPS ou dispositivo seja propagado.
 */
export function sanitizeMediaMetadata(
  input: RawMediaMetadataInput,
  fallbackCreatedAt?: string | Date | null
): SanitizedMediaMetadata {
  const mediaType = input.mediaType === 'video' || input.mediaType === 'image'
    ? input.mediaType
    : inferMediaType(input.contentType, input.fileName);

  const width = sanitizeDimension(input.width);
  const height = sanitizeDimension(input.height);
  const orientation = calculateOrientation(width, height);
  const durationSeconds = mediaType === 'video' ? sanitizeDuration(input.durationSeconds) : null;
  const capturedAt = sanitizeCapturedAt(input.capturedAt, fallbackCreatedAt);

  return {
    capturedAt,
    width,
    height,
    orientation,
    durationSeconds,
    mediaType,
  };
}

/**
 * Constrói o caminho canónico para thumbnail (derivado de baixa resolução).
 * Exemplo: 'jessicasamuelwedding/photos/uuid.jpg' -> 'jessicasamuelwedding/derivatives/thumbnails/uuid.webp'
 */
export function buildThumbnailStoragePath(originalStoragePath: string): string {
  const parts = originalStoragePath.split('/');
  const fileName = parts.pop() ?? '';
  const baseName = fileName.replace(/\.[^/.]+$/, '');
  const prefix = parts.join('/');
  return `${prefix}/derivatives/thumbnails/${baseName}.webp`;
}

/**
 * Constrói o caminho canónico para poster de vídeo.
 * Exemplo: 'jessicasamuelwedding/videos/uuid.mp4' -> 'jessicasamuelwedding/derivatives/posters/uuid.webp'
 */
export function buildPosterStoragePath(originalStoragePath: string): string {
  const parts = originalStoragePath.split('/');
  const fileName = parts.pop() ?? '';
  const baseName = fileName.replace(/\.[^/.]+$/, '');
  const prefix = parts.join('/');
  return `${prefix}/derivatives/posters/${baseName}.webp`;
}

/**
 * Resolve os caminhos de armazenamento para derivados com base no tipo de mídia.
 */
export function resolveDerivativePaths(
  storagePath: string,
  mediaType: MediaType
): { thumbnailPath: string; posterPath: string | null } {
  const thumbnailPath = buildThumbnailStoragePath(storagePath);
  const posterPath = mediaType === 'video' ? buildPosterStoragePath(storagePath) : null;
  return { thumbnailPath, posterPath };
}
