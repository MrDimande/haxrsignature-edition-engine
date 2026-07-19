"use client";

export function JessicaSamuelEditorialHeading({
  eyebrow,
  title,
  align = "center",
  tone = "default",
  compact = false,
  className = "",
}: {
  eyebrow?: string;
  title: string;
  align?: "center" | "left";
  tone?: "default" | "light" | "on-wine";
  compact?: boolean;
  className?: string;
}) {
  const titleClass = [
    "js-wedding-editorial-heading__title",
    tone === "light" ? "js-wedding-editorial-heading__title--light" : "",
    compact ? "js-wedding-editorial-heading__title--compact" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={`js-wedding-editorial-heading ${
        align === "center"
          ? "js-wedding-editorial-heading--center"
          : "js-wedding-editorial-heading--left"
      } ${tone === "on-wine" ? "js-wedding-editorial-heading--on-wine" : ""} ${className}`.trim()}
    >
      {eyebrow ? (
        <p className="js-wedding-editorial-heading__eyebrow">{eyebrow}</p>
      ) : null}
      <h2 className={titleClass}>{title}</h2>
      <div className="js-wedding-editorial-heading__divider" aria-hidden />
    </div>
  );
}
