import type { MetadataRoute } from "next";

/**
 * Invitations stay out of search indexes (default * Disallow),
 * but social crawlers must be allowed so WhatsApp/Facebook/X
 * can fetch Open Graph title, description, and share image.
 */
export default function robots(): MetadataRoute.Robots {
  const socialPreviewBots = [
    "facebookexternalhit",
    "Facebot",
    "WhatsApp",
    "Twitterbot",
    "LinkedInBot",
    "Slackbot",
    "Discordbot",
  ];

  return {
    rules: [
      ...socialPreviewBots.map((userAgent) => ({
        userAgent,
        allow: "/",
      })),
      {
        userAgent: "*",
        disallow: "/",
      },
    ],
  };
}
