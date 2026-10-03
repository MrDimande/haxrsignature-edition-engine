-- Migration: 20261003120000_edition_blessings.sql
-- Description: Criação da entidade edition_blessings com controle de acesso em menor privilégio (PoLP).
-- Operações de leitura e escrita públicas são mediadas estritamente por funções SECURITY DEFINER.

-- 1. Criar tabela pública para o mural de bênçãos/felicitações
CREATE TABLE IF NOT EXISTS public.edition_blessings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_slug text NOT NULL,
  client_id text NOT NULL,
  author text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'visible',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT edition_blessings_slug_client_id_key UNIQUE (edition_slug, client_id),
  CONSTRAINT edition_blessings_status_check CHECK (status IN ('visible', 'hidden'))
);

-- 2. Índice performante para listagem cronológica do mural
CREATE INDEX IF NOT EXISTS idx_edition_blessings_slug_created
  ON public.edition_blessings (edition_slug, created_at DESC)
  WHERE (status = 'visible');

-- 3. Revogar privilégios directos para roles públicas e runtime (PoLP)
REVOKE ALL ON TABLE public.edition_blessings FROM PUBLIC, edition_runtime, haxr_edition_runtime;

-- 4. Função SECURITY DEFINER para submissão idempotente de felicitações
CREATE OR REPLACE FUNCTION public.submit_edition_blessing(
  p_edition_slug text,
  p_client_id text,
  p_author text,
  p_message text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_slug text := trim(coalesce(p_edition_slug, ''));
  v_client_id text := trim(coalesce(p_client_id, ''));
  v_author text := trim(coalesce(p_author, ''));
  v_message text := trim(coalesce(p_message, ''));
  v_row record;
BEGIN
  -- Validações defensivas básicas no banco
  IF length(v_slug) = 0 OR length(v_slug) > 100 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_slug');
  END IF;

  IF length(v_client_id) = 0 OR length(v_client_id) > 128 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_client_id');
  END IF;

  IF length(v_author) = 0 OR length(v_author) > 100 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_author');
  END IF;

  IF length(v_message) = 0 OR length(v_message) > 1000 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_message');
  END IF;

  -- Tentativa de inserção com tratamento de idempotência
  INSERT INTO public.edition_blessings (
    edition_slug,
    client_id,
    author,
    message,
    status,
    created_at
  )
  VALUES (
    v_slug,
    v_client_id,
    v_author,
    v_message,
    'visible',
    now()
  )
  ON CONFLICT (edition_slug, client_id) DO NOTHING
  RETURNING id, client_id, author, message, created_at
  INTO v_row;

  IF v_row.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'ok', true,
      'persisted', true,
      'duplicate', false,
      'clientId', v_row.client_id,
      'author', v_row.author,
      'message', v_row.message,
      'createdAt', v_row.created_at
    );
  END IF;

  -- Se houve conflito de idempotência, recupera a mensagem existente
  SELECT id, client_id, author, message, created_at
  INTO v_row
  FROM public.edition_blessings
  WHERE edition_slug = v_slug AND client_id = v_client_id
  LIMIT 1;

  IF v_row.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'ok', true,
      'persisted', true,
      'duplicate', true,
      'clientId', v_row.client_id,
      'author', v_row.author,
      'message', v_row.message,
      'createdAt', v_row.created_at
    );
  END IF;

  RETURN jsonb_build_object('ok', false, 'error', 'insert_failed');
END;
$$;

-- 5. Função SECURITY DEFINER para listagem cronológica do mural público
CREATE OR REPLACE FUNCTION public.list_edition_blessings(
  p_edition_slug text,
  p_limit integer DEFAULT 60
) RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT coalesce(jsonb_agg(
    jsonb_build_object(
      'clientId', client_id,
      'author', author,
      'message', message,
      'createdAt', created_at
    ) ORDER BY created_at DESC
  ), '[]'::jsonb)
  FROM (
    SELECT client_id, author, message, created_at
    FROM public.edition_blessings
    WHERE edition_slug = trim(p_edition_slug) AND status = 'visible'
    ORDER BY created_at DESC
    LIMIT least(greatest(coalesce(p_limit, 50), 1), 100)
  ) q;
$$;

-- 6. Hardening de search_path e permissões (Princípio de Menor Privilégio)
REVOKE ALL ON FUNCTION public.submit_edition_blessing(text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_edition_blessings(text, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.submit_edition_blessing(text, text, text, text) TO edition_runtime;
GRANT EXECUTE ON FUNCTION public.list_edition_blessings(text, integer) TO edition_runtime;

GRANT EXECUTE ON FUNCTION public.submit_edition_blessing(text, text, text, text) TO haxr_edition_runtime;
GRANT EXECUTE ON FUNCTION public.list_edition_blessings(text, integer) TO haxr_edition_runtime;
