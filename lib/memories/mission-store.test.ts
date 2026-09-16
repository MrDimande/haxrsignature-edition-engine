import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import { Pool, type PoolClient } from "pg";
import { closeNeonPool } from "@lib/db/neon-client";
import { resolveMemoriesConfig } from "./config";
import { moderateMissionSubmission, submitMissionPhoto } from "./mission-store";

const SLUG = "stanturns5";
const EVENT_ID = "11111111-1111-4111-8111-111111111111";
const EXPERIENCE_ID = "22222222-2222-4222-8222-222222222222";
const PARTICIPANT_ID = "33333333-3333-4333-8333-333333333333";
const MISSION_ID = "44444444-4444-4444-8444-444444444444";
const MEDIA_ID = "55555555-5555-4555-8555-555555555555";
const FOREIGN_MEDIA_ID = "66666666-6666-4666-8666-666666666666";

type SubmissionStatus = "accepted" | "pending" | "rejected";
type ReviewPolicy = "auto_accept" | "manual_review";

type Submission = {
  id: string;
  missionId: string;
  mediaId: string;
  pointsAwarded: number;
  status: SubmissionStatus;
};

type QueryResult = {
  rows: Array<Record<string, unknown>>;
  rowCount?: number;
};

class MissionRuntime {
  reviewPolicy: ReviewPolicy = "auto_accept";
  totalPoints = 0;
  missionsCompleted = 0;
  readonly submissions = new Map<string, Submission>();
  lastPhotoQuery = "";

  async query(sql: string, values: unknown[] = []): Promise<QueryResult> {
    const normalized = sql.replace(/\s+/g, " ").trim();

    if (/^(BEGIN|COMMIT|ROLLBACK);?$/.test(normalized) || normalized.startsWith("SELECT set_config") || normalized.startsWith("SELECT pg_advisory_xact_lock")) {
      return { rows: [] };
    }

    if (normalized.includes("FROM memory_experiences me")) {
      return {
        rows: [{
          event_id: EVENT_ID,
          event_active: true,
          experience_id: EXPERIENCE_ID,
          event_slug: SLUG,
          invitation_slug: SLUG,
          access_mode: "session",
          visibility: "moderated",
          uploads_enabled: true,
          competition_enabled: true,
        }],
      };
    }

    if (normalized.startsWith("INSERT INTO memory_participants")) {
      return { rows: [] };
    }

    if (normalized.includes("FROM memory_missions") && normalized.includes("FOR SHARE")) {
      assert.deepEqual(values, [MISSION_ID, EXPERIENCE_ID]);
      return {
        rows: [{
          id: MISSION_ID,
          event_id: EVENT_ID,
          experience_id: EXPERIENCE_ID,
          slug: "fixture-mission",
          points: 100,
          is_active: true,
          starts_at: null,
          ends_at: null,
          required_media_type: "image",
          max_submissions_per_participant: 1,
          submission_review_policy: this.reviewPolicy,
        }],
      };
    }

    if (normalized.includes("FROM wedding_photos") && normalized.includes("FOR SHARE")) {
      this.lastPhotoQuery = normalized;
      if (values[0] === FOREIGN_MEDIA_ID) {
        return { rows: [] };
      }
      assert.deepEqual(values, [MEDIA_ID, EXPERIENCE_ID]);
      return {
        rows: [{
          id: MEDIA_ID,
          event_id: EVENT_ID,
          experience_id: EXPERIENCE_ID,
          participant_id: PARTICIPANT_ID,
          media_type: "image",
          moderation_status: "pending",
          created_at: new Date().toISOString(),
        }],
      };
    }

    if (normalized.includes("FROM memory_mission_assignments")) {
      return normalized.includes("count(*)")
        ? { rows: [{ count: 0 }] }
        : { rows: [] };
    }

    if (normalized.includes("FROM memory_mission_submissions") && normalized.includes("SELECT id, points_awarded, status")) {
      const submission = [...this.submissions.values()].find(
        (candidate) => candidate.missionId === values[0] && candidate.mediaId === values[1]
      );
      return submission
        ? { rows: [{ id: submission.id, points_awarded: submission.pointsAwarded, status: submission.status }] }
        : { rows: [] };
    }

    if (normalized.includes("FROM memory_mission_submissions") && normalized.includes("SELECT count(*)")) {
      const acceptedSubmissions = [...this.submissions.values()].filter(
        (submission) => submission.status === "accepted"
      );
      return { rows: [{ count: acceptedSubmissions.length }] };
    }

    if (normalized.startsWith("INSERT INTO memory_mission_submissions")) {
      const submission: Submission = {
        id: `submission-${this.submissions.size + 1}`,
        missionId: String(values[2]),
        mediaId: String(values[5]),
        pointsAwarded: Number(values[6]),
        status: values[7] as SubmissionStatus,
      };
      this.submissions.set(submission.id, submission);
      return { rows: [{ id: submission.id, points_awarded: submission.pointsAwarded, was_inserted: true }] };
    }

    if (normalized.startsWith("UPDATE wedding_photos SET challenge_id")) {
      return { rows: [] };
    }

    if (normalized.startsWith("INSERT INTO memory_participant_scores")) {
      this.totalPoints += Number(values[3]);
      this.missionsCompleted += 1;
      return { rows: [{ total_points: this.totalPoints }] };
    }

    if (normalized.startsWith("SELECT total_points FROM memory_participant_scores")) {
      return { rows: [{ total_points: this.totalPoints }] };
    }

    if (normalized.startsWith("SELECT * FROM haxr_moderate_mission_submission")) {
      const submission = this.submissions.get(String(values[0]));
      assert.ok(submission, "A função de moderação recebe uma submission existente.");
      const previousStatus = submission.status;
      const nextStatus = values[1] as SubmissionStatus;
      const pointsDelta = previousStatus === "accepted" && nextStatus === "rejected"
        ? -submission.pointsAwarded
        : 0;

      submission.status = nextStatus;
      submission.pointsAwarded = nextStatus === "accepted" ? 100 : 0;
      this.totalPoints += pointsDelta;
      this.missionsCompleted += pointsDelta < 0 ? -1 : 0;

      return {
        rows: [{
          submission_id: submission.id,
          previous_status: previousStatus,
          new_status: nextStatus,
          points_delta: pointsDelta,
          current_participant_points: this.totalPoints,
          current_missions_completed: this.missionsCompleted,
          is_transition: previousStatus !== nextStatus,
        }],
      };
    }

    throw new Error(`Query não coberta pelo double de missão: ${normalized}`);
  }
}

const originalDatabaseUrl = process.env.DATABASE_URL;
let runtime: MissionRuntime;

beforeEach(async () => {
  await closeNeonPool();
  mock.restoreAll();
  runtime = new MissionRuntime();
  process.env.DATABASE_URL = "postgres://localhost/mission_store_test";

  mock.method(Pool.prototype, "query", async (sql: string, values: unknown[] = []) => runtime.query(sql, values));
  mock.method(Pool.prototype, "connect", async () => ({
    query: (sql: string, values: unknown[] = []) => runtime.query(sql, values),
    release: () => undefined,
  }) as unknown as PoolClient);
});

afterEach(async () => {
  await closeNeonPool();
  mock.restoreAll();
  if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = originalDatabaseUrl;
});

async function submit(mediaId = MEDIA_ID) {
  return submitMissionPhoto({
    slug: SLUG,
    missionId: MISSION_ID,
    mediaId,
    participantId: PARTICIPANT_ID,
  });
}

describe("Mission engine — precedência entre moderação global e policy da missão", () => {
  it("auto_accept mantém +100 mesmo quando a moderação global de media está activa", async () => {
    assert.equal(resolveMemoriesConfig(SLUG)?.moderationRequired, true);

    const result = await submit();

    assert.equal(result.success, true);
    assert.equal(result.pointsAwarded, 100);
    assert.equal(result.totalPoints, 100);
    assert.equal(runtime.submissions.size, 1);
    assert.equal([...runtime.submissions.values()][0].status, "accepted");
  });

  it("manual_review mantém a submissão pendente com zero pontos", async () => {
    runtime.reviewPolicy = "manual_review";

    const result = await submit();

    assert.equal(result.success, true);
    assert.equal(result.pointsAwarded, 0);
    assert.equal(result.totalPoints, 0);
    assert.equal([...runtime.submissions.values()][0].status, "pending");
  });

  it("retry de auto_accept reutiliza uma submission e conserva exactamente 100 pontos", async () => {
    const first = await submit();
    const retry = await submit();

    assert.equal(first.success, true);
    assert.equal(retry.success, true);
    assert.equal(runtime.submissions.size, 1);
    assert.equal(retry.pointsAwarded, 100);
    assert.equal(retry.totalPoints, 100);
    assert.equal(runtime.totalPoints, 100);
  });

  it("rejeição posterior usa a transição autoritativa e reverte a pontuação", async () => {
    const initial = await submit();
    assert.ok(initial.submissionId);

    const moderation = await moderateMissionSubmission({
      submissionId: initial.submissionId,
      newStatus: "rejected",
      rejectionReason: "fixture de teste",
    });

    assert.equal(moderation.success, true);
    assert.equal(moderation.pointsDelta, -100);
    assert.equal(moderation.currentParticipantPoints, 0);
    assert.equal(moderation.currentMissionsCompleted, 0);
    assert.equal([...runtime.submissions.values()][0].status, "rejected");
  });

  it("media de outro evento ou experiência é recusada antes de criar a submission", async () => {
    const result = await submit(FOREIGN_MEDIA_ID);

    assert.equal(result.success, false);
    assert.equal(runtime.submissions.size, 0);
    assert.match(runtime.lastPhotoQuery, /WHERE id = \$1 AND experience_id = \$2/);
  });
});
