export interface MemoriesPhase {
  id: string;
  label: string;
  description: string;
}

export const JESSICA_SAMUEL_PHASES: readonly MemoriesPhase[] = [
  {
    id: "antes-do-sim",
    label: "Antes do Sim",
    description: "Os detalhes, os preparativos e os primeiros olhares.",
  },
  {
    id: "o-sim",
    label: "O Sim",
    description: "A entrada, a emoção e os momentos da cerimónia.",
  },
  {
    id: "a-mesa",
    label: "À Mesa",
    description: "Brindes, discursos, família e encontros à volta da mesa.",
  },
  {
    id: "a-celebracao",
    label: "A Celebração",
    description: "A primeira dança, a pista e os momentos que fizeram a noite ganhar vida.",
  },
  {
    id: "entre-nos",
    label: "Entre Nós",
    description: "Sorrisos, abraços, selfies e momentos espontâneos.",
  },
] as const;

export const JESSICA_SAMUEL_CHALLENGE_PHASES: Readonly<Record<string, string>> = {
  "11": "antes-do-sim",
  "02": "o-sim",
  "01": "a-mesa",
  "03": "a-mesa",
  "08": "a-mesa",
  "09": "a-mesa",
  "04": "a-celebracao",
  "07": "a-celebracao",
  "05": "entre-nos",
  "06": "entre-nos",
  "10": "entre-nos",
  "12": "entre-nos",
};

export function resolvePhaseForChallenge(
  challengeId: string | undefined,
  phases: readonly MemoriesPhase[],
  challengePhaseMapping: Readonly<Record<string, string>>
): string | null {
  if (!challengeId) return null;
  const phaseId = challengePhaseMapping[challengeId];
  if (!phaseId) return null;
  return phases.some((phase) => phase.id === phaseId) ? phaseId : null;
}

export function isValidPhaseId(
  phaseId: string | undefined,
  phases: readonly MemoriesPhase[]
): boolean {
  if (!phaseId) return false;
  return phases.some((phase) => phase.id === phaseId);
}
