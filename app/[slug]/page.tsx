import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
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
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
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
  const ogImage = metadata.ogImage;
  const base = buildInvitationMetadata(
    metadata.title,
    metadata.description,
    invitation.slug
  );

  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      type: "website",
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

export default async function InvitationPage({
  params,
  searchParams,
}: InvitationPageProps) {
  const { slug } = await params;

  if (LEGACY_SLUG_REDIRECTS[slug]) {
    const target = LEGACY_SLUG_REDIRECTS[slug];
    const sp = searchParams ? await searchParams : undefined;
    const query = new URLSearchParams();
    if (sp) {
      for (const [key, value] of Object.entries(sp)) {
        if (typeof value === "string") query.set(key, value);
        else if (Array.isArray(value)) {
          for (const item of value) {
            if (typeof item === "string") query.append(key, item);
          }
        }
      }
    }
    const qs = query.toString();
    permanentRedirect(qs ? `/${target}?${qs}` : `/${target}`);
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
