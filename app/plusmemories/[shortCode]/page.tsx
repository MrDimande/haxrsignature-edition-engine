import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlusMemoriasExperience } from "@engines/true-theme/profiles/jessica-samuel-wedding/memories/PlusMemoriasExperience";
import { resolveMemoryShareLink } from "@lib/memories/share-links";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Plus Memories · HAXR Signature",
  description: "Uma experiência colectiva de fotografias, vídeos e memórias.",
  robots: { index: false, follow: false },
};

interface PlusMemoriesSharePageProps {
  params: Promise<{ shortCode: string }>;
}

export default async function PlusMemoriesSharePage({
  params,
}: PlusMemoriesSharePageProps) {
  const { shortCode } = await params;
  const resolved = await resolveMemoryShareLink(shortCode);

  if (!resolved || resolved.config.variant !== "plus-memories") {
    notFound();
  }

  return <PlusMemoriasExperience config={resolved.config} />;
}
