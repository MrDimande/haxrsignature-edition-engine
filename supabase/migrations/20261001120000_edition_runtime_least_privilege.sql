-- Migration: 20261001120000_edition_runtime_least_privilege.sql
-- Description: Aplicação estrita do Princípio de Menor Privilégio (PoLP) para a role edition_runtime.
-- Elimina grants globais em tabelas e funções, mantendo apenas:
-- 1. USAGE no schema public.
-- 2. Hardening e EXECUTE estritamente na função SECURITY DEFINER submit_edition_rsvp (sem PUBLIC EXECUTE).
-- 3. SELECT na tabela public.guests (necessário para verificação prévia de identidade/idempotência com RLS).
-- 4. Funções e tabelas indispensáveis ao runtime Edition (rate limiting, reservas de presentes, fotos de memórias).

-- 1. Revogar grants globais herdados ou concedidos previamente
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM edition_runtime;
REVOKE ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public FROM edition_runtime;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM edition_runtime;

-- 2. Revogar privilégios default automáticos para novos objetos criados no schema public
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM edition_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM edition_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM edition_runtime;

-- 3. Conceder USAGE no schema public
GRANT USAGE ON SCHEMA public TO edition_runtime;

-- 4. Hardening de search_path na função SECURITY DEFINER submit_edition_rsvp
ALTER FUNCTION public.submit_edition_rsvp(
  p_event_id uuid,
  p_name text,
  p_name_normalized text,
  p_attending boolean,
  p_party_size integer,
  p_edition_slug text,
  p_email text,
  p_phone text,
  p_message_for_bride text,
  p_size text,
  p_dress_code_confirmed boolean
) SET search_path = public, pg_temp;

-- 5. Revogar EXECUTE de PUBLIC para a procedure SECURITY DEFINER submit_edition_rsvp
REVOKE ALL ON FUNCTION public.submit_edition_rsvp(
  p_event_id uuid,
  p_name text,
  p_name_normalized text,
  p_attending boolean,
  p_party_size integer,
  p_edition_slug text,
  p_email text,
  p_phone text,
  p_message_for_bride text,
  p_size text,
  p_dress_code_confirmed boolean
) FROM PUBLIC;

-- 6. Conceder EXECUTE especificamente à role edition_runtime com a assinatura canónica exata de 11 argumentos
GRANT EXECUTE ON FUNCTION public.submit_edition_rsvp(
  p_event_id uuid,
  p_name text,
  p_name_normalized text,
  p_attending boolean,
  p_party_size integer,
  p_edition_slug text,
  p_email text,
  p_phone text,
  p_message_for_bride text,
  p_size text,
  p_dress_code_confirmed boolean
) TO edition_runtime;

-- 7. Conceder SELECT na tabela guests para resolução de identidade/idempotência antes do RPC
GRANT SELECT ON TABLE public.guests TO edition_runtime;

-- 8. Conceder privilégios mínimos necessários para outras funcionalidades autorizadas do runtime Edition
-- Rate limiting (função SECURITY DEFINER)
GRANT EXECUTE ON FUNCTION public.check_api_rate_limit(
  p_bucket_key text,
  p_max_requests integer,
  p_window_seconds integer
) TO edition_runtime;

-- Reservas de presentes (função SECURITY DEFINER + leitura da tabela)
GRANT EXECUTE ON FUNCTION public.reserve_edition_gift(
  p_registry_key text,
  p_gift_id text,
  p_reserved_by text,
  p_gift_name text
) TO edition_runtime;
GRANT SELECT ON TABLE public.edition_gift_reservations TO edition_runtime;

-- Galeria de memórias / uploads fotográficos do casamento (SELECT, INSERT, UPDATE estritos, sem DELETE)
GRANT SELECT, INSERT, UPDATE ON TABLE public.wedding_photos TO edition_runtime;
GRANT SELECT, INSERT, UPDATE ON TABLE public.photo_upload_intents TO edition_runtime;

-- 9. Eliminação estrita de DELETE em photo_upload_intents (PoLP: nenhum fluxo do runtime necessita de remoção física de intents)
REVOKE DELETE ON TABLE public.photo_upload_intents FROM haxr_edition_runtime;
REVOKE DELETE ON TABLE public.photo_upload_intents FROM edition_runtime;

-- 10. Associação à role de grupo haxr_edition_runtime para herança das políticas de isolamento RLS
GRANT haxr_edition_runtime TO edition_runtime;

