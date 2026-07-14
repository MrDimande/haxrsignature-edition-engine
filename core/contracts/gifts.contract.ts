type ValidationError = {
  ok: false;
  error: string;
  status: number;
};

type ValidationSuccess = {
  ok: true;
  sanitized: {
    itemId: string;
    guestName: string;
    guestPhone: string;
    quantity: number;
    message?: string;
  };
};

export function validateGiftReservationPayload(
  body: unknown,
  options: { requiresPhone: boolean }
): ValidationError | ValidationSuccess {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Pedido inválido.", status: 400 };
  }

  const record = body as Record<string, unknown>;
  const itemId =
    typeof record.itemId === "string"
      ? record.itemId.trim()
      : typeof record.giftId === "string"
        ? record.giftId.trim()
        : "";
  const guestName =
    typeof record.guestName === "string"
      ? record.guestName.trim()
      : typeof record.reservedBy === "string"
        ? record.reservedBy.trim()
        : "";
  const guestPhone =
    typeof record.guestPhone === "string" ? record.guestPhone.trim() : "";
  const message =
    typeof record.message === "string" ? record.message.trim() : undefined;
  const quantityRaw = record.quantity;
  const quantity =
    quantityRaw === undefined || quantityRaw === null
      ? 1
      : typeof quantityRaw === "number"
        ? quantityRaw
        : Number(quantityRaw);

  if (!itemId) {
    return { ok: false, error: "Seleccione um presente.", status: 400 };
  }

  if (!guestName) {
    return { ok: false, error: "Indique o seu nome.", status: 400 };
  }

  if (guestName.length > 120) {
    return { ok: false, error: "Nome demasiado longo.", status: 400 };
  }

  if (guestPhone.length > 30) {
    return { ok: false, error: "Telefone inválido.", status: 400 };
  }

  if (message && message.length > 280) {
    return { ok: false, error: "Mensagem demasiado longa.", status: 400 };
  }

  if (options.requiresPhone && !guestPhone) {
    return {
      ok: false,
      error: "Indique o seu contacto telefónico.",
      status: 400,
    };
  }

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
    return { ok: false, error: "Quantidade inválida.", status: 400 };
  }

  return {
    ok: true,
    sanitized: {
      itemId: itemId.slice(0, 80),
      guestName: guestName.slice(0, 120),
      guestPhone: guestPhone.slice(0, 30),
      quantity,
      message: message ? message.slice(0, 280) : undefined,
    },
  };
}
