/**
 * Plus Memories — Desafios do Casamento Principal
 * Jessica Muege & Samuel Govene
 *
 * 12 desafios + momento livre.
 * localStorage isolado por slug.
 */

export interface MemoryChallenge {
  id: string;
  number: string;
  title: string;
  description: string;
}

export const PLUS_MEMORY_CHALLENGES: MemoryChallenge[] = [
  {
    id: "01",
    number: "01",
    title: "Uma fotografia de grupo da sua mesa",
    description: "Reúna todos os seus companheiros de mesa para um registo colectivo.",
  },
  {
    id: "02",
    number: "02",
    title: "A entrada dos noivos",
    description: "Capture a emoção do momento em que os noivos entram na celebração.",
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
    title: "A primeira dança do casal",
    description: "A cumplicidade e a emoção do primeiro passo dos noivos juntos.",
  },
  {
    id: "05",
    number: "05",
    title: "O sorriso mais bonito da noite",
    description: "Encontre e congele o sorriso mais genuíno e luminoso da celebração.",
  },
  {
    id: "06",
    number: "06",
    title: "Alguém emocionado em lágrimas de alegria",
    description: "Um olhar emocionado, um abraço apertado ou uma lágrima sincera.",
  },
  {
    id: "07",
    number: "07",
    title: "O melhor passo de dança",
    description: "Registe o momento mais animado e contagiante da pista.",
  },
  {
    id: "08",
    number: "08",
    title: "Um momento doce à mesa",
    description: "O bolo, os doces ou um gesto carinhoso entre convidados.",
  },
  {
    id: "09",
    number: "09",
    title: "Alguém a fazer um discurso",
    description: "Fotografe as palavras de honra, bênção ou carinho aos noivos.",
  },
  {
    id: "10",
    number: "10",
    title: "Uma selfie elegante",
    description: "O seu sorriso e a sua presença neste dia inesquecível.",
  },
  {
    id: "11",
    number: "11",
    title: "Um detalhe bonito da decoração",
    description: "Flores, luzes, candelabros ou qualquer pormenor que mereça ser lembrado.",
  },
  {
    id: "12",
    number: "12",
    title: "Um momento espontâneo que merece ser lembrado",
    description: "Porque as melhores memórias não se planeiam.",
  },
];

// ──────────────────────────────────────────────
// 21 mesas — identidade numérica + label francês
// ──────────────────────────────────────────────

export interface TableInfo {
  id: string;        // "01"–"21"  — persistido na DB
  number: number;    // 1–21
  label: string;     // ex: "Table 07 · Sept"
  frenchName: string;
}

const FRENCH_NUMBERS: Record<number, string> = {
  1: "Un", 2: "Deux", 3: "Trois", 4: "Quatre", 5: "Cinq",
  6: "Six", 7: "Sept", 8: "Huit", 9: "Neuf", 10: "Dix",
  11: "Onze", 12: "Douze", 13: "Treize", 14: "Quatorze", 15: "Quinze",
  16: "Seize", 17: "Dix-sept", 18: "Dix-huit", 19: "Dix-neuf", 20: "Vingt",
  21: "Vingt et un",
};

export const WEDDING_TABLES: TableInfo[] = Array.from({ length: 21 }, (_, i) => {
  const n = i + 1;
  const id = n < 10 ? `0${n}` : `${n}`;
  const frenchName = FRENCH_NUMBERS[n];
  return {
    id,
    number: n,
    label: `Table ${id} · ${frenchName}`,
    frenchName,
  };
});

export function getTableLabel(tableId: string | undefined | null): string | null {
  if (!tableId) return null;
  const table = WEDDING_TABLES.find((t) => t.id === tableId);
  return table ? table.label : `Mesa ${tableId}`;
}

// ──────────────────────────────────────────────
// localStorage — isolado por slug
// ──────────────────────────────────────────────

function storageKey(slug: string): string {
  return `haxr_memories_${slug}`;
}

export function getCompletedChallenges(slug: string): string[] {
  if (typeof window === "undefined") return [];
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
  if (typeof window === "undefined") return [];
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
