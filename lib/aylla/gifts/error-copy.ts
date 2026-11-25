export type AyllaGiftUiErrorCode =
  | "registry_closed"
  | "verification_required"
  | "rate_limited"
  | "session_expired"
  | "access_denied"
  | "item_unavailable"
  | "quantity_unconfirmed"
  | "service_unavailable"
  | "PROXY_SECRET_MISSING"
  | "CORE_TIMEOUT"
  | "CORE_NETWORK_ERROR";

const ERROR_COPY: Record<string, string> = {
  registry_closed:
    "A lista de presentes da Aylla ainda não se encontra aberta para reservas.",
  verification_required:
    "Não foi possível confirmar o código introduzido. Verifique os dígitos ou peça um novo código.",
  rate_limited:
    "Realizou vários pedidos seguidos. Aguarde alguns instantes antes de tentar novamente.",
  session_expired:
    "A sua sessão de convidado expirou por segurança. Valide novamente o seu contacto para continuar.",
  access_denied:
    "Não foi possível validar o acesso para esta reserva com os dados actuais.",
  item_unavailable:
    "Este mimo acabou de ficar indisponível ou já atingiu o limite de reservas com carinho.",
  quantity_unconfirmed:
    "A quantidade seleccionada ainda não está disponível para reserva.",
  service_unavailable:
    "Estamos com uma breve instabilidade de ligação. O seu convite mantém-se seguro; tente novamente dentro de instantes.",
  PROXY_SECRET_MISSING:
    "O serviço de reservas está temporariamente em manutenção.",
  CORE_TIMEOUT:
    "O servidor demorou mais do que o esperado a responder. Por favor, tente novamente.",
  CORE_NETWORK_ERROR:
    "Não foi possível contactar o serviço de reservas neste momento. Tente novamente dentro de instantes.",
};

export function humanizeAyllaError(code?: string, fallback?: string): string {
  if (code && ERROR_COPY[code]) {
    return ERROR_COPY[code];
  }
  return (
    fallback ||
    "Não foi possível concluir o pedido neste momento. Por favor, tente novamente."
  );
}
