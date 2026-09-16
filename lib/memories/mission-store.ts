import { getNeonPool } from "@lib/db/neon-client";
import { resolveMemoriesConfig } from "./config";
import { resolveMemoriesEvent } from "./session-store";

export interface MemoryMission {
  id: string;
  eventId: string;
  experienceId: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  points: number;
  isActive: boolean;
  sortOrder: number;
  stageId: string | null;
  startsAt: string | null;
  endsAt: string | null;
  requiredMediaType: 'any' | 'image' | 'video';
  maxSubmissionsPerParticipant: number;
  submissionReviewPolicy?: 'auto_accept' | 'manual_review';
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface MissionWithStatus extends MemoryMission {
  isCompleted: boolean;
  submissionsCount: number;
  lastSubmittedMediaId: string | null;
  assignmentType: 'general' | 'participant' | 'guest' | 'table';
}

export interface SubmitMissionInput {
  slug: string;
  missionId: string;
  mediaId: string;
  participantId: string;
  tableId?: string | null;
}

export interface SubmitMissionResult {
  success: boolean;
  error?: string;
  submissionId?: string;
  pointsAwarded?: number;
  totalPoints?: number;
}

export interface ExplorerRankEntry {
  rank: number;
  participantId: string;
  displayName: string;
  points: number;
  missionsCompleted: number;
  lastAwardedAt: string | null;
}

/**
 * Lista as missões disponíveis para um participante ou convidado,
 * incluindo o seu estado de conclusão e quantidade de submissões.
 */
export async function listMissionsForParticipant(
  slug: string,
  participantId?: string | null,
  tableId?: string | null
): Promise<{ success: boolean; missions: MissionWithStatus[]; error?: string }> {
  const eventInfo = await resolveMemoriesEvent(slug);
  if (!eventInfo) {
    return { success: false, missions: [], error: "Evento não encontrado." };
  }

  const pool = getNeonPool();

  const query = `
    SELECT
      m.id,
      m.event_id,
      m.experience_id,
      m.slug,
      m.title,
      m.description,
      m.category,
      m.difficulty,
      m.points,
      m.is_active,
      m.sort_order,
      m.stage_id,
      m.starts_at,
      m.ends_at,
      m.required_media_type,
      m.max_submissions_per_participant,
      m.config,
      m.created_at,
      m.updated_at,
      COALESCE(a.target_type, 'general') as assignment_type,
      COUNT(s.id)::int as submissions_count,
      MAX(s.media_id::text) as last_media_id
    FROM memory_missions m
    LEFT JOIN memory_mission_assignments a ON a.mission_id = m.id
      AND a.is_active = true
      AND (
        a.target_type = 'general'
        OR (a.target_type = 'participant' AND a.participant_id = $2)
        OR (a.target_type = 'table' AND a.target_id = $3)
      )
    LEFT JOIN memory_mission_submissions s ON s.mission_id = m.id
      AND s.participant_id = $2
      AND s.status = 'accepted'
    WHERE m.experience_id = $1
      AND m.is_active = true
      AND (m.starts_at IS NULL OR m.starts_at <= now())
      AND (m.ends_at IS NULL OR m.ends_at >= now())
    GROUP BY m.id, a.target_type
    ORDER BY m.sort_order ASC, m.created_at ASC;
  `;

  try {
    const res = await pool.query(query, [
      eventInfo.experienceId,
      participantId || null,
      tableId || null,
    ]);

    const missions: MissionWithStatus[] = res.rows.map((row) => {
      const submissionsCount = Number(row.submissions_count || 0);
      const maxSubmissions = Number(row.max_submissions_per_participant || 1);
      return {
        id: row.id,
        eventId: row.event_id,
        experienceId: row.experience_id,
        slug: row.slug,
        title: row.title,
        description: row.description,
        category: row.category,
        difficulty: row.difficulty,
        points: Number(row.points),
        isActive: Boolean(row.is_active),
        sortOrder: Number(row.sort_order),
        stageId: row.stage_id,
        startsAt: row.starts_at ? new Date(row.starts_at).toISOString() : null,
        endsAt: row.ends_at ? new Date(row.ends_at).toISOString() : null,
        requiredMediaType: row.required_media_type,
        maxSubmissionsPerParticipant: maxSubmissions,
        config: row.config || {},
        createdAt: new Date(row.created_at).toISOString(),
        updatedAt: new Date(row.updated_at).toISOString(),
        isCompleted: submissionsCount >= maxSubmissions,
        submissionsCount,
        lastSubmittedMediaId: row.last_media_id || null,
        assignmentType: row.assignment_type as any,
      };
    });

    return { success: true, missions };
  } catch (err: any) {
    console.error("[listMissionsForParticipant] Erro ao consultar missões:", err.message);
    return { success: false, missions: [], error: err.message };
  }
}

/**
 * Submete uma fotografia/vídeo do Media Core para uma missão.
 * Executa todas as validações de autorização, anti-duplicação, idempotência e pontuação server-side.
 */
export async function submitMissionPhoto(
  input: SubmitMissionInput
): Promise<SubmitMissionResult> {
  const eventInfo = await resolveMemoriesEvent(input.slug);
  if (!eventInfo) {
    return { success: false, error: "Evento não encontrado." };
  }

  const pool = getNeonPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN;");
    // Contexto de segurança RLS para a transacção actual
    await client.query("SELECT set_config('haxr.current_participant_id', $1, true);", [
      input.participantId,
    ]);
    // Serialização atómica por participante para prevenir deadlocks e concorrência descontrolada
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1));", [
      `submit_mission:${input.participantId}`,
    ]);

    // 0. Assegurar que o participante existe em memory_participants para satisfazer a integridade relacional
    await client.query(
      `
      INSERT INTO memory_participants (id, event_id, experience_id, display_name)
      VALUES ($1, $2, $3, 'Convidado')
      ON CONFLICT (id) DO NOTHING;
      `,
      [input.participantId, eventInfo.id, eventInfo.experienceId]
    );

    // 1. Obter e bloquear a missão para validação consistente (suporta UUID ou slug)
    const missionRes = await client.query(
      `
      SELECT
        id, event_id, experience_id, slug, points, is_active,
        starts_at, ends_at, required_media_type, max_submissions_per_participant,
        submission_review_policy
      FROM memory_missions
      WHERE (id::text = $1 OR slug = $1) AND experience_id = $2
      FOR SHARE;
      `,
      [input.missionId, eventInfo.experienceId]
    );

    if (missionRes.rows.length === 0) {
      await client.query("ROLLBACK;");
      return { success: false, error: "Missão não encontrada ou indisponível." };
    }

    const mission = missionRes.rows[0];
    if (!mission.is_active) {
      await client.query("ROLLBACK;");
      return { success: false, error: "Esta missão não se encontra activa." };
    }

    // 2. Validar a mídia em wedding_photos antes da validação temporal
    const photoRes = await client.query(
      `
      SELECT id, event_id, experience_id, participant_id, media_type, moderation_status, created_at
      FROM wedding_photos
      WHERE id = $1 AND experience_id = $2
      FOR SHARE;
      `,
      [input.mediaId, eventInfo.experienceId]
    );

    if (photoRes.rows.length === 0) {
      await client.query("ROLLBACK;");
      return { success: false, error: "Ficheiro de mídia não encontrado para esta experiência." };
    }

    const photo = photoRes.rows[0];

    // Semântica Temporal Durável e Server-Authoritative (Fase 6 Boundary):
    // A validação temporal apoia-se estritamente no timestamp server-side photo.created_at da foto concluída,
    // garantindo que:
    // - Caso A: Upload que permaneceu offline até depois de ends_at -> criado no servidor após ends_at -> 0 pontos.
    // - Caso B: Upload concluído no servidor antes de ends_at, mas processo caiu antes de submitMissionPhoto
    //           e sofreu replay após ends_at -> photo.created_at <= ends_at -> submissão aceite honestamente.
    // Nunca confiar em capturedAt fornecido pelo browser.
    const effectiveSubmissionTime = photo.created_at ? new Date(photo.created_at) : new Date();

    if (mission.starts_at && new Date(mission.starts_at) > effectiveSubmissionTime) {
      await client.query("ROLLBACK;");
      return { success: false, error: "Esta missão ainda não começou." };
    }
    if (mission.ends_at && new Date(mission.ends_at) < effectiveSubmissionTime) {
      await client.query("ROLLBACK;");
      return { success: false, error: "Esta missão já terminou." };
    }

    // 3. Verificar elegibilidade de assignment
    const assignRes = await client.query(
      `
      SELECT id, target_type, participant_id
      FROM memory_mission_assignments
      WHERE mission_id = $1
        AND is_active = true
        AND (
          target_type = 'general'
          OR (target_type = 'participant' AND participant_id = $2)
          OR (target_type = 'table' AND target_id = $3)
        )
      LIMIT 1;
      `,
      [mission.id, input.participantId, input.tableId || null]
    );

    let assignmentId: string | null = null;
    if (assignRes.rows.length > 0) {
      assignmentId = assignRes.rows[0].id;
    } else {
      // Se houver assignments restritivos que não incluem este participante, rejeitar
      const anyAssign = await client.query(
        "SELECT count(*) as count FROM memory_mission_assignments WHERE mission_id = $1;",
        [mission.id]
      );
      if (Number(anyAssign.rows[0].count) > 0) {
        await client.query("ROLLBACK;");
        return { success: false, error: "Não está elegível para participar nesta missão." };
      }
    }

    // Verificar se o media foi enviado pelo participante
    if (photo.participant_id && photo.participant_id !== input.participantId) {
      await client.query("ROLLBACK;");
      return { success: false, error: "Apenas pode submeter mídias capturadas por si." };
    }

    // Verificar o tipo de mídia exigido
    if (mission.required_media_type !== 'any') {
      const pType = photo.media_type === 'video' ? 'video' : 'image';
      if (pType !== mission.required_media_type) {
        await client.query("ROLLBACK;");
        return {
          success: false,
          error: `Esta missão exige um ficheiro do tipo ${mission.required_media_type}.`,
        };
      }
    }

    // 4. Anti-duplicação e idempotência: verificar se esta mídia já foi submetida para esta missão
    const existingSubmission = await client.query(
      `
      SELECT id, points_awarded, status
      FROM memory_mission_submissions
      WHERE mission_id = $1 AND media_id = $2;
      `,
      [mission.id, photo.id]
    );

    if (existingSubmission.rows.length > 0) {
      // Replay idempotente: devolve os dados sem duplicar pontuação
      const sub = existingSubmission.rows[0];
      const scoreRes = await client.query(
        "SELECT total_points FROM memory_participant_scores WHERE participant_id = $1;",
        [input.participantId]
      );
      await client.query("COMMIT;");
      return {
        success: true,
        submissionId: sub.id,
        pointsAwarded: Number(sub.points_awarded),
        totalPoints: Number(scoreRes.rows[0]?.total_points || 0),
      };
    }

    // 5. Verificar limite de submissões por participante
    const currentSubs = await client.query(
      `
      SELECT count(*) as count
      FROM memory_mission_submissions
      WHERE mission_id = $1 AND participant_id = $2 AND status = 'accepted';
      `,
      [mission.id, input.participantId]
    );

    if (Number(currentSubs.rows[0].count) >= Number(mission.max_submissions_per_participant)) {
      await client.query("ROLLBACK;");
      return {
        success: false,
        error: "Atingiu o número máximo de submissões permitidas para esta missão.",
      };
    }

    // 6. Determinar status de aprovação e pontuação server-side.
    // A moderação global controla o ciclo de vida do conteúdo, não a política
    // explícita de revisão desta missão. Uma missão auto_accept pode mais tarde
    // ter a sua pontuação revertida pela transição autoritativa de moderação.
    const isManualReview = mission.submission_review_policy === 'manual_review';
    const submissionStatus = isManualReview ? 'pending' : 'accepted';
    const pointsToAward = submissionStatus === 'accepted' ? Number(mission.points) : 0;

    // 7. Inserir a submissão com protecção contra colisão concorrente
    const insertSub = await client.query(
      `
      INSERT INTO memory_mission_submissions (
        event_id,
        experience_id,
        mission_id,
        assignment_id,
        participant_id,
        media_id,
        points_awarded,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (mission_id, media_id)
      DO UPDATE SET updated_at = memory_mission_submissions.updated_at
      RETURNING id, points_awarded, (xmax = 0) AS was_inserted;
      `,
      [
        eventInfo.id,
        eventInfo.experienceId,
        mission.id,
        assignmentId,
        input.participantId,
        photo.id,
        pointsToAward,
        submissionStatus,
      ]
    );

    const submissionRow = insertSub.rows[0];
    const submissionId = submissionRow.id;
    const wasInserted = Boolean(submissionRow.was_inserted);

    // Se colidiu concorrentemente (outro processo inseriu primeiro), não duplica pontuação
    if (!wasInserted) {
      const scoreRes = await client.query(
        "SELECT total_points FROM memory_participant_scores WHERE participant_id = $1;",
        [input.participantId]
      );
      await client.query("COMMIT;");
      return {
        success: true,
        submissionId,
        pointsAwarded: Number(submissionRow.points_awarded),
        totalPoints: Number(scoreRes.rows[0]?.total_points || 0),
      };
    }

    // 8. Actualizar wedding_photos.challenge_id para retrocompatibilidade
    await client.query(
      `
      UPDATE wedding_photos
      SET challenge_id = $1
      WHERE id = $2 AND challenge_id IS NULL;
      `,
      [mission.slug, photo.id]
    );

    // 9. Actualizar pontuação agregada se for aprovada imediatamente
    let newTotalPoints = 0;
    if (submissionStatus === 'accepted' && pointsToAward > 0) {
      const scoreUpsert = await client.query(
        `
        INSERT INTO memory_participant_scores (
          event_id,
          experience_id,
          participant_id,
          total_points,
          missions_completed,
          last_awarded_at
        ) VALUES ($1, $2, $3, $4, 1, now())
        ON CONFLICT (participant_id)
        DO UPDATE SET
          total_points = memory_participant_scores.total_points + EXCLUDED.total_points,
          missions_completed = memory_participant_scores.missions_completed + 1,
          last_awarded_at = now(),
          updated_at = now()
        RETURNING total_points;
        `,
        [eventInfo.id, eventInfo.experienceId, input.participantId, pointsToAward]
      );
      newTotalPoints = Number(scoreUpsert.rows[0].total_points);
    }

    await client.query("COMMIT;");

    return {
      success: true,
      submissionId,
      pointsAwarded: pointsToAward,
      totalPoints: newTotalPoints,
    };
  } catch (err: any) {
    await client.query("ROLLBACK;").catch(() => {});
    console.error("[submitMissionPhoto] Erro ao submeter missão:", err.message);
    return { success: false, error: err.message };
  } finally {
    client.release();
  }
}

/**
 * Obtém a tabela de classificação oficial (Exploradores) para a experiência.
 * Ordenação determinística: total_points DESC, last_awarded_at ASC, participant_id ASC.
 */
export async function listExplorersLeaderboard(
  slug: string
): Promise<{ success: boolean; leaderboard: ExplorerRankEntry[]; error?: string }> {
  const eventInfo = await resolveMemoriesEvent(slug);
  if (!eventInfo) {
    return { success: false, leaderboard: [], error: "Evento não encontrado." };
  }

  const config = resolveMemoriesConfig(slug);
  if (config && config.competition?.enabled === false) {
    return { success: false, leaderboard: [], error: "Competição não activada para este evento." };
  }

  const pool = getNeonPool();

  const query = `
    SELECT
      s.participant_id,
      s.total_points,
      s.missions_completed,
      s.last_awarded_at,
      COALESCE(p.display_name, g.name, 'Convidado') as display_name
    FROM memory_participant_scores s
    JOIN memory_participants p ON p.id = s.participant_id
    LEFT JOIN guests g ON g.id = p.guest_id
    WHERE s.experience_id = $1 AND s.total_points > 0
    ORDER BY s.total_points DESC, s.last_awarded_at ASC, s.participant_id ASC
    LIMIT 100;
  `;

  try {
    const res = await pool.query(query, [eventInfo.experienceId]);

    const leaderboard: ExplorerRankEntry[] = res.rows.map((row, index) => ({
      rank: index + 1,
      participantId: row.participant_id,
      displayName: row.display_name,
      points: Number(row.total_points),
      missionsCompleted: Number(row.missions_completed),
      lastAwardedAt: row.last_awarded_at ? new Date(row.last_awarded_at).toISOString() : null,
    }));

    return { success: true, leaderboard };
  } catch (err: any) {
    console.error("[listExplorersLeaderboard] Erro ao consultar ranking:", err.message);
    return { success: false, leaderboard: [], error: err.message };
  }
}

export interface ModerateMissionSubmissionInput {
  submissionId: string;
  newStatus: 'pending' | 'accepted' | 'rejected';
  moderatedBy?: string | null;
  rejectionReason?: string | null;
}

export interface ModerateMissionSubmissionOutput {
  success: boolean;
  submissionId?: string;
  previousStatus?: string;
  newStatus?: string;
  pointsDelta?: number;
  currentParticipantPoints?: number;
  currentMissionsCompleted?: number;
  isTransition?: boolean;
  error?: string;
}

/**
 * Transição de estado de moderação de uma submissão com cálculo e reversão
 * de pontuação estritamente server-side e serializada por participante.
 */
export async function moderateMissionSubmission(
  input: ModerateMissionSubmissionInput
): Promise<ModerateMissionSubmissionOutput> {
  const pool = getNeonPool();
  try {
    const res = await pool.query(
      `SELECT * FROM haxr_moderate_mission_submission($1, $2, $3, $4);`,
      [
        input.submissionId,
        input.newStatus,
        input.moderatedBy || null,
        input.rejectionReason || null,
      ]
    );

    if (res.rows.length === 0) {
      return { success: false, error: "Transição de moderação não retornou dados." };
    }

    const row = res.rows[0];
    return {
      success: true,
      submissionId: row.submission_id,
      previousStatus: row.previous_status,
      newStatus: row.new_status,
      pointsDelta: Number(row.points_delta),
      currentParticipantPoints: Number(row.current_participant_points),
      currentMissionsCompleted: Number(row.current_missions_completed),
      isTransition: Boolean(row.is_transition),
    };
  } catch (err: any) {
    console.error("[moderateMissionSubmission] Erro ao moderar submissão:", err.message);
    return { success: false, error: err.message };
  }
}
