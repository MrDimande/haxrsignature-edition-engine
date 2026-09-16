import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getInvitation, getActiveInvitations } from "@data/invitations";
import { resolveSlug } from "@lib/engine";
import { RecapExperienceView } from "@components/memories/recap/RecapExperienceView";
import { validateAndExchangeRecapToken } from "@lib/memories/recap-store";
import { recapShareCookieName } from "@lib/memories/session-security";

interface RecapPageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ token?: string; code?: string; auth?: string }>;
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
}: RecapPageProps): Promise<Metadata> {
  const { slug } = await params;
  const canonicalSlug = resolveSlug(slug);
  const invitation = canonicalSlug ? getInvitation(canonicalSlug) : null;

  if (!invitation || invitation.status !== "active" || !invitation.features?.memories?.enabled) {
    return {
      title: "Recap não encontrado",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `Memórias da Celebração — ${invitation.metadata.title} | HAXR Signature`,
    description: "Narrativa editorial de memória do evento e recordações da celebração.",
    robots: { index: false, follow: false },
  };
}

export default async function RecapPage({ params, searchParams }: RecapPageProps) {
  const { slug } = await params;
  const canonicalSlug = resolveSlug(slug);
  const invitation = canonicalSlug ? getInvitation(canonicalSlug) : null;

  if (!canonicalSlug || !invitation || invitation.status !== "active" || !invitation.features?.memories?.enabled) {
    notFound();
  }

  // Hardening 3: Share token exchange server-side com redirect para URL limpa
  if (searchParams) {
    const sp = await searchParams;
    const rawToken = sp.token || sp.code;
    if (rawToken) {
      const exchange = await validateAndExchangeRecapToken({
        slug: canonicalSlug,
        rawTokenOrCode: rawToken,
      });

      if (exchange.valid && exchange.eventId && exchange.token && exchange.expiresAt) {
        const cookieStore = await cookies();
        const isSecure = process.env.NODE_ENV === "production";
        const cName = recapShareCookieName(exchange.eventId, isSecure);
        cookieStore.set(cName, exchange.token, {
          path: "/",
          httpOnly: true,
          secure: isSecure,
          sameSite: "lax",
          expires: exchange.expiresAt,
        });
        // Redireciona para a URL limpa (SEM O TOKEN NA BARRA DE NAVEGAÇÃO)
        redirect(`/${canonicalSlug}/memorias/recap`);
      } else {
        // Redireciona sem o token em caso de token inválido, expirado ou revogado
        redirect(`/${canonicalSlug}/memorias/recap?auth=invalid`);
      }
    }
  }

  return <RecapExperienceView slug={canonicalSlug} />;
}
