import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getInvitation, getActiveInvitations } from "@data/invitations";
import { getTheme } from "@theme/resolver";
import { resolveSlug } from "@lib/engine";
import { MemoriasExperience } from "@engines/true-theme/profiles/primavera-lobolo/memories/MemoriasExperience";
import { PlusMemoriasExperience } from "@engines/true-theme/profiles/jessica-samuel-wedding/memories/PlusMemoriasExperience";
import { StanMatchdayExperience } from "@engines/true-theme/profiles/stan-real-madrid/memories/StanMatchdayExperience";
import { StanMatchdayGate } from "@engines/true-theme/profiles/stan-real-madrid/memories/StanMatchdayGate";
import { exchangeAccessLink, resolveMemoriesEvent, findSessionByTokenHash } from "@lib/memories/session-store";
import { memoriesCookieName, hashMemoriesToken } from "@lib/memories/session-security";

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

  const isStan = invitation.theme === "stan-real-madrid" || invitation.slug === "stan-real-madrid";
  if (isStan) {
    return {
      title: "5º Aniversário do Stan — Matchday Memories & Eu Espio",
      description: "Registe fotografias, cumpra as missões do Eu Espio e acompanhe o álbum de memórias do 5º Aniversário do Stan.",
      robots: { index: false, follow: false },
    };
  }

  const variant = invitation.features.memories.variant;
  const title = variant === "plus-memories"
    ? `Plus Memories — ${invitation.metadata.title}`
    : `Memórias do Nosso Dia — ${invitation.metadata.title}`;

  return {
    title,
    description: "Partilhe fotos e vídeos do nosso casamento. Um álbum de memórias colectivo.",
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

  const isStan = invitation.theme === "stan-real-madrid" || invitation.slug === "stan-real-madrid";
  const accessMode = invitation.features.memories.accessMode || "legacy";

  // 1. Tratamento de Troca Automática de Link de Acesso (?link=... ou ?token=...)
  if (sp) {
    const rawParam = sp.link || sp.token || sp.code || sp.access;
    const tokenOrCode = typeof rawParam === "string" ? rawParam.trim() : Array.isArray(rawParam) ? rawParam[0]?.trim() : "";

    if (tokenOrCode) {
      redirect(`/api/memories/session/exchange?token=${encodeURIComponent(tokenOrCode)}&slug=${encodeURIComponent(canonicalSlug)}`);
    }
  }

  // 2. Verificação de Sessão para Modos com accessMode === "session"
  if (accessMode === "session") {
    let hasValidSession = false;
    try {
      const eventInfo = await resolveMemoriesEvent(canonicalSlug);
      if (eventInfo) {
        const cookieStore = await cookies();
        const isSecure = process.env.NODE_ENV === "production";
        const cookieName = memoriesCookieName(eventInfo.id, isSecure);
        const sessionToken = cookieStore.get(cookieName)?.value;

        if (sessionToken) {
          const tokenHash = hashMemoriesToken(sessionToken, "participant-session");
          const snapshot = await findSessionByTokenHash(tokenHash);
          if (snapshot && snapshot.event.id === eventInfo.id && !snapshot.session.revokedAt && new Date(snapshot.session.expiresAt) > new Date()) {
            hasValidSession = true;
          }
        }
      }
    } catch (err) {
      console.warn("[MemoriasPage] Erro ao verificar sessão do evento:", err);
    }

    // Se o evento exige sessão e o visitante não a possui, renderizar o Gate de Acesso
    if (!hasValidSession) {
      if (isStan) {
        const authError = sp?.auth === "invalid" ? "Link de acesso inválido ou expirado." : undefined;
        return <StanMatchdayGate slug={canonicalSlug} errorMessage={authError} />;
      }
    }
  }

  const theme = getTheme(invitation.theme);

  // Extrair ?mesa=XX (opcional)
  const mesaRaw = sp?.mesa;
  const mesa = typeof mesaRaw === "string" ? mesaRaw.trim() : undefined;

  // 3. Renderizar o perfil de experiência adequado
  if (isStan) {
    return (
      <StanMatchdayExperience
        config={invitation}
        theme={theme}
        tableId={mesa}
      />
    );
  }

  const variant = invitation.features.memories.variant;
  if (variant === "plus-memories") {
    return (
      <PlusMemoriasExperience
        config={invitation}
        theme={theme}
        tableId={mesa}
      />
    );
  }

  // Default: traditional-memories
  return (
    <MemoriasExperience
      config={invitation}
      theme={theme}
      tableId={mesa}
    />
  );
}
