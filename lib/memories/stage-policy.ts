/**
 * HAXR PLUS MEMORIES — EVENT STAGES POLICY
 * 
 * Regras de resolução determinística de Etapas (Stages):
 * 1. Override explícito (enviado pelo cliente ou curador) se existir e for válido.
 * 2. Janela temporal (starts_at <= captured_at <= ends_at) com base em captured_at/created_at.
 * 3. Fallback determinístico para o stage padrão (ex: 'recepcao') ou primeiro activo.
 */

export interface MemoryStage {
  id: string;
  experienceId: string;
  eventId: string;
  slug: string;
  label: string;
  orderIndex: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ResolveStageInput {
  overrideStageId?: string | null;
  capturedAt?: string | Date | null;
  stages: MemoryStage[];
  fallbackSlug?: string;
}

export const CANONICAL_WEDDING_STAGES = [
  { slug: 'preparativos', label: 'Preparativos', orderIndex: 10 },
  { slug: 'cerimonia', label: 'Cerimónia', orderIndex: 20 },
  { slug: 'recepcao', label: 'Recepção & Brinde', orderIndex: 30 },
  { slug: 'festa', label: 'Festa & Pista', orderIndex: 40 },
  { slug: 'pos-festa', label: 'After-Party / Memórias Finais', orderIndex: 50 },
] as const;

/**
 * Resolve a etapa (stage) de um item de mídia de forma determinística e segura.
 */
export function resolveTargetStage(input: ResolveStageInput): MemoryStage | null {
  const activeStages = input.stages
    .filter((s) => s.isActive)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  if (activeStages.length === 0) {
    return null;
  }

  // 1. Override explícito
  if (input.overrideStageId) {
    const matched = activeStages.find((s) => s.id === input.overrideStageId);
    if (matched) {
      return matched;
    }
  }

  // 2. Janela temporal
  if (input.capturedAt) {
    const timeMs = new Date(input.capturedAt).getTime();
    if (!isNaN(timeMs)) {
      const timeMatched = activeStages.find((s) => {
        const startMs = s.startsAt ? new Date(s.startsAt).getTime() : null;
        const endMs = s.endsAt ? new Date(s.endsAt).getTime() : null;

        if (startMs !== null && endMs !== null) {
          return timeMs >= startMs && timeMs <= endMs;
        }
        if (startMs !== null) {
          return timeMs >= startMs;
        }
        if (endMs !== null) {
          return timeMs <= endMs;
        }
        return false;
      });

      if (timeMatched) {
        return timeMatched;
      }
    }
  }

  // 3. Fallback por slug preferencial (ex: 'recepcao')
  const preferredSlug = input.fallbackSlug || 'recepcao';
  const fallback = activeStages.find((s) => s.slug === preferredSlug);
  if (fallback) {
    return fallback;
  }

  // 4. Primeiro stage activo por orderIndex
  return activeStages[0] || null;
}
