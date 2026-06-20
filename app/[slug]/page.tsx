import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { HaxrAuthorshipMeta } from "@lib/brand/HaxrAuthorshipMeta";
import { EngineRenderer } from "@engines/index";
import { INVITATIONS, LEGACY_SLUG_REDIRECTS, getActiveInvitations } from "@data/invitations";
import {
  buildInvitationMetadata,
  getEditionSiteUrl,
} from "@lib/brand/authorship";
import { resolveSlug } from "@lib/engine";

interface InvitationPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getActiveInvitations().map((invitation) => ({
    slug: invitation.slug,
  }));
}

export async function generateMetadata({
  params,
}: InvitationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const canonicalSlug = resolveSlug(slug);
  const invitation = canonicalSlug ? INVITATIONS[canonicalSlug] : null;

  if (!invitation || invitation.status !== "active") {
    return {
      title: "Convite não encontrado",
      robots: { index: false, follow: false },
    };
  }

  const { metadata } = invitation;
  const base = buildInvitationMetadata(
    metadata.title,
    metadata.description,
    invitation.slug
  );

  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      images: [
        {
          url: "/images/jessica.jpg",
          width: 1200,
          height: 630,
          alt: metadata.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: metadata.title,
      description: metadata.description,
      images: ["/images/jessica.jpg"],
    },
  };
}

export default async function InvitationPage({ params }: InvitationPageProps) {
  const { slug } = await params;

  if (LEGACY_SLUG_REDIRECTS[slug]) {
    redirect(`/${LEGACY_SLUG_REDIRECTS[slug]}`);
  }

  const canonicalSlug = resolveSlug(slug);
  if (!canonicalSlug) {
    notFound();
  }

  const invitation = INVITATIONS[canonicalSlug];
  if (!invitation || invitation.status !== "active") {
    notFound();
  }

  return (
    <>
      <HaxrAuthorshipMeta
        pageName={invitation.metadata.title}
        pageUrl={`${getEditionSiteUrl()}/${canonicalSlug}`}
      />
      <EngineRenderer config={invitation} slug={canonicalSlug} />
    </>
  );
}
