export interface ValidatedBlessingInput {
  slug: string;
  clientId: string;
  author: string;
  message: string;
  isHoneypot: boolean;
}

export type ValidationResult =
  | { valid: true; data: ValidatedBlessingInput }
  | { valid: false; error: string };

const ALLOWED_SLUGS = new Set([
  "neidyejosewedding",
]);

export function validateBlessingPayload(raw: unknown): ValidationResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { valid: false, error: "Payload inválido." };
  }

  const payload = raw as Record<string, unknown>;

  // 1. Honeypot check
  const honeypot = typeof payload.honeypot === "string" ? payload.honeypot.trim() : "";
  if (honeypot.length > 0) {
    return {
      valid: true,
      data: {
        slug: "",
        clientId: "",
        author: "",
        message: "",
        isHoneypot: true,
      },
    };
  }

  // 2. Slug
  const rawSlug =
    typeof payload.slug === "string"
      ? payload.slug
      : typeof payload.editionSlug === "string"
      ? payload.editionSlug
      : "";
  const slug = rawSlug.trim().toLowerCase();
  if (!slug) {
    return { valid: false, error: "O slug do evento é obrigatório." };
  }
  if (!ALLOWED_SLUGS.has(slug)) {
    return { valid: false, error: "Convite não autorizado para mural de felicitações." };
  }

  // 3. Client ID (idempotency key)
  const clientId = typeof payload.clientId === "string" ? payload.clientId.trim() : "";
  if (!clientId || clientId.length > 128) {
    return { valid: false, error: "Identificador de mensagem inválido." };
  }
  // Sanitize null bytes
  if (clientId.includes("\0")) {
    return { valid: false, error: "Identificador contém caracteres inválidos." };
  }

  // 4. Author (1 - 80 chars)
  const author = typeof payload.author === "string" ? payload.author.trim() : "";
  if (!author) {
    return { valid: false, error: "Por favor, indique quem assina a mensagem." };
  }
  if (author.length > 80) {
    return { valid: false, error: "O nome não pode exceder 80 caracteres." };
  }
  if (author.includes("\0")) {
    return { valid: false, error: "Nome contém caracteres inválidos." };
  }

  // 5. Message (1 - 600 chars)
  const message = typeof payload.message === "string" ? payload.message.trim() : "";
  if (!message) {
    return { valid: false, error: "A mensagem não pode estar vazia." };
  }
  if (message.length > 600) {
    return { valid: false, error: "A mensagem não pode exceder 600 caracteres." };
  }
  if (message.includes("\0")) {
    return { valid: false, error: "Mensagem contém caracteres inválidos." };
  }

  return {
    valid: true,
    data: {
      slug,
      clientId,
      author,
      message,
      isHoneypot: false,
    },
  };
}
