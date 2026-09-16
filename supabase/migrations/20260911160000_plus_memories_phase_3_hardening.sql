-- ==============================================================================
-- HAXR PLUS MEMORIES — FASE 3 HARDENING E INTEGRIDADE POLIMÓRFICA
-- 1. ASSIGNMENT_ID COM INTEGRIDADE COMPOSTA
-- 2. TARGET_ID POLIMÓRFICO COM REGRAS E TRIGGER
-- 3. POLÍTICA DE SUBMISSÃO CONFIGURÁVEL + MÁQUINA DE ESTADOS DE MODERAÇÃO
-- ==============================================================================

-- 1. ASSIGNMENT_ID COM INTEGRIDADE COMPOSTA
-- Adicionar constraint UNIQUE composta em memory_mission_assignments se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_memory_mission_assignments_composite'
  ) THEN
    ALTER TABLE memory_mission_assignments
      ADD CONSTRAINT uq_memory_mission_assignments_composite
      UNIQUE (event_id, experience_id, mission_id, id);
  END IF;
END $$;

-- Adicionar FK composta em memory_mission_submissions(event_id, experience_id, mission_id, assignment_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_mission_subs_assignment'
  ) THEN
    ALTER TABLE memory_mission_submissions
      ADD CONSTRAINT fk_mission_subs_assignment
      FOREIGN KEY (event_id, experience_id, mission_id, assignment_id)
      REFERENCES memory_mission_assignments(event_id, experience_id, mission_id, id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Adicionar constraint UNIQUE composta em memory_participant_scores(event_id, experience_id, participant_id) se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_memory_participant_scores_composite'
  ) THEN
    ALTER TABLE memory_participant_scores
      ADD CONSTRAINT uq_memory_participant_scores_composite
      UNIQUE (event_id, experience_id, participant_id);
  END IF;
END $$;

-- 2. TARGET_ID POLIMÓRFICO: CHECK CONSTRAINT + TRIGGER DE INTEGRIDADE
DO $$
BEGIN
  ALTER TABLE memory_mission_assignments DROP CONSTRAINT IF EXISTS chk_mission_assignment_target;
  ALTER TABLE memory_mission_assignments
    ADD CONSTRAINT chk_mission_assignment_target
    CHECK (
      (target_type = 'general' AND target_id IS NULL) OR
      (target_type IN ('participant', 'guest', 'table') AND (target_id IS NOT NULL OR participant_id IS NOT NULL))
    );
END $$;

-- Trigger para validar target polimórfico de acordo com o tipo
CREATE OR REPLACE FUNCTION trg_check_memory_mission_assignment_target()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uuid uuid;
  v_exists boolean;
BEGIN
  IF NEW.target_type = 'general' THEN
    IF NEW.target_id IS NOT NULL THEN
      RAISE EXCEPTION 'Target ID deve ser nulo para atribuição geral.'
        USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.target_type = 'participant' THEN
    IF NEW.target_id IS NULL AND NEW.participant_id IS NOT NULL THEN
      NEW.target_id := NEW.participant_id::text;
    END IF;
    IF NEW.target_id IS NULL THEN
      RAISE EXCEPTION 'Target ID deve ser especificado para atribuição de participante.'
        USING ERRCODE = 'check_violation';
    END IF;

    BEGIN
      v_uuid := NEW.target_id::uuid;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Target participant % não é um UUID válido.', NEW.target_id
        USING ERRCODE = 'invalid_text_representation';
    END;

    SELECT EXISTS (
      SELECT 1 FROM memory_participants
      WHERE id = v_uuid AND event_id = NEW.event_id AND experience_id = NEW.experience_id
    ) INTO v_exists;

    IF NOT v_exists THEN
      RAISE EXCEPTION 'Target participant % não encontrado para o evento % e experiência %.', NEW.target_id, NEW.event_id, NEW.experience_id
        USING ERRCODE = 'foreign_key_violation';
    END IF;
    NEW.participant_id := v_uuid;

  ELSIF NEW.target_type = 'guest' THEN
    IF NEW.target_id IS NULL THEN
      RAISE EXCEPTION 'Target ID deve ser especificado para atribuição de convidado.'
        USING ERRCODE = 'check_violation';
    END IF;

    BEGIN
      v_uuid := NEW.target_id::uuid;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Target guest % não é um UUID válido.', NEW.target_id
        USING ERRCODE = 'invalid_text_representation';
    END;

    SELECT EXISTS (
      SELECT 1 FROM guests
      WHERE id = v_uuid AND event_id = NEW.event_id AND deleted_at IS NULL
    ) INTO v_exists;

    IF NOT v_exists THEN
      RAISE EXCEPTION 'Target guest % não encontrado para o evento %.', NEW.target_id, NEW.event_id
        USING ERRCODE = 'foreign_key_violation';
    END IF;

  ELSIF NEW.target_type = 'table' THEN
    IF NEW.target_id IS NULL THEN
      RAISE EXCEPTION 'Target ID deve ser especificado para atribuição de mesa.'
        USING ERRCODE = 'check_violation';
    END IF;

    SELECT EXISTS (
      SELECT 1 FROM seats
      WHERE event_id = NEW.event_id AND (table_name = NEW.target_id OR id::text = NEW.target_id)
    ) INTO v_exists;

    IF NOT v_exists THEN
      RAISE EXCEPTION 'Target table % não encontrada para o evento %.', NEW.target_id, NEW.event_id
        USING ERRCODE = 'foreign_key_violation';
    END IF;

  ELSE
    RAISE EXCEPTION 'Tipo de target % desconhecido.', NEW.target_type
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_mission_assignment_target ON memory_mission_assignments;
CREATE TRIGGER trg_validate_mission_assignment_target
  BEFORE INSERT OR UPDATE ON memory_mission_assignments
  FOR EACH ROW
  EXECUTE FUNCTION trg_check_memory_mission_assignment_target();

-- 3. POLÍTICA DE SUBMISSÃO CONFIGURÁVEL NA MISSÃO
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'memory_missions' AND column_name = 'submission_review_policy'
  ) THEN
    ALTER TABLE memory_missions
      ADD COLUMN submission_review_policy varchar(32) NOT NULL DEFAULT 'auto_accept'
      CHECK (submission_review_policy IN ('auto_accept', 'manual_review'));
  END IF;
END $$;

-- Adicionar colunas de auditoria de moderação em memory_mission_submissions se não existirem
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'memory_mission_submissions' AND column_name = 'moderated_by'
  ) THEN
    ALTER TABLE memory_mission_submissions
      ADD COLUMN moderated_by uuid NULL,
      ADD COLUMN moderated_at timestamptz NULL,
      ADD COLUMN rejection_reason text NULL;
  END IF;
END $$;

-- 4. FUNÇÃO TRANSACCIONAL DE MODERAÇÃO E REVERSÃO DE PONTOS
DROP FUNCTION IF EXISTS haxr_moderate_mission_submission(uuid, text, uuid, text);
CREATE OR REPLACE FUNCTION haxr_moderate_mission_submission(
  p_submission_id uuid,
  p_new_status text,
  p_moderated_by uuid DEFAULT NULL,
  p_rejection_reason text DEFAULT NULL
)
RETURNS TABLE (
  submission_id uuid,
  previous_status text,
  new_status text,
  points_delta integer,
  current_participant_points integer,
  current_missions_completed integer,
  is_transition boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_sub record;
  v_mission record;
  v_score record;
  v_points_to_award integer;
  v_points_delta integer := 0;
  v_completed_delta integer := 0;
  v_is_transition boolean := false;
BEGIN
  IF p_new_status NOT IN ('pending', 'accepted', 'rejected') THEN
    RAISE EXCEPTION 'Estado de moderação inválido: %', p_new_status
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  -- 1. Lock da submissão para evitar concorrência
  SELECT * INTO v_sub
  FROM memory_mission_submissions
  WHERE id = p_submission_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submissão de missão % não encontrada.', p_submission_id
      USING ERRCODE = 'no_data_found';
  END IF;

  -- 2. Lock no participante para serializar concorrência de moderação
  PERFORM pg_advisory_xact_lock(hashtext('moderate_submission:' || v_sub.participant_id::text));

  -- 3. Buscar pontos da missão
  SELECT points INTO v_mission
  FROM memory_missions
  WHERE id = v_sub.mission_id;

  v_points_to_award := COALESCE(v_mission.points, 0);

  -- 4. Avaliar transição de estado
  IF v_sub.status = p_new_status THEN
    -- Transição idempotente (mesmo estado)
    v_points_delta := 0;
    v_completed_delta := 0;
    v_is_transition := false;
  ELSIF v_sub.status = 'pending' AND p_new_status = 'accepted' THEN
    -- pending -> accepted (+pontos, +1 missão)
    v_points_delta := v_points_to_award;
    v_completed_delta := 1;
    v_is_transition := true;
  ELSIF v_sub.status = 'accepted' AND p_new_status = 'rejected' THEN
    -- accepted -> rejected (-pontos anteriormente atribuídos, -1 missão)
    v_points_delta := -v_sub.points_awarded;
    v_completed_delta := -1;
    v_is_transition := true;
  ELSIF v_sub.status = 'rejected' AND p_new_status = 'accepted' THEN
    -- rejected -> accepted (+pontos, +1 missão)
    v_points_delta := v_points_to_award;
    v_completed_delta := 1;
    v_is_transition := true;
  ELSIF v_sub.status = 'pending' AND p_new_status = 'rejected' THEN
    -- pending -> rejected (0 pontos, não altera contagem)
    v_points_delta := 0;
    v_completed_delta := 0;
    v_is_transition := true;
  ELSIF v_sub.status = 'rejected' AND p_new_status = 'pending' THEN
    -- rejected -> pending (0 pontos)
    v_points_delta := 0;
    v_completed_delta := 0;
    v_is_transition := true;
  ELSIF v_sub.status = 'accepted' AND p_new_status = 'pending' THEN
    -- accepted -> pending (-pontos, -1 missão)
    v_points_delta := -v_sub.points_awarded;
    v_completed_delta := -1;
    v_is_transition := true;
  END IF;

  -- 5. Actualizar submissão
  UPDATE memory_mission_submissions
  SET
    status = p_new_status,
    points_awarded = CASE WHEN p_new_status = 'accepted' THEN v_points_to_award ELSE 0 END,
    moderated_by = COALESCE(p_moderated_by, moderated_by),
    moderated_at = now(),
    rejection_reason = CASE WHEN p_new_status = 'rejected' THEN COALESCE(p_rejection_reason, rejection_reason) ELSE NULL END,
    updated_at = now()
  WHERE id = p_submission_id;

  -- 6. Actualizar scores do participante se houve alteração
  IF v_points_delta <> 0 OR v_completed_delta <> 0 THEN
    INSERT INTO memory_participant_scores (
      event_id, experience_id, participant_id, total_points, missions_completed, last_awarded_at, updated_at
    ) VALUES (
      v_sub.event_id, v_sub.experience_id, v_sub.participant_id,
      GREATEST(0, v_points_delta), GREATEST(0, v_completed_delta), now(), now()
    )
    ON CONFLICT (participant_id) DO UPDATE
    SET
      total_points = GREATEST(0, memory_participant_scores.total_points + v_points_delta),
      missions_completed = GREATEST(0, memory_participant_scores.missions_completed + v_completed_delta),
      last_awarded_at = CASE WHEN v_points_delta > 0 THEN now() ELSE memory_participant_scores.last_awarded_at END,
      updated_at = now();
  END IF;

  -- 7. Retornar dados actuais do score
  SELECT total_points, missions_completed INTO v_score
  FROM memory_participant_scores
  WHERE participant_id = v_sub.participant_id;

  RETURN QUERY SELECT
    v_sub.id,
    v_sub.status::text,
    p_new_status::text,
    v_points_delta,
    COALESCE(v_score.total_points, 0)::integer,
    COALESCE(v_score.missions_completed, 0)::integer,
    v_is_transition;
END;
$$;

REVOKE ALL ON FUNCTION haxr_moderate_mission_submission(uuid, text, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION haxr_moderate_mission_submission(uuid, text, uuid, text) TO edition_runtime, haxr_edition_runtime, haxrweb_runtime;
