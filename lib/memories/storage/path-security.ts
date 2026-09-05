/**
 * Validação de Segurança de Caminhos de Armazenamento de Memórias
 *
 * Garante que caminhos para objectos seguem o formato canónico:
 * `${slug}/${photoId}/original.${ext}`
 *
 * Rejeita qualquer tentativa de path traversal (../, \, /, segmentos vazios).
 */

const CANONICAL_PATH_REGEX = /^[a-zA-Z0-9_-]+\/[0-9a-fA-F-]{36}\/original\.[a-zA-Z0-9]+$/;

export class InvalidStoragePathError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidStoragePathError";
  }
}

export function assertCanonicalStoragePath(storagePath: string): void {
  if (typeof storagePath !== "string" || !storagePath.trim()) {
    throw new InvalidStoragePathError("Caminho de armazenamento vazio ou inválido.");
  }

  const trimmed = storagePath.trim();

  if (trimmed.includes("..") || trimmed.includes("\\") || trimmed.startsWith("/") || trimmed.endsWith("/")) {
    throw new InvalidStoragePathError("Caminho de armazenamento com tentativa de traversal detectada.");
  }

  if (!CANONICAL_PATH_REGEX.test(trimmed)) {
    throw new InvalidStoragePathError(
      `Caminho de armazenamento não obedece à estrutura canónica: '${trimmed}'`
    );
  }
}
