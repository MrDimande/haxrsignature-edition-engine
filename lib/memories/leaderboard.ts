import { createAdminClient, isSupabaseConfigured } from "@lib/supabase/server";
import { resolveMemoriesConfig, PLUS_MEMORIES_CHALLENGE_WHITELIST } from "./config";

export interface RawMemoryPhotoRow {
  id: string;
  invitation_slug: string;
  participant_id: string | null;
  guest_name: string | null;
  challenge_id: string | null;
  created_at: string;
  moderation_status: string;
}

export interface LeaderboardEntry {
  rank: number;
  displayName: string;
  hasName: boolean;
  completed: number;
  completedAt: string | null;
  totalUploads: number;
}

export interface LeaderboardResult {
  success: boolean;
  error?: string;
  slug?: string;
  mode?: "provisional" | "final";
  totalChallenges?: number;
  leaderboard?: LeaderboardEntry[];
}

export interface ParticipantProgressResult {
  success: boolean;
  error?: string;
  slug?: string;
  participantId?: string;
  completedChallengeIds?: string[];
  completedCount?: number;
  totalChallenges?: number;
}

const WHITELIST_SET = new Set<string>(PLUS_MEMORIES_CHALLENGE_WHITELIST);

/**
 * Calcula a lista de classificação a partir das linhas de fotografias da DB.
 *
 * Directivas:
 * 1. Whitelist estrita: considera apenas challenge_id de "01" a "12".
 * 2. Momento livre (challenge_id null ou inválido) é ignorado na competição.
 * 3. Modo 'provisional': considera pending + approved (exclui rejected).
 * 4. Modo 'final': considera apenas approved (exclui pending e rejected).
 * 5. Nome oficial: guest_name não vazio mais recente do participante. Fallback: "Participante sem nome".
 * 6. Desempate: quem atingiu o N-ésimo desafio primeiro (timestamp da 1ª contribuição válida do N-ésimo desafio).
 */
export function calculateLeaderboardFromPhotos(
  photos: RawMemoryPhotoRow[],
  mode: "provisional" | "final" = "provisional"
): LeaderboardEntry[] {
  // Agrupar por participant_id
  const participantMap = new Map<
    string,
    {
      photos: RawMemoryPhotoRow[];
      validChallengePhotos: RawMemoryPhotoRow[];
    }
  >();

  for (const photo of photos) {
    if (!photo.participant_id) continue;

    // Filtragem por estado de moderação
    if (mode === "final") {
      if (photo.moderation_status !== "approved") continue;
    } else {
      if (photo.moderation_status === "rejected") continue;
    }

    let entry = participantMap.get(photo.participant_id);
    if (!entry) {
      entry = { photos: [], validChallengePhotos: [] };
      participantMap.set(photo.participant_id, entry);
    }

    entry.photos.push(photo);

    if (photo.challenge_id && WHITELIST_SET.has(photo.challenge_id)) {
      entry.validChallengePhotos.push(photo);
    }
  }

  const entries: Array<Omit<LeaderboardEntry, "rank">> = [];

  for (const [participantId, data] of participantMap.entries()) {
    // 1. Obter o nome mais recente não vazio
    const sortedByTimeDesc = [...data.photos].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const latestNamedPhoto = sortedByTimeDesc.find(
      (p) => p.guest_name && p.guest_name.trim().length > 0
    );

    const displayName = latestNamedPhoto?.guest_name?.trim() || "Participante sem nome";
    const hasName = Boolean(latestNamedPhoto?.guest_name?.trim());

    // 2. Mapear o menor criado_at por desafio único
    const earliestPerChallenge = new Map<string, number>();
    for (const photo of data.validChallengePhotos) {
      const chId = photo.challenge_id!;
      const timeMs = new Date(photo.created_at).getTime();
      const existing = earliestPerChallenge.get(chId);
      if (existing === undefined || timeMs < existing) {
        earliestPerChallenge.set(chId, timeMs);
      }
    }

    const uniqueChallengeIds = Array.from(earliestPerChallenge.keys());
    const completedCount = Math.min(12, uniqueChallengeIds.length);

    let completedAtIso: string | null = null;
    if (completedCount > 0) {
      // Ordenar os tempos das primeiras contribuições dos desafios únicos em ordem cronológica
      const sortedChallengeTimes = Array.from(earliestPerChallenge.values()).sort(
        (a, b) => a - b
      );
      // O timestamp em que completou o N-ésimo desafio é o N-1 no array
      const nthTimeMs = sortedChallengeTimes[completedCount - 1];
      completedAtIso = new Date(nthTimeMs).toISOString();
    }

    entries.push({
      displayName,
      hasName,
      completed: completedCount,
      completedAt: completedAtIso,
      totalUploads: data.photos.length,
    });
  }

  // Ordenar a classificação
  entries.sort((a, b) => {
    // 1º Critério: Número de desafios concluídos (DESC)
    if (b.completed !== a.completed) {
      return b.completed - a.completed;
    }
    // 2º Critério: Quem atingiu esse número de desafios primeiro (ASC)
    if (a.completedAt && b.completedAt) {
      const timeA = new Date(a.completedAt).getTime();
      const timeB = new Date(b.completedAt).getTime();
      if (timeA !== timeB) return timeA - timeB;
    }
    // 3º Critério: Total de uploads (DESC)
    if (b.totalUploads !== a.totalUploads) {
      return b.totalUploads - a.totalUploads;
    }
    // 4º Critério: Nome (ASC)
    return a.displayName.localeCompare(b.displayName);
  });

  // Atribuir ranks (1-indexed)
  return entries.map((item, index) => ({
    rank: index + 1,
    ...item,
  }));
}

/**
 * Calcula os IDs de desafios únicos concluídos por um participante específico.
 */
export function getParticipantProgressFromPhotos(
  photos: RawMemoryPhotoRow[],
  participantId: string
): string[] {
  const completedSet = new Set<string>();

  for (const photo of photos) {
    if (
      photo.participant_id === participantId &&
      photo.moderation_status !== "rejected" &&
      photo.challenge_id &&
      WHITELIST_SET.has(photo.challenge_id)
    ) {
      completedSet.add(photo.challenge_id);
    }
  }

  return Array.from(completedSet).sort();
}

/**
 * Procura na base de dados e gera o Leaderboard para um evento.
 */
export async function getMemoriesLeaderboard(
  slug: string,
  mode: "provisional" | "final" = "provisional"
): Promise<LeaderboardResult> {
  const config = resolveMemoriesConfig(slug);
  if (!config) {
    return { success: false, error: "Convite não encontrado." };
  }

  if (!isSupabaseConfigured()) {
    return { success: false, error: "Serviço temporariamente indisponível." };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("wedding_photos")
    .select("id, invitation_slug, participant_id, guest_name, challenge_id, created_at, moderation_status")
    .eq("invitation_slug", config.invitationSlug)
    .not("participant_id", "is", null);

  if (error) {
    console.error("[Leaderboard] Error fetching photos:", error.message);
    return { success: false, error: "Erro ao consultar a classificação." };
  }

  const leaderboard = calculateLeaderboardFromPhotos(data as RawMemoryPhotoRow[], mode);

  return {
    success: true,
    slug: config.invitationSlug,
    mode,
    totalChallenges: 12,
    leaderboard,
  };
}

/**
 * Reconcilia o progresso pessoal de um participante a partir da base de dados.
 */
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getParticipantProgress(
  slug: string,
  participantId: string
): Promise<ParticipantProgressResult> {
  const config = resolveMemoriesConfig(slug);
  if (!config) {
    return { success: false, error: "Convite não encontrado." };
  }

  if (!config.competition?.enabled) {
    return { success: false, error: "Competição não activada para este evento." };
  }

  if (
    !participantId ||
    typeof participantId !== "string" ||
    participantId.trim().length > 36 ||
    !UUID_V4_REGEX.test(participantId.trim())
  ) {
    return { success: false, error: "ID de participante inválido." };
  }

  if (!isSupabaseConfigured()) {
    return { success: false, error: "Serviço temporariamente indisponível." };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("wedding_photos")
    .select("id, invitation_slug, participant_id, guest_name, challenge_id, created_at, moderation_status")
    .eq("invitation_slug", config.invitationSlug)
    .eq("participant_id", participantId);

  if (error) {
    console.error("[ParticipantProgress] Error fetching photos:", error.message);
    return { success: false, error: "Erro ao obter progresso pessoal." };
  }

  const completedChallengeIds = getParticipantProgressFromPhotos(
    data as RawMemoryPhotoRow[],
    participantId
  );

  return {
    success: true,
    slug: config.invitationSlug,
    participantId,
    completedChallengeIds,
    completedCount: completedChallengeIds.length,
    totalChallenges: 12,
  };
}
