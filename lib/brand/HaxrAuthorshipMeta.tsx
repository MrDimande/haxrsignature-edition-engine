import { HAXR_AUTH, buildAuthorshipJsonLd } from "@lib/brand/authorship";

type HaxrAuthorshipMetaProps = {
  pageName?: string;
  pageUrl?: string;
};

export function HaxrAuthorshipMeta({
  pageName,
  pageUrl,
}: HaxrAuthorshipMetaProps) {
  const jsonLd = buildAuthorshipJsonLd(
    pageName && pageUrl ? { name: pageName, url: pageUrl } : undefined
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <span className="sr-only">
        {HAXR_AUTH.product} — convite digital desenvolvido por {HAXR_AUTH.brand}
      </span>
    </>
  );
}
