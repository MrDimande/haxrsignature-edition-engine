/**
 * Autoria HAXR Signature — fonte única para Edition e convites digitais.
 * @see https://www.haxrsignature.com
 */
import type { Metadata } from "next";

export const HAXR_AUTH = {
  brand: "HAXR Signature",
  product: "HAXR Signature Edition",
  tagline: "Alta-Costura Digital",
  motto: "Cada celebração merece uma assinatura.",
  description:
    "Plataforma privada de convites digitais de luxo — cerimónias, celebrações culturais e experiências Edition by HAXR Signature.",
  studioDescription:
    "Estúdio de design de elite especializado em convites de luxo e experiências digitais interactivas. Fundimos a sensibilidade artística contemporânea com o respeito e o orgulho das heranças culturais.",
  generator: "HAXR Signature Edition Platform",
  website: "https://www.haxrsignature.com",
  editionUrl: "https://edition.haxrsignature.com",
  domain: "haxrsignature.com",
  editionHost: "edition.haxrsignature.com",
  location: "Maputo, Moçambique",
  locale: "pt_MZ" as const,
  keywords: [
    "HAXR Signature",
    "convite digital",
    "Edition",
    "Moçambique",
    "luxo",
    "cerimónia",
  ],
  email: {
    hello: "hello@haxrsignature.com",
    convites: "convites@haxrsignature.com",
    rsvp: "rsvp@haxrsignature.com",
  },
  social: {
    instagram: "https://instagram.com/haxrsignature",
    handle: "@haxrsignature",
  },
  copyright: {
    holder: "HAXR Signature",
    year: 2026,
    rights: "Todos os direitos reservados.",
  },
  assets: {
    symbol: "/images/haxr-favicon.png",
    logoVertical: "/images/haxr-logo-vertical.png",
    logoHorizontal: "/images/haxr-logo-horizontal.png",
  },
} as const;

export function formatCopyright(year = HAXR_AUTH.copyright.year): string {
  return `© ${year} ${HAXR_AUTH.copyright.holder.toUpperCase()}. ${HAXR_AUTH.copyright.rights.toUpperCase()}`;
}

export function formatCopyrightShort(year = HAXR_AUTH.copyright.year): string {
  return `© ${year} ${HAXR_AUTH.brand}`;
}

export function getEditionSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || HAXR_AUTH.editionUrl
  );
}

export function buildRootMetadata(): Metadata {
  return {
    metadataBase: new URL(getEditionSiteUrl()),
    title: {
      default: HAXR_AUTH.product,
      template: `%s | ${HAXR_AUTH.brand}`,
    },
    description: HAXR_AUTH.description,
    applicationName: HAXR_AUTH.product,
    authors: [{ name: HAXR_AUTH.brand, url: HAXR_AUTH.website }],
    creator: HAXR_AUTH.brand,
    publisher: HAXR_AUTH.brand,
    generator: HAXR_AUTH.generator,
    keywords: [...HAXR_AUTH.keywords],
    robots: {
      index: false,
      follow: false,
    },
    icons: {
      icon: [
        { url: HAXR_AUTH.assets.symbol, sizes: "32x32", type: "image/png" },
      ],
      apple: "/apple-icon.png",
      shortcut: HAXR_AUTH.assets.symbol,
    },
    other: {
      "designer": HAXR_AUTH.brand,
      "copyright": formatCopyright(),
    },
  };
}

export function buildInvitationMetadata(
  title: string,
  description: string,
  slug: string
): Metadata {
  const pageUrl = `${getEditionSiteUrl()}/${slug}`;

  return {
    title,
    description,
    authors: [{ name: HAXR_AUTH.brand, url: HAXR_AUTH.website }],
    creator: HAXR_AUTH.brand,
    publisher: HAXR_AUTH.brand,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: HAXR_AUTH.locale,
      siteName: HAXR_AUTH.brand,
      url: pageUrl,
    },
    other: {
      designer: HAXR_AUTH.brand,
      copyright: formatCopyright(),
    },
  };
}

export function buildOrganizationJsonLd() {
  return {
    "@type": "Organization",
    "@id": `${HAXR_AUTH.website}/#organization`,
    name: HAXR_AUTH.brand,
    url: HAXR_AUTH.website,
    email: HAXR_AUTH.email.hello,
    slogan: HAXR_AUTH.motto,
    description: HAXR_AUTH.studioDescription,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Maputo",
      addressCountry: "MZ",
    },
    sameAs: [HAXR_AUTH.social.instagram],
  };
}

export function buildWebPageJsonLd(name: string, url: string) {
  return {
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    name,
    url,
    isPartOf: {
      "@id": `${getEditionSiteUrl()}/#website`,
    },
    publisher: {
      "@id": `${HAXR_AUTH.website}/#organization`,
    },
    inLanguage: "pt-MZ",
    copyrightHolder: {
      "@id": `${HAXR_AUTH.website}/#organization`,
    },
  };
}

export function buildAuthorshipJsonLd(page?: { name: string; url: string }) {
  const website = {
    "@type": "WebSite",
    "@id": `${getEditionSiteUrl()}/#website`,
    name: HAXR_AUTH.product,
    url: getEditionSiteUrl(),
    publisher: {
      "@id": `${HAXR_AUTH.website}/#organization`,
    },
    inLanguage: "pt-MZ",
  };

  const graph: Record<string, unknown>[] = [buildOrganizationJsonLd(), website];
  if (page) {
    graph.push(buildWebPageJsonLd(page.name, page.url));
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

/** Crédito visível compacto — footers e passes */
export function formatStudioCredit(): string {
  return `Convite digital · ${HAXR_AUTH.brand}`;
}

/** Assinatura para emails transaccionais */
export function formatEmailSignature(): string {
  return `${HAXR_AUTH.brand} · ${HAXR_AUTH.tagline}`;
}
