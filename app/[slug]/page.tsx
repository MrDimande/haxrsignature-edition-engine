import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { HaxrAuthorshipMeta } from "@lib/brand/HaxrAuthorshipMeta";
import { EngineRenderer } from "@engines/index";
import {
  getInvitation,
  LEGACY_SLUG_REDIRECTS,
  getActiveInvitations,
} from "@data/invitations";
import { getTheme } from "@theme/resolver";
import { getExperience } from "@experience/registry";
import {
  buildInvitationMetadata,
  getEditionSiteUrl,
} from "@lib/brand/authorship";
import { resolveSlug } from "@lib/engine";

interface InvitationPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  const params: Array<{ slug: string }> = [];
  for (const invitation of getActiveInvitations()) {
    params.push({ slug: invitation.slug });
    if (invitation.aliases) {
      for (const alias of invitation.aliases) {
        params.push({ slug: alias });
      }
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: InvitationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const canonicalSlug = resolveSlug(slug);
  const invitation = canonicalSlug ? getInvitation(canonicalSlug) : null;

  if (!invitation || invitation.status !== "active") {
    return {
      title: "Convite não encontrado",
      robots: { index: false, follow: false },
    };
  }

  const { metadata } = invitation;
  const ogImage = metadata.ogImage ?? "/images/haxr-favicon.png";
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
          url: ogImage,
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
      images: [ogImage],
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

  const invitation = getInvitation(canonicalSlug);
  if (!invitation || invitation.status !== "active") {
    notFound();
  }

  const theme = getTheme(invitation.theme);
  const experience = getExperience(invitation.experienceType);

  return (
    <>
      <HaxrAuthorshipMeta
        pageName={invitation.metadata.title}
        pageUrl={`${getEditionSiteUrl()}/${canonicalSlug}`}
      />
      <EngineRenderer
        config={invitation}
        theme={theme}
        experience={experience}
      />
    </>
  );
}
