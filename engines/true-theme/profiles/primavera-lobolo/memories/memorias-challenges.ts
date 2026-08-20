export interface MemoryChallenge {
  id: string;
  number: string;
  title: string;
  description: string;
}

export const MEMORY_CHALLENGES: MemoryChallenge[] = [
  {
    id: "01",
    number: "01",
    title: "Uma foto de grupo da sua mesa",
    description: "Reúna todos os seus companheiros de mesa para um registo colectivo.",
  },
  {
    id: "02",
    number: "02",
    title: "A primeira dança do casal",
    description: "Capture a cumplicidade e a emoção do primeiro passo dos noivos.",
  },
  {
    id: "03",
    number: "03",
    title: "Um brinde com os noivos",
    description: "Erga o copo e celebre a união com uma fotografia de brinde.",
  },
  {
    id: "04",
    number: "04",
    title: "O melhor passo de dança",
    description: "Registe o momento mais animado e contagiante da pista.",
  },
  {
    id: "05",
    number: "05",
    title: "Lágrimas de alegria",
    description: "Um olhar emocionado, um abraço apertado ou uma lágrima sincera.",
  },
  {
    id: "06",
    number: "06",
    title: "Um momento doce",
    description: "O bolo, os doces ou um gesto carinhoso entre convidados.",
  },
  {
    id: "07",
    number: "07",
    title: "Alguém a fazer um discurso",
    description: "Fotografe as palavras de honra, bênção ou carinho aos noivos.",
  },
  {
    id: "08",
    number: "08",
    title: "Uma selfie",
    description: "O seu sorriso e a sua presença neste dia inesquecível.",
  },
];

function storageKey(slug: string): string {
  return `haxr_memorias_${slug}_completed`;
}

export function getCompletedChallenges(slug?: string): string[] {
  if (typeof window === "undefined" || !slug) return [];
  try {
    const raw = localStorage.getItem(storageKey(slug));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function markChallengeCompleted(slug: string, challengeId: string): string[] {
  if (typeof window === "undefined" || !slug) return [];
  try {
    const current = getCompletedChallenges(slug);
    if (!current.includes(challengeId)) {
      const updated = [...current, challengeId];
      localStorage.setItem(storageKey(slug), JSON.stringify(updated));
      return updated;
    }
    return current;
  } catch {
    return [];
  }
}
