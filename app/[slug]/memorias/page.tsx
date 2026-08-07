import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getInvitation, getActiveInvitations } from "@data/invitations";
import { getTheme } from "@theme/resolver";
import { resolveSlug } from "@lib/engine";
import { MemoriasExperience } from "@engines/true-theme/profiles/primavera-lobolo/memories/MemoriasExperience";

interface MemoriasPageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export function generateStaticParams() {
  const params: Array<{ slug: string }> = [];
  for (const invitation of getActiveInvitations()) {
    if (invitation.features?.memories?.enabled) {
      params.push({ slug: invitation.slug });
      if (invitation.aliases) {
        for (const alias of invitation.aliases) {
          params.push({ slug: alias });
        }
      }
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: MemoriasPageProps): Promise<Metadata> {
  const { slug } = await params;
  const canonicalSlug = resolveSlug(slug);
  const invitation = canonicalSlug ? getInvitation(canonicalSlug) : null;

  if (!invitation || invitation.status !== "active" || !invitation.features?.memories?.enabled) {
    return {
      title: "Página não encontrada",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `Memórias do Nosso Dia — ${invitation.metadata.title}`,
    description: "Partilhe fotos e vídeos do nosso casamento tradicional. Um álbum de memórias colectivo.",
    robots: { index: false, follow: false },
  };
}

export default async function MemoriasPage({
  params,
  searchParams,
}: MemoriasPageProps) {
  const { slug } = await params;
  const sp = searchParams ? await searchParams : undefined;

  const canonicalSlug = resolveSlug(slug);
  if (!canonicalSlug) {
    notFound();
  }

  const invitation = getInvitation(canonicalSlug);
  if (
    !invitation ||
    invitation.status !== "active" ||
    !invitation.features?.memories?.enabled
  ) {
    notFound();
  }

  const theme = getTheme(invitation.theme);

  // Extrair ?mesa=XX (opcional)
  const mesaRaw = sp?.mesa;
  const mesa = typeof mesaRaw === "string" ? mesaRaw.trim() : undefined;

  return (
    <MemoriasExperience
      config={invitation}
      theme={theme}
      tableId={mesa}
    />
  );
}
