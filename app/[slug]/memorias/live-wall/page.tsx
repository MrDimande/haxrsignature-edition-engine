import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getInvitation, getActiveInvitations } from "@data/invitations";
import { resolveSlug } from "@lib/engine";
import { LiveWallContainer } from "@components/memories/live-wall/LiveWallContainer";

interface LiveWallPageProps {
  params: Promise<{ slug: string }>;
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
}: LiveWallPageProps): Promise<Metadata> {
  const { slug } = await params;
  const canonicalSlug = resolveSlug(slug);
  const invitation = canonicalSlug ? getInvitation(canonicalSlug) : null;

  if (!invitation || invitation.status !== "active" || !invitation.features?.memories?.enabled) {
    return {
      title: "Live Wall não encontrado",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `Live Wall — ${invitation.metadata.title} | HAXR Signature`,
    description: "Transmissão em tempo real das memórias e momentos da celebração.",
    robots: { index: false, follow: false },
  };
}

export default async function LiveWallPage({ params }: LiveWallPageProps) {
  const { slug } = await params;
  const canonicalSlug = resolveSlug(slug);
  const invitation = canonicalSlug ? getInvitation(canonicalSlug) : null;

  if (!canonicalSlug || !invitation || invitation.status !== "active" || !invitation.features?.memories?.enabled) {
    notFound();
  }

  return <LiveWallContainer slug={canonicalSlug} />;
}
