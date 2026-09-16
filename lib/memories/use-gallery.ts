"use client";

import { useEffect, useState } from "react";
import type { PublicMemoryItem } from "./gallery";

export function useMemoriesGallery(slug: string, refreshTrigger: number) {
  const [memories, setMemories] = useState<PublicMemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setMemories([]);
    setLoading(true);
    setError(false);

    async function load() {
      try {
        const response = await fetch(`/api/memories?slug=${encodeURIComponent(slug)}`, {
          signal: controller.signal, cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok || data?.success !== true || !Array.isArray(data.memories)) {
          throw new Error("Galeria indisponível");
        }
        if (!controller.signal.aborted) setMemories(data.memories);
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [slug, refreshTrigger, retryCount]);

  return { memories, loading, error, retry: () => setRetryCount((count) => count + 1) };
}
