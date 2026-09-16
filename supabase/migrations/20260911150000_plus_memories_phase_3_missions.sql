-- ==============================================================================
-- HAXR PLUS MEMORIES — FASE 3: MISSION ENGINE 2.0 + ATRIBUIÇÃO + PONTUAÇÃO + RANKING
--
-- Objectivos:
-- 1. Micro-hardening de haxr_current_participant_id() com search_path seguro e revogação de PUBLIC.
-- 2. Tabela memory_missions: catálogo configurável por evento e experiência.
-- 3. Tabela memory_mission_assignments: atribuição por participante, convidado, mesa ou geral.
-- 4. Tabela memory_mission_submissions: vínculo da submissão com media core (wedding_photos) e pontuação idempotente.
-- 5. Tabela memory_participant_scores: ranking e pontuação agregada server-side para os Exploradores.
-- 6. Integridade relacional cross-event e cross-experience enforçada pelo PostgreSQL.
-- 7. RLS granular por papéis runtime (edition_runtime, haxr_edition_runtime, haxrweb_runtime).
-- ==============================================================================

-- 0. Micro-hardening de haxr_current_participant_id()
CREATE OR REPLACE FUNCTION haxr_current_participant_id() RETURNS uuid AS $$
BEGIN
  RETURN NULLIF(current_setting('haxr.current_participant_id', true), '')::uuid;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION haxr_current_participant_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION haxr_current_participant_id() TO edition_runtime, haxr_edition_runtime, haxrweb_runtime;

-- 1. Tabela memory_missions
CREATE TABLE IF NOT EXISTS memory_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  experience_id uuid NOT NULL REFERENCES memory_experiences(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'general',
  difficulty text NOT NULL DEFAULT 'medium',
  points integer NOT NULL DEFAULT 100 CHECK (points > 0 AND points <= 10000),
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  stage_id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  required_media_type text NOT NULL DEFAULT 'any' CHECK (required_media_type IN ('any', 'image', 'video')),
  max_submissions_per_participant integer NOT NULL DEFAULT 1 CHECK (max_submissions_per_participant >= 1),
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT memory_missions_time_window_check CHECK (starts_at IS NULL OR ends_at IS NULL OR starts_at < ends_at),
  CONSTRAINT memory_missions_experience_slug_key UNIQUE (experience_id, slug),
  CONSTRAINT memory_missions_composite_identity_key UNIQUE (id, event_id, experience_id),
  CONSTRAINT memory_missions_stage_event_experience_fkey
    FOREIGN KEY (stage_id, event_id, experience_id)
    REFERENCES memory_stages(id, event_id, experience_id)
    ON DELETE SET NULL,
  CONSTRAINT memory_missions_experience_event_fkey
    FOREIGN KEY (experience_id, event_id)
    REFERENCES memory_experiences(id, event_id)
    ON DELETE CASCADE
);

-- 2. Tabela memory_mission_assignments
CREATE TABLE IF NOT EXISTS memory_mission_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  experience_id uuid NOT NULL REFERENCES memory_experiences(id) ON DELETE CASCADE,
  mission_id uuid NOT NULL,
  target_type text NOT NULL DEFAULT 'general' CHECK (target_type IN ('general', 'participant', 'guest', 'table')),
  target_id text,
  participant_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT memory_mission_assignments_composite_identity_key UNIQUE (id, event_id, experience_id),
  CONSTRAINT memory_mission_assignments_mission_target_key UNIQUE (mission_id, target_type, target_id),
  CONSTRAINT memory_mission_assignments_mission_fkey
    FOREIGN KEY (mission_id, event_id, experience_id)
    REFERENCES memory_missions(id, event_id, experience_id)
    ON DELETE CASCADE,
  CONSTRAINT memory_mission_assignments_participant_fkey
    FOREIGN KEY (participant_id, event_id, experience_id)
    REFERENCES memory_participants(id, event_id, experience_id)
    ON DELETE CASCADE,
  CONSTRAINT memory_mission_assignments_experience_event_fkey
    FOREIGN KEY (experience_id, event_id)
    REFERENCES memory_experiences(id, event_id)
    ON DELETE CASCADE
);

-- 3. Tabela memory_mission_submissions
CREATE TABLE IF NOT EXISTS memory_mission_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  experience_id uuid NOT NULL REFERENCES memory_experiences(id) ON DELETE CASCADE,
  mission_id uuid NOT NULL,
  assignment_id uuid,
  participant_id uuid NOT NULL,
  media_id uuid NOT NULL,
  points_awarded integer NOT NULL DEFAULT 0 CHECK (points_awarded >= 0),
  status text NOT NULL DEFAULT 'accepted' CHECK (status IN ('accepted', 'pending', 'rejected')),
  moderation_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT memory_mission_submissions_composite_identity_key UNIQUE (id, event_id, experience_id),
  CONSTRAINT memory_mission_submissions_mission_media_key UNIQUE (mission_id, media_id),
  CONSTRAINT memory_mission_submissions_mission_fkey
    FOREIGN KEY (mission_id, event_id, experience_id)
    REFERENCES memory_missions(id, event_id, experience_id)
    ON DELETE CASCADE,
  CONSTRAINT memory_mission_submissions_assignment_fkey
    FOREIGN KEY (assignment_id, event_id, experience_id)
    REFERENCES memory_mission_assignments(id, event_id, experience_id)
    ON DELETE SET NULL,
  CONSTRAINT memory_mission_submissions_participant_fkey
    FOREIGN KEY (participant_id, event_id, experience_id)
    REFERENCES memory_participants(id, event_id, experience_id)
    ON DELETE CASCADE,
  CONSTRAINT memory_mission_submissions_media_fkey
    FOREIGN KEY (media_id, event_id, experience_id)
    REFERENCES wedding_photos(id, event_id, experience_id)
    ON DELETE CASCADE,
  CONSTRAINT memory_mission_submissions_experience_event_fkey
    FOREIGN KEY (experience_id, event_id)
    REFERENCES memory_experiences(id, event_id)
    ON DELETE CASCADE
);

-- 4. Tabela memory_participant_scores
CREATE TABLE IF NOT EXISTS memory_participant_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  experience_id uuid NOT NULL REFERENCES memory_experiences(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL,
  total_points integer NOT NULL DEFAULT 0 CHECK (total_points >= 0),
  missions_completed integer NOT NULL DEFAULT 0 CHECK (missions_completed >= 0),
  last_awarded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT memory_participant_scores_participant_key UNIQUE (participant_id),
  CONSTRAINT memory_participant_scores_participant_fkey
    FOREIGN KEY (participant_id, event_id, experience_id)
    REFERENCES memory_participants(id, event_id, experience_id)
    ON DELETE CASCADE,
  CONSTRAINT memory_participant_scores_experience_event_fkey
    FOREIGN KEY (experience_id, event_id)
    REFERENCES memory_experiences(id, event_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS memory_participant_scores_leaderboard_idx
  ON memory_participant_scores (experience_id, total_points DESC, last_awarded_at ASC);

-- 5. Permissões e RLS
GRANT SELECT ON memory_missions TO edition_runtime, haxr_edition_runtime, haxrweb_runtime;
GRANT ALL ON memory_missions TO haxrweb_runtime;
ALTER TABLE memory_missions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS memory_missions_read_policy ON memory_missions;
CREATE POLICY memory_missions_read_policy
  ON memory_missions
  FOR SELECT
  TO edition_runtime, haxr_edition_runtime, haxrweb_runtime
  USING (is_active = true OR CURRENT_USER = 'haxrweb_runtime');

DROP POLICY IF EXISTS memory_missions_admin_write_policy ON memory_missions;
CREATE POLICY memory_missions_admin_write_policy
  ON memory_missions
  FOR ALL
  TO haxrweb_runtime
  USING (true)
  WITH CHECK (true);

GRANT SELECT ON memory_mission_assignments TO edition_runtime, haxr_edition_runtime, haxrweb_runtime;
GRANT ALL ON memory_mission_assignments TO haxrweb_runtime;
ALTER TABLE memory_mission_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS memory_mission_assignments_read_policy ON memory_mission_assignments;
CREATE POLICY memory_mission_assignments_read_policy
  ON memory_mission_assignments
  FOR SELECT
  TO edition_runtime, haxr_edition_runtime, haxrweb_runtime
  USING (is_active = true OR CURRENT_USER = 'haxrweb_runtime');

DROP POLICY IF EXISTS memory_mission_assignments_admin_write_policy ON memory_mission_assignments;
CREATE POLICY memory_mission_assignments_admin_write_policy
  ON memory_mission_assignments
  FOR ALL
  TO haxrweb_runtime
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON memory_mission_submissions TO edition_runtime, haxr_edition_runtime;
GRANT ALL ON memory_mission_submissions TO haxrweb_runtime;
ALTER TABLE memory_mission_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS memory_mission_submissions_admin_policy ON memory_mission_submissions;
CREATE POLICY memory_mission_submissions_admin_policy
  ON memory_mission_submissions
  FOR ALL
  TO haxrweb_runtime
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS memory_mission_submissions_guest_select_policy ON memory_mission_submissions;
CREATE POLICY memory_mission_submissions_guest_select_policy
  ON memory_mission_submissions
  FOR SELECT
  TO edition_runtime, haxr_edition_runtime
  USING (participant_id = haxr_current_participant_id());

DROP POLICY IF EXISTS memory_mission_submissions_guest_insert_policy ON memory_mission_submissions;
CREATE POLICY memory_mission_submissions_guest_insert_policy
  ON memory_mission_submissions
  FOR INSERT
  TO edition_runtime, haxr_edition_runtime
  WITH CHECK (participant_id = haxr_current_participant_id());

DROP POLICY IF EXISTS memory_mission_submissions_guest_update_policy ON memory_mission_submissions;
CREATE POLICY memory_mission_submissions_guest_update_policy
  ON memory_mission_submissions
  FOR UPDATE
  TO edition_runtime, haxr_edition_runtime
  USING (participant_id = haxr_current_participant_id())
  WITH CHECK (participant_id = haxr_current_participant_id());

GRANT SELECT, INSERT, UPDATE ON memory_participant_scores TO edition_runtime, haxr_edition_runtime;
GRANT ALL ON memory_participant_scores TO haxrweb_runtime;
ALTER TABLE memory_participant_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS memory_participant_scores_admin_policy ON memory_participant_scores;
CREATE POLICY memory_participant_scores_admin_policy
  ON memory_participant_scores
  FOR ALL
  TO haxrweb_runtime
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS memory_participant_scores_guest_select_policy ON memory_participant_scores;
CREATE POLICY memory_participant_scores_guest_select_policy
  ON memory_participant_scores
  FOR SELECT
  TO edition_runtime, haxr_edition_runtime
  USING (true);

DROP POLICY IF EXISTS memory_participant_scores_guest_write_policy ON memory_participant_scores;
CREATE POLICY memory_participant_scores_guest_write_policy
  ON memory_participant_scores
  FOR ALL
  TO edition_runtime, haxr_edition_runtime
  USING (participant_id = haxr_current_participant_id())
  WITH CHECK (participant_id = haxr_current_participant_id());
